import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type User = {
  id: string;
  email: string;
  name: string;
  role: 'faculty' | 'student';
  avatar?: string;
  institution?: string;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  course_code: string;
  course_name: string;
  professor_id: string;
  professor_name: string;
  semester_start: string;
  semester_end: string;
  join_code: string;
  created_at: string;
  updated_at: string;
};

export type ClassSession = {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

export type CourseStudent = {
  id: string;
  course_id: string;
  student_id: string;
  joined_at: string;
  students?: User;
};

export type ScheduleSlot = {
  day: number; // 1=Monday, 2=Tuesday, ..., 5=Friday
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
};
