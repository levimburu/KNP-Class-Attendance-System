-- =====================================================================
--  KNP Academic Attendance Management & Analytics System
--  0001_schema.sql  -  core relational schema
--  Run order: 0001_schema -> 0002_rls -> 0003_seed
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('admin','hod','lecturer','management','student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entity_status as enum ('active','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum ('enrolled','deferred','completed','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('scheduled','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present','absent','late','excused');
exception when duplicate_object then null; end $$;

-- ---------- updated_at trigger helper ----------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- ---------- institutions ----------
create table if not exists institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  crest_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- departments ----------
create table if not exists departments (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions(id) on delete restrict,
  name            text not null,
  code            text not null,
  description     text,
  hod_id          uuid,                          -- FK added after lecturers exists
  status          entity_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (institution_id, code)
);

-- ---------- programmes (a.k.a. courses) ----------
create table if not exists programmes (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete restrict,
  name          text not null,
  code          text not null,
  award         text,                             -- e.g. Diploma, Certificate
  description   text,
  status        entity_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (department_id, code)
);

-- ---------- intakes / cohorts ----------
create table if not exists intakes (
  id             uuid primary key default gen_random_uuid(),
  programme_id   uuid not null references programmes(id) on delete restrict,
  label          text not null,                   -- "September 2023 Intake"
  intake_month   int check (intake_month between 1 and 12),
  intake_year    int,
  academic_year  text,
  start_date     date,
  expected_end   date,
  status         entity_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- class groups ----------
create table if not exists class_groups (
  id             uuid primary key default gen_random_uuid(),
  programme_id   uuid not null references programmes(id) on delete restrict,
  intake_id      uuid not null references intakes(id) on delete restrict,
  name           text not null,                   -- "Level 6 / 251 / EIC"
  level          text,
  semester       text,
  status         entity_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- lecturers / staff ----------
create table if not exists lecturers (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions(id) on delete restrict,
  department_id   uuid references departments(id) on delete set null,
  staff_no        text,
  full_name       text not null,
  email           text,
  phone           text,
  device_code     text,                           -- the number typed on the device
  status          entity_status not null default 'active',
  user_id         uuid,                           -- -> auth.users (profiles.id)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (institution_id, staff_no)
);

-- departments.hod_id -> lecturers.id (added now that lecturers exists)
do $$ begin
  alter table departments
    add constraint departments_hod_fk
    foreign key (hod_id) references lecturers(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------- students ----------
create table if not exists students (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references institutions(id) on delete restrict,
  admission_no     text not null,
  full_name        text not null,
  programme_id     uuid references programmes(id) on delete set null,
  intake_id        uuid references intakes(id) on delete set null,
  class_group_id   uuid references class_groups(id) on delete set null,
  finger_slot      int,                            -- maps to the device sensor slot
  enrollment_date  date,
  status           enrollment_status not null default 'enrolled',
  email            text,
  phone            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (institution_id, admission_no)
);

-- ---------- units / subjects ----------
create table if not exists units (
  id            uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete restrict,
  code          text not null,
  name          text not null,
  description   text,
  status        entity_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (institution_id, code)
);

-- units <-> programmes (a unit can apply to several programmes)
create table if not exists programme_units (
  programme_id uuid not null references programmes(id) on delete cascade,
  unit_id      uuid not null references units(id) on delete cascade,
  primary key (programme_id, unit_id)
);

-- ---------- app users / profiles (mirror of auth.users) ----------
create table if not exists profiles (
  id            uuid primary key,                 -- = auth.users.id
  full_name     text,
  email         text,
  role          user_role not null default 'lecturer',
  department_id uuid references departments(id) on delete set null,
  lecturer_id   uuid references lecturers(id) on delete set null,
  status        entity_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- teaching assignments ----------
create table if not exists teaching_assignments (
  id             uuid primary key default gen_random_uuid(),
  lecturer_id    uuid not null references lecturers(id) on delete restrict,
  unit_id        uuid not null references units(id) on delete restrict,
  class_group_id uuid not null references class_groups(id) on delete restrict,
  academic_term  text,
  start_date     date,
  end_date       date,
  status         entity_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (lecturer_id, unit_id, class_group_id, academic_term)
);

-- ---------- scheduled sessions ----------
create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid references teaching_assignments(id) on delete set null,
  unit_id         uuid not null references units(id) on delete restrict,
  class_group_id  uuid not null references class_groups(id) on delete restrict,
  lecturer_id     uuid not null references lecturers(id) on delete restrict,
  session_date    date not null,
  start_time      time,
  end_time        time,
  venue           text,
  session_type    text,
  status          session_status not null default 'scheduled',
  attendance_submitted boolean not null default false,
  source_ref      text,                            -- original Session ID from Sheets
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- attendance records ----------
create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  student_id    uuid not null references students(id) on delete restrict,
  status        attendance_status not null default 'present',
  time_in       time,
  recorded_by   uuid references profiles(id) on delete set null,
  correction_reason text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (session_id, student_id)                  -- one record per student per session
);

-- ---------- audit logs ----------
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_programmes_dept    on programmes(department_id);
create index if not exists idx_intakes_prog       on intakes(programme_id);
create index if not exists idx_cg_prog            on class_groups(programme_id);
create index if not exists idx_cg_intake          on class_groups(intake_id);
create index if not exists idx_students_prog      on students(programme_id);
create index if not exists idx_students_intake    on students(intake_id);
create index if not exists idx_students_cg        on students(class_group_id);
create index if not exists idx_students_adm       on students(admission_no);
create index if not exists idx_ta_lecturer        on teaching_assignments(lecturer_id);
create index if not exists idx_ta_unit            on teaching_assignments(unit_id);
create index if not exists idx_ta_cg              on teaching_assignments(class_group_id);
create index if not exists idx_sessions_date      on sessions(session_date);
create index if not exists idx_sessions_cg        on sessions(class_group_id);
create index if not exists idx_sessions_unit      on sessions(unit_id);
create index if not exists idx_sessions_lecturer  on sessions(lecturer_id);
create index if not exists idx_att_session        on attendance(session_id);
create index if not exists idx_att_student        on attendance(student_id);
create index if not exists idx_att_status         on attendance(status);
create index if not exists idx_audit_entity       on audit_logs(entity, entity_id);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array[
    'institutions','departments','programmes','intakes','class_groups',
    'lecturers','students','units','profiles','teaching_assignments',
    'sessions','attendance'
  ]
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on %1$s;
       create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;
