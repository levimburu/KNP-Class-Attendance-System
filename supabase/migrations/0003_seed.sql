-- =====================================================================
--  0003_seed.sql  -  DEMO seed data (clearly fictional; editable)
--  Safe to run once on a fresh database. Re-running is skipped if the
--  institution already exists.
--
--  NOTE: auth users are created through Supabase Auth (sign up in the app).
--  To make yourself admin after signing up, run:
--     update profiles set role = 'admin' where email = 'you@example.com';
-- =====================================================================

do $$
declare
  inst uuid;
  dept uuid;
  prog uuid;
  intake23 uuid; intake26 uuid;
  cg_a uuid; cg_b uuid;
  u_cs uuid; u_ei uuid; u_cm uuid; u_ci uuid;
  lec_kevin uuid; lec_steve uuid;
begin
  -- run only on an empty institution table
  if exists (select 1 from institutions) then
    raise notice 'Seed skipped: institutions already present.';
    return;
  end if;

  insert into institutions (name, short_name)
    values ('Kitale National Polytechnic','KNP') returning id into inst;

  insert into departments (institution_id, name, code, description)
    values (inst,'Electrical and Electronics Engineering','EEE',
            'Demo department (editable). Not a verified catalogue.')
    returning id into dept;

  insert into programmes (department_id, name, code, award)
    values (dept,'Instrumentation and Control System Engineering','ICSE','Diploma')
    returning id into prog;

  insert into intakes (programme_id, label, intake_month, intake_year, academic_year, start_date)
    values (prog,'September 2023 Intake',9,2023,'2023/2024','2023-09-01')
    returning id into intake23;
  insert into intakes (programme_id, label, intake_month, intake_year, academic_year, start_date)
    values (prog,'January 2026 Intake',1,2026,'2025/2026','2026-01-13')
    returning id into intake26;

  insert into class_groups (programme_id, intake_id, name, level, semester)
    values (prog, intake23,'ICSE Level 6 / Sep23','Level 6','Sem 1')
    returning id into cg_a;
  insert into class_groups (programme_id, intake_id, name, level, semester)
    values (prog, intake26,'ICSE Level 4 / Jan26','Level 4','Sem 1')
    returning id into cg_b;

  insert into units (institution_id, code, name) values (inst,'67462','Control Systems') returning id into u_cs;
  insert into units (institution_id, code, name) values (inst,'4556455','Electrical Installation') returning id into u_ei;
  insert into units (institution_id, code, name) values (inst,'576','Communication Skills') returning id into u_cm;
  insert into units (institution_id, code, name) values (inst,'673928','Components Installation') returning id into u_ci;

  insert into programme_units (programme_id, unit_id)
    values (prog,u_cs),(prog,u_ei),(prog,u_cm),(prog,u_ci);

  insert into lecturers (institution_id, department_id, staff_no, full_name, email, device_code)
    values (inst, dept,'KNP-EEE-001','Kevin Wahisi','kevin.demo@knp.ac.ke','1024')
    returning id into lec_kevin;
  insert into lecturers (institution_id, department_id, staff_no, full_name, email, device_code)
    values (inst, dept,'KNP-EEE-002','Steve Maebo Ngore','steve.demo@knp.ac.ke','2087')
    returning id into lec_steve;

  -- set HOD (demo)
  update departments set hod_id = lec_kevin where id = dept;

  -- demo students (clearly fictional)
  insert into students (institution_id, admission_no, full_name, programme_id, intake_id, class_group_id, finger_slot, enrollment_date)
  values
    (inst,'EE-DICL/4456081/25','Levi Mburu',   prog, intake23, cg_a, 4,'2023-09-01'),
    (inst,'EE-DETL/498723/23','Mary Kalimi',    prog, intake23, cg_a, null,'2023-09-01'),
    (inst,'EE-DICL/4456081/23','Brian Waswa',   prog, intake23, cg_a, null,'2023-09-01'),
    (inst,'EE-DEPL/7836078/26','Donald Ruto',   prog, intake26, cg_b, null,'2026-01-13'),
    (inst,'EE-DEPL/48769/26','Otieno Gearge',   prog, intake26, cg_b, null,'2026-01-13');

  -- teaching assignments (demo)
  insert into teaching_assignments (lecturer_id, unit_id, class_group_id, academic_term)
  values
    (lec_kevin, u_ei, cg_a,'2025/2026 S1'),
    (lec_steve, u_cs, cg_a,'2025/2026 S1'),
    (lec_kevin, u_cm, cg_b,'2025/2026 S1');

  raise notice 'Demo seed complete for Kitale National Polytechnic.';
end $$;
