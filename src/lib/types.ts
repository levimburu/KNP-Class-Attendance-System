export type Role = "admin" | "hod" | "lecturer" | "management" | "student";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  department_id: string | null;
  lecturer_id: string | null;
  status: "active" | "inactive";
}

export interface Department {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description: string | null;
  hod_id: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface Student {
  id: string;
  admission_no: string;
  full_name: string;
  programme_id: string | null;
  intake_id: string | null;
  class_group_id: string | null;
  finger_slot: number | null;
  status: string;
}

export interface AttendanceRow {
  id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  time_in: string | null;
  created_at: string;
}
