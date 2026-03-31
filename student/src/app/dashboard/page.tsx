'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, GraduationCap, Library, Plus } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import JoinCourseModal from '@/components/JoinCourseModal';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { fetchPublishedGradesForStudent, getAuthenticatedStudent } from '@/lib/portal';
import { Course, supabase, User } from '@/lib/supabase';

interface AssignmentSummary {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
}

interface ResourceSummary {
  id: string;
  course_id: string;
  title: string;
  created_at: string;
}

export default function StudentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [gradeCount, setGradeCount] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return;
    }

    setUser(student);
    await Promise.all([
      loadCourses(student.id),
      loadPublishedGrades(student.email),
    ]);
    setLoading(false);
  }

  async function loadCourses(studentId: string) {
    const { data: enrollments } = await supabase
      .from('course_students')
      .select('course_id')
      .eq('student_id', studentId);

    const courseIds = (enrollments ?? []).map((item) => item.course_id);
    if (courseIds.length === 0) {
      setCourses([]);
      setAssignments([]);
      setResources([]);
      return;
    }

    const [courseResponse, assignmentResponse, resourceResponse] = await Promise.all([
      supabase.from('courses').select('*').in('id', courseIds).order('created_at', { ascending: false }),
      supabase.from('assignments').select('id, course_id, title, due_date').in('course_id', courseIds).order('due_date', { ascending: true }).limit(8),
      supabase.from('course_resources').select('id, course_id, title, created_at').in('course_id', courseIds).order('created_at', { ascending: false }).limit(8),
    ]);

    setCourses(courseResponse.data ?? []);
    setAssignments((assignmentResponse.data ?? []) as AssignmentSummary[]);
    setResources((resourceResponse.data ?? []) as ResourceSummary[]);
  }

  async function loadPublishedGrades(studentEmail: string) {
    const grades = await fetchPublishedGradesForStudent(studentEmail);
    setGradeCount(grades.length);
  }

  async function handleCourseJoined() {
    if (user) {
      await loadCourses(user.id);
    }
    setShowJoinModal(false);
  }

  const recentAssignments = useMemo(() => assignments.slice(0, 4), [assignments]);
  const recentResources = useMemo(() => resources.slice(0, 4), [resources]);

  if (!user) {
    return (
      <PageContainer className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl bg-surfaceLight" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
          <header className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary">Student Workspace</p>
                <h1 className="mt-3 text-4xl font-bold text-textPrimary">Everything except attendance, now on the web.</h1>
                <p className="mt-3 max-w-3xl text-textSecondary">
                  Open courses, keep up with resources and assignments, join discussions, and see published grades in one place.
                </p>
              </div>
              <Button
                onClick={() => setShowJoinModal(true)}
                className="px-5 py-3"
              >
                <Plus className="h-5 w-5" />
                Join course
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BookOpen} label="Enrolled courses" value={courses.length} hint="Your current academic workspace" />
            <StatCard icon={FileText} label="Upcoming assignments" value={assignments.length} hint="Deadlines from your active courses" />
            <StatCard icon={Library} label="Recent resources" value={resources.length} hint="Fresh materials shared by faculty" />
            <StatCard icon={GraduationCap} label="Published grades" value={gradeCount} hint="Visible after faculty publishes them" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
            <SectionCard title="Courses" description="Open a course to see resources, assignments, and discussions.">
              {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="h-48 animate-pulse rounded-3xl bg-surfaceLight" />
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Card
                    onClick={() => setShowJoinModal(true)}
                    className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-surface px-6 text-center transition hover:border-primary"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Plus className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-textPrimary">Join a new course</h3>
                    <p className="mt-2 max-w-xs text-sm text-textSecondary">
                      Use the course code from your professor to enroll and unlock the LMS workspace.
                    </p>
                  </Card>
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-surfaceLight p-10 text-center">
                  <h3 className="text-2xl font-semibold text-textPrimary">No courses yet</h3>
                  <p className="mt-2 text-textSecondary">Join your first course to start using the student portal.</p>
                </div>
              )}
            </SectionCard>

            <div className="space-y-6">
              <SectionCard
                title="Assignments"
                description="Immediate deadlines from your enrolled courses."
                action={<Link href="/dashboard/grades" className="text-sm text-primary hover:text-primaryHover">View grades</Link>}
              >
                {recentAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surfaceLight p-4 text-sm text-textSecondary">No assignments yet.</div>
                ) : (
                  <div className="space-y-3">
                    {recentAssignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-2xl border border-border bg-surfaceLight p-4">
                        <p className="font-medium text-textPrimary">{assignment.title}</p>
                        <p className="mt-1 text-sm text-textSecondary">
                          Due {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Not set'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Resources" description="Latest materials uploaded across your courses.">
                {recentResources.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surfaceLight p-4 text-sm text-textSecondary">No resources yet.</div>
                ) : (
                  <div className="space-y-3">
                    {recentResources.map((resource) => (
                      <div key={resource.id} className="rounded-2xl border border-border bg-surfaceLight p-4">
                        <p className="font-medium text-textPrimary">{resource.title}</p>
                        <p className="mt-1 text-sm text-textSecondary">
                          Added {new Date(resource.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        {showJoinModal ? (
        <JoinCourseModal userId={user.id} onClose={() => setShowJoinModal(false)} onSuccess={handleCourseJoined} />
        ) : null}
      </PageContainer>
    </>
  );
}
