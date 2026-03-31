import { supabase, User } from '@/lib/supabase';

export interface PublishedGradeRow {
  id: string;
  course_id: string;
  total_marks: number;
  grade: string;
  rank: number | null;
  breakdown: Record<string, number>;
  created_at: string;
  course_name?: string;
}

export async function getAuthenticatedStudent() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

  if (error || !data || data.role !== 'student') {
    return null;
  }

  return data as User;
}

export async function fetchPublishedGradesForStudent(studentEmail: string) {
  const { data, error } = await supabase
    .from('course_grades')
    .select('id, course_id, total_marks, grade, rank, breakdown, created_at')
    .eq('student_email', studentEmail)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const grades = (data ?? []) as PublishedGradeRow[];
  const courseIds = Array.from(new Set(grades.map((grade) => grade.course_id)));

  if (courseIds.length === 0) {
    return grades;
  }

  const { data: courseRows, error: courseError } = await supabase
    .from('courses')
    .select('id, course_name')
    .in('id', courseIds);

  if (courseError) {
    throw courseError;
  }

  const courseNames = new Map((courseRows ?? []).map((course) => [course.id, course.course_name]));

  return grades.map((grade) => ({
    ...grade,
    course_name: courseNames.get(grade.course_id) ?? grade.course_id,
  }));
}
