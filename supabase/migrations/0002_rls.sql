-- =====================================================================
--  0002_rls.sql  -  Row Level Security
--  Roles: admin, management (read-all), hod (department-scoped),
--         lecturer (own teaching), student (own records, optional)
-- =====================================================================

-- ---------- helper functions (security definer, read profiles) ----------
create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function auth_dept() returns uuid
  language sql stable security definer set search_path = public as $$
  select department_id from profiles where id = auth.uid()
$$;

create or replace function auth_lecturer() returns uuid
  language sql stable security definer set search_path = public as $$
  select lecturer_id from profiles where id = auth.uid()
$$;

create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false)
$$;

create or replace function is_mgmt() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin','management'), false)
$$;

-- department of a class group (for scoping sessions/attendance)
create or replace function dept_of_class_group(cg uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select p.department_id from class_groups c
  join programmes p on p.id = c.programme_id
  where c.id = cg
$$;

-- ---------- enable RLS on all tables ----------
do $$
declare t text;
begin
  foreach t in array array[
    'institutions','departments','programmes','intakes','class_groups',
    'lecturers','students','units','programme_units','profiles',
    'teaching_assignments','sessions','attendance','audit_logs'
  ]
  loop
    execute format('alter table %s enable row level security;', t);
  end loop;
end $$;

-- ---------- academic structure: read = any authenticated, write = admin ----------
do $$
declare t text;
begin
  foreach t in array array[
    'institutions','departments','programmes','intakes','class_groups',
    'lecturers','units','programme_units','teaching_assignments'
  ]
  loop
    execute format('drop policy if exists %1$s_read on %1$s;', t);
    execute format('create policy %1$s_read on %1$s for select to authenticated using (true);', t);
    execute format('drop policy if exists %1$s_write on %1$s;', t);
    execute format('create policy %1$s_write on %1$s for all to authenticated using (is_admin()) with check (is_admin());', t);
  end loop;
end $$;

-- ---------- profiles ----------
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles for select to authenticated
  using (id = auth.uid() or is_mgmt());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- students (scoped reads) ----------
drop policy if exists students_read on students;
create policy students_read on students for select to authenticated using (
  is_mgmt()
  or (auth_role() = 'hod' and exists (
        select 1 from programmes p where p.id = students.programme_id and p.department_id = auth_dept()))
  or (auth_role() = 'lecturer' and exists (
        select 1 from teaching_assignments ta
        where ta.lecturer_id = auth_lecturer() and ta.class_group_id = students.class_group_id))
);

drop policy if exists students_write on students;
create policy students_write on students for all to authenticated
  using (is_admin()
         or (auth_role() = 'hod' and exists (
              select 1 from programmes p where p.id = students.programme_id and p.department_id = auth_dept())))
  with check (is_admin()
         or (auth_role() = 'hod' and exists (
              select 1 from programmes p where p.id = students.programme_id and p.department_id = auth_dept())));

-- ---------- sessions (scoped) ----------
drop policy if exists sessions_read on sessions;
create policy sessions_read on sessions for select to authenticated using (
  is_mgmt()
  or (auth_role() = 'hod' and dept_of_class_group(class_group_id) = auth_dept())
  or (auth_role() = 'lecturer' and lecturer_id = auth_lecturer())
);

drop policy if exists sessions_write on sessions;
create policy sessions_write on sessions for all to authenticated
  using (is_admin()
         or (auth_role() = 'hod' and dept_of_class_group(class_group_id) = auth_dept())
         or (auth_role() = 'lecturer' and lecturer_id = auth_lecturer()))
  with check (is_admin()
         or (auth_role() = 'hod' and dept_of_class_group(class_group_id) = auth_dept())
         or (auth_role() = 'lecturer' and lecturer_id = auth_lecturer()));

-- ---------- attendance (follows session visibility) ----------
drop policy if exists attendance_read on attendance;
create policy attendance_read on attendance for select to authenticated using (
  is_mgmt()
  or exists (select 1 from sessions s where s.id = attendance.session_id and (
        (auth_role() = 'hod' and dept_of_class_group(s.class_group_id) = auth_dept())
        or (auth_role() = 'lecturer' and s.lecturer_id = auth_lecturer())))
);

drop policy if exists attendance_write on attendance;
create policy attendance_write on attendance for all to authenticated
  using (is_admin()
         or exists (select 1 from sessions s where s.id = attendance.session_id
                    and auth_role() = 'lecturer' and s.lecturer_id = auth_lecturer()))
  with check (is_admin()
         or exists (select 1 from sessions s where s.id = attendance.session_id
                    and auth_role() = 'lecturer' and s.lecturer_id = auth_lecturer()));

-- ---------- audit logs: read by management, insert by any authenticated, no edit/delete ----------
drop policy if exists audit_read on audit_logs;
create policy audit_read on audit_logs for select to authenticated using (is_mgmt());

drop policy if exists audit_insert on audit_logs;
create policy audit_insert on audit_logs for insert to authenticated with check (true);

-- ---------- auto-create a profile when a new auth user signs up ----------
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'lecturer')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
