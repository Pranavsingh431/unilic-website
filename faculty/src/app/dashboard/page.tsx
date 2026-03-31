'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileSpreadsheet, FolderKanban, MessageSquare, Plus, Shapes } from 'lucide-react';

import CourseCard from '@/components/CourseCard';
import CreateCourseModal from '@/components/CreateCourseModal';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { Course, supabase, User } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  courseId: string;
  courseName: string;
  type: 'resource' | 'assignment' | 'discussion';
  title: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!userData || userData.role !== 'faculty') {
      await supabase.auth.signOut();
      return;
    }

    setUser(userData);
    await Promise.all([loadCourses(userData.id), loadActivity(userData.id)]);
    setLoading(false);
  }

  async function loadCourses(userId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('professor_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCourses(data);
    }
  }

  async function loadActivity(userId: string) {
    const { data: professorCourses } = await supabase
      .from('courses')
      .select('id, course_name')
      .eq('professor_id', userId);

    const courseRows = professorCourses ?? [];
    const courseIds = courseRows.map((course) => course.id);
    const courseNameMap = new Map(courseRows.map((course) => [course.id, course.course_name]));

    if (courseIds.length === 0) {
      setActivity([]);
      return;
    }

    const [resourcesResponse, assignmentsResponse, threadsResponse] = await Promise.all([
      supabase
        .from('course_resources')
        .select('id, course_id, title, created_at')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('assignments')
        .select('id, course_id, title, created_at')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('course_threads')
        .select('id, course_id, content, created_at')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const merged: ActivityItem[] = [
      ...(resourcesResponse.data ?? []).map((item) => ({
        id: item.id,
        courseId: item.course_id,
        courseName: courseNameMap.get(item.course_id) ?? 'Course',
        type: 'resource' as const,
        title: item.title,
        createdAt: item.created_at,
      })),
      ...(assignmentsResponse.data ?? []).map((item) => ({
        id: item.id,
        courseId: item.course_id,
        courseName: courseNameMap.get(item.course_id) ?? 'Course',
        type: 'assignment' as const,
        title: item.title,
        createdAt: item.created_at,
      })),
      ...(threadsResponse.data ?? []).map((item) => ({
        id: item.id,
        courseId: item.course_id,
        courseName: courseNameMap.get(item.course_id) ?? 'Course',
        type: 'discussion' as const,
        title: item.content.slice(0, 80),
        createdAt: item.created_at,
      })),
    ]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8);

    setActivity(merged);
  }

  async function handleCourseCreated() {
    if (user) {
      await Promise.all([loadCourses(user.id), loadActivity(user.id)]);
    }
    setShowCreateModal(false);
  }

  const totalStudentsHint = useMemo(() => {
    return `${courses.length} active course${courses.length === 1 ? '' : 's'} on the portal`;
  }, [courses.length]);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl bg-surfaceLight" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-primary">Faculty Workspace</p>
                <h1 className="mt-3 text-4xl font-bold text-textPrimary">Administrative control for every course.</h1>
                <p className="mt-3 max-w-3xl text-base text-textSecondary">
                  Upload marks, compute grades, share resources, manage assignments, and keep discussions moving
                  from the web while attendance stays on mobile.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/upload-marks"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primaryHover"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload Marks
                </Link>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-textPrimary transition hover:border-primary"
                >
                  <Plus className="h-5 w-5" />
                  Create Course
                </button>
              </div>
            </div>
        </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={BookOpen} label="Courses" value={courses.length} hint={totalStudentsHint} />
            <StatCard icon={FolderKanban} label="Resources & Assignments" value={activity.filter((item) => item.type !== 'discussion').length} hint="Recent academic updates across your courses" />
            <StatCard icon={MessageSquare} label="Recent Discussions" value={activity.filter((item) => item.type === 'discussion').length} hint="Latest thread activity needing attention" />
            <StatCard icon={Shapes} label="Marks Workflows" value="Web Ready" hint="Upload, email, compute, save, and publish from one flow" />
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.7fr_1fr]">
            <SectionCard
              title="Courses"
              description="Every faculty course now doubles as a lightweight LMS workspace."
            >
              {loading ? (
                <div className="py-10 text-center text-dark-400">Loading courses...</div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface px-6 text-center transition hover:border-primary"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Plus className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-textPrimary">Create a new course</h3>
                    <p className="mt-2 max-w-xs text-sm text-textSecondary">
                      Add a course, generate its calendar, then manage resources, assignments, discussions, and grades.
                    </p>
                  </button>
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-surfaceLight p-10 text-center">
                  <h3 className="text-2xl font-semibold text-textPrimary">No courses yet</h3>
                  <p className="mt-2 text-textSecondary">Create your first course to unlock the full web workflow.</p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent activity"
              description="A quick read on the latest LMS events across your courses."
              action={
                <Link
                  href="/dashboard/upload-marks"
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-textSecondary transition hover:border-primary hover:text-textPrimary"
                  >
                    Open grading workspace
                  </Link>
              }
            >
              {activity.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surfaceLight p-6 text-sm text-textSecondary">
                  Resources, assignments, and discussions will start appearing here as soon as you use the course pages.
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={`/dashboard/course/${item.courseId}`}
                      className="block rounded-2xl border border-border bg-surfaceLight p-4 transition hover:border-primary"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-primary">{item.type}</p>
                          <p className="mt-1 font-medium text-textPrimary">{item.title}</p>
                          <p className="mt-1 text-sm text-textSecondary">{item.courseName}</p>
                        </div>
                        <p className="text-xs text-textSecondary">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

        {showCreateModal ? (
        <CreateCourseModal
          userId={user.id}
          userName={user.name}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCourseCreated}
        />
        ) : null}
      </div>
    </>
  );
}
