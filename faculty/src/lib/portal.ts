import { supabase, User } from '@/lib/supabase';
import type { ComputedStudent, GradePolicy, StudentMarks, WeightageConfig } from '@/lib/grading';

export interface CourseResource {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
}

export interface DiscussionThread {
  id: string;
  course_id: string;
  author_id: string;
  author_role: 'faculty' | 'student';
  content: string;
  created_at: string;
}

export interface ThreadReply {
  id: string;
  thread_id: string;
  author_id: string;
  author_role: 'faculty' | 'student';
  content: string;
  created_at: string;
}

export interface PublishedGrade {
  id: string;
  course_id: string;
  student_entry: string;
  student_email: string;
  student_name: string;
  total_marks: number;
  grade: string;
  rank: number | null;
  breakdown: Record<string, number>;
  published: boolean;
  version: number;
  created_at: string;
}

export async function getAuthenticatedFaculty() {
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

  if (error || !data || data.role !== 'faculty') {
    return null;
  }

  return data as User;
}

export async function sendGradeEmail(input: {
  student: ComputedStudent;
  professorEmail: string;
  courseName?: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const { data, error } = await supabase.functions.invoke('send-grade-email', {
    body: {
      student: input.student,
      professorEmail: input.professorEmail,
      courseName: input.courseName ?? 'Unilic Course',
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendMarksEmail(input: {
  student: StudentMarks;
  professorEmail: string;
  selectedColumns: string[];
  maxMarks: Record<string, number>;
  courseName?: string;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const { data, error } = await supabase.functions.invoke('send-marks-email', {
    body: {
      student: input.student,
      professorEmail: input.professorEmail,
      selectedColumns: input.selectedColumns,
      maxMarks: input.maxMarks,
      courseName: input.courseName ?? 'Unilic Course',
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function saveGradingConfiguration(
  courseId: string,
  weightages: WeightageConfig,
  gradePolicy: GradePolicy,
  categoryMaxMarks: Record<string, number>
) {
  const { error } = await supabase.from('grading_configurations').insert({
    course_id: courseId,
    weightages: {
      allocated_marks: weightages,
      category_max_marks: categoryMaxMarks,
    },
    grade_policy: gradePolicy,
  });

  if (error) {
    throw error;
  }
}

export async function saveComputedGrades(courseId: string, computedStudents: ComputedStudent[]) {
  const { data: latestVersionRow, error: versionError } = await supabase
    .from('course_grades')
    .select('version')
    .eq('course_id', courseId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError) {
    throw versionError;
  }

  const nextVersion = (latestVersionRow?.version ?? 0) + 1;
  const { error } = await supabase.from('course_grades').insert(
    computedStudents.map((student) => ({
      course_id: courseId,
      student_entry: student.entryNumber,
      student_email: student.email,
      student_name: student.name,
      total_marks: student.total,
      grade: student.grade,
      rank: student.rank ?? null,
      breakdown: student.categoryScores,
      published: false,
      version: nextVersion,
    }))
  );

  if (error) {
    throw error;
  }

  return nextVersion;
}

export async function publishGrades(courseId: string, version: number) {
  const { error: resetError } = await supabase
    .from('course_grades')
    .update({ published: false })
    .eq('course_id', courseId);

  if (resetError) {
    throw resetError;
  }

  const { error } = await supabase
    .from('course_grades')
    .update({ published: true })
    .eq('course_id', courseId)
    .eq('version', version);

  if (error) {
    throw error;
  }
}
