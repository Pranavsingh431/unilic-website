'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, FileSpreadsheet, MessageSquare, Paperclip, Plus, Users } from 'lucide-react';

import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import { Assignment, AssignmentSubmission, CourseResource, DiscussionThread, getAuthenticatedFaculty, ThreadReply } from '@/lib/portal';
import { formatDate } from '@/lib/utils';
import { Course, supabase, User } from '@/lib/supabase';

interface CourseStudentView {
  student_id: string;
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

interface ThreadWithReplies extends DiscussionThread {
  replies: ThreadReply[];
}

export default function FacultyCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudentView[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, AssignmentSubmission[]>>({});
  const [threads, setThreads] = useState<ThreadWithReplies[]>([]);
  const [resourceDraft, setResourceDraft] = useState({ title: '', file_url: '' });
  const [assignmentDraft, setAssignmentDraft] = useState({ title: '', description: '', due_date: '' });
  const [threadDraft, setThreadDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'assignments' | 'discussions' | 'students'>('resources');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [courseId]);

  async function bootstrap() {
    const faculty = await getAuthenticatedFaculty();
    if (!faculty) {
      router.push('/auth');
      return;
    }

    setUser(faculty);
    await Promise.all([
      loadCourse(faculty.id),
      loadResources(),
      loadAssignments(),
      loadThreads(),
      loadStudents(),
    ]);
    setLoading(false);
  }

  async function loadCourse(userId: string) {
    const { data, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('professor_id', userId)
      .single();

    if (courseError || !data) {
      router.push('/dashboard');
      return;
    }

    setCourse(data);
  }

  async function loadStudents() {
    const { data: enrollments, error: enrollmentError } = await supabase.rpc(
      'get_enrolled_students',
      { p_course_id: courseId }
    );

    if (!enrollmentError) {
      setStudents(
        ((enrollments ?? []) as Array<Omit<CourseStudentView, 'id'>>).map((student) => ({
          ...student,
          id: student.student_id,
        }))
      );
      return;
    }

    const { data: courseStudents, error: courseStudentsError } = await supabase
      .from('course_students')
      .select('student_id, joined_at')
      .eq('course_id', courseId);

    if (courseStudentsError) {
      setError(enrollmentError.message);
      return;
    }

    const studentIds = (courseStudents ?? []).map((student) => student.student_id);
    if (studentIds.length === 0) {
      setStudents([]);
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', studentIds);

    if (usersError) {
      setError(usersError.message);
      return;
    }

    const usersById = new Map((users ?? []).map((student) => [student.id, student]));
    setStudents(
      (courseStudents ?? []).flatMap((student) => {
        const profile = usersById.get(student.student_id);
        if (!profile) {
          return [];
        }

        return [
          {
            id: student.student_id,
            student_id: student.student_id,
            name: profile.name,
            email: profile.email,
            joined_at: student.joined_at,
          },
        ];
      })
    );
  }

  async function loadResources() {
    const { data, error: resourcesError } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (resourcesError) {
      setError(resourcesError.message);
      return;
    }

    setResources((data ?? []) as CourseResource[]);
  }

  async function loadAssignments() {
    const { data, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      setError(assignmentsError.message);
      return;
    }

    const assignmentRows = (data ?? []) as Assignment[];
    setAssignments(assignmentRows);

    if (assignmentRows.length === 0) {
      setSubmissionsByAssignment({});
      return;
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .in('assignment_id', assignmentRows.map((assignment) => assignment.id))
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      setError(submissionsError.message);
      return;
    }

    const grouped = (submissions ?? []).reduce<Record<string, AssignmentSubmission[]>>((accumulator, submission) => {
      if (!accumulator[submission.assignment_id]) {
        accumulator[submission.assignment_id] = [];
      }
      accumulator[submission.assignment_id].push(submission as AssignmentSubmission);
      return accumulator;
    }, {});
    setSubmissionsByAssignment(grouped);
  }

  async function loadThreads() {
    const { data: threadRows, error: threadError } = await supabase
      .from('course_threads')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (threadError) {
      setError(threadError.message);
      return;
    }

    const threadsData = (threadRows ?? []) as DiscussionThread[];
    if (threadsData.length === 0) {
      setThreads([]);
      return;
    }

    const { data: replies, error: repliesError } = await supabase
      .from('thread_replies')
      .select('*')
      .in('thread_id', threadsData.map((thread) => thread.id))
      .order('created_at', { ascending: true });

    if (repliesError) {
      setError(repliesError.message);
      return;
    }

    const repliesByThread = (replies ?? []).reduce<Record<string, ThreadReply[]>>((accumulator, reply) => {
      if (!accumulator[reply.thread_id]) {
        accumulator[reply.thread_id] = [];
      }
      accumulator[reply.thread_id].push(reply as ThreadReply);
      return accumulator;
    }, {});

    setThreads(
      threadsData.map((thread) => ({
        ...thread,
        replies: repliesByThread[thread.id] ?? [],
      }))
    );
  }

  async function createResource(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('course_resources').insert({
      course_id: courseId,
      title: resourceDraft.title.trim(),
      file_url: resourceDraft.file_url.trim(),
      uploaded_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setResourceDraft({ title: '', file_url: '' });
    await loadResources();
  }

  async function createAssignment(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('assignments').insert({
      course_id: courseId,
      title: assignmentDraft.title.trim(),
      description: assignmentDraft.description.trim() || null,
      due_date: assignmentDraft.due_date ? new Date(assignmentDraft.due_date).toISOString() : null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setAssignmentDraft({ title: '', description: '', due_date: '' });
    await loadAssignments();
  }

  async function createThread(event: FormEvent) {
    event.preventDefault();
    if (!user || !threadDraft.trim()) return;
    setSubmitting(true);
    setError('');

    const { error: insertError } = await supabase.from('course_threads').insert({
      course_id: courseId,
      author_id: user.id,
      author_role: 'faculty',
      content: threadDraft.trim(),
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setThreadDraft('');
    await loadThreads();
  }

  async function addReply(threadId: string, content: string) {
    if (!user || !content.trim()) return;

    const { error: insertError } = await supabase.from('thread_replies').insert({
      thread_id: threadId,
      author_id: user.id,
      author_role: 'faculty',
      content: content.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await loadThreads();
  }

  const assignmentSummary = useMemo(
    () => assignments.reduce((sum, assignment) => sum + (submissionsByAssignment[assignment.id]?.length ?? 0), 0),
    [assignments, submissionsByAssignment]
  );

  if (!user || !course) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-3xl bg-surfaceLight" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
          <div className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Link href="/dashboard" className="text-sm text-primary hover:text-primaryHover">
                  ← Back to dashboard
                </Link>
                <h1 className="mt-4 text-4xl font-bold text-textPrimary">{course.course_name}</h1>
                <p className="mt-2 text-textSecondary">{course.course_code}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-textSecondary">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(course.semester_start)} - {formatDate(course.semester_end)}</span>
                  <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {students.length} enrolled</span>
                </div>
              </div>
              <Link
                href={`/dashboard/upload-marks?courseId=${course.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primaryHover"
              >
                <FileSpreadsheet className="h-5 w-5" />
                Upload marks for this course
              </Link>
            </div>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard icon={Users} label="Enrolled students" value={students.length} hint="Roster synced from course enrollments" />
            <StatCard icon={Paperclip} label="Resources" value={resources.length} hint="Reference files and links shared with students" />
            <StatCard icon={MessageSquare} label="Discussions" value={threads.length} hint={`${assignmentSummary} assignment submission${assignmentSummary === 1 ? '' : 's'} received`} />
          </div>

          <div className="flex flex-wrap gap-3">
            {(['resources', 'assignments', 'discussions', 'students'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'border border-border bg-surfaceLight text-textSecondary hover:border-primary hover:text-textPrimary'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'resources' ? (
            <SectionCard title="Resources" description="Share links, notes, and reading material with the class.">
              <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                <form onSubmit={createResource} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">Resource title</label>
                    <Input
                      value={resourceDraft.title}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Lecture 05 slides"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">File or drive link</label>
                    <Input
                      value={resourceDraft.file_url}
                      onChange={(event) => setResourceDraft((current) => ({ ...current, file_url: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    Add resource
                  </Button>
                </form>

                <div className="space-y-4">
                  {resources.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-6 text-textSecondary">No resources uploaded yet.</div>
                  ) : (
                    resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-primary"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-textPrimary">{resource.title}</p>
                            <p className="mt-2 text-sm text-textSecondary">Added {new Date(resource.created_at).toLocaleString()}</p>
                          </div>
                          <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'assignments' ? (
            <SectionCard title="Assignments" description="Create deadlines and review student submissions from one place.">
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <form onSubmit={createAssignment} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">Assignment title</label>
                    <Input
                      value={assignmentDraft.title}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, title: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">Description</label>
                    <Textarea
                      value={assignmentDraft.description}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, description: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">Due date</label>
                    <Input
                      type="datetime-local"
                      value={assignmentDraft.due_date}
                      onChange={(event) => setAssignmentDraft((current) => ({ ...current, due_date: event.target.value }))}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    Create assignment
                  </Button>
                </form>

                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-6 text-textSecondary">No assignments created yet.</div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-medium text-textPrimary">{assignment.title}</p>
                            <p className="mt-2 text-sm text-textSecondary">{assignment.description || 'No description provided.'}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-surfaceLight px-3 py-2 text-sm text-textSecondary">
                            Due {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Not set'}
                          </div>
                        </div>
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="text-sm font-medium text-textPrimary">Submissions ({submissionsByAssignment[assignment.id]?.length ?? 0})</p>
                          <div className="mt-3 space-y-2">
                            {(submissionsByAssignment[assignment.id] ?? []).length === 0 ? (
                              <p className="text-sm text-textSecondary">No submissions yet.</p>
                            ) : (
                              (submissionsByAssignment[assignment.id] ?? []).map((submission) => (
                                <a
                                  key={submission.id}
                                  href={submission.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-between rounded-xl border border-border bg-surfaceLight px-4 py-3 text-sm text-textPrimary transition hover:border-primary"
                                >
                                  <span>{submission.student_id}</span>
                                  <span className="text-textSecondary">
                                    {submission.grade !== null ? `Grade ${submission.grade}` : 'Ungraded'}
                                  </span>
                                </a>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'discussions' ? (
            <SectionCard title="Discussions" description="Keep course conversations moving with faculty-led and student-led threads.">
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <form onSubmit={createThread} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
                  <div>
                    <label className="mb-2 block text-sm text-textSecondary">Start a new thread</label>
                    <Textarea
                      value={threadDraft}
                      onChange={(event) => setThreadDraft(event.target.value)}
                      className="min-h-[180px]"
                      placeholder="Share an announcement, ask a question, or leave guidance for the class."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !threadDraft.trim()}
                  >
                    <Plus className="h-4 w-4" />
                    Post thread
                  </Button>
                </form>

                <div className="space-y-4">
                  {threads.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-6 text-textSecondary">No discussions yet.</div>
                  ) : (
                    threads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} onReply={addReply} />
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'students' ? (
            <SectionCard title="Enrolled students" description="Current roster synced from the shared Supabase backend.">
              {students.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-6 text-textSecondary">No students have joined this course yet.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {students.map((student) => (
                    <div key={student.id} className="rounded-2xl border border-border bg-surface p-4">
                      <p className="font-medium text-textPrimary">{student.name}</p>
                      <p className="mt-1 text-sm text-textSecondary">{student.email}</p>
                      <p className="mt-2 text-xs text-textSecondary">Joined {new Date(student.joined_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          ) : null}
    </PageContainer>
  );
}

function ThreadCard({
  thread,
  onReply,
}: {
  thread: ThreadWithReplies;
  onReply: (threadId: string, content: string) => Promise<void>;
}) {
  const [reply, setReply] = useState('');

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">{thread.author_role}</p>
          <p className="mt-2 text-textPrimary">{thread.content}</p>
        </div>
        <p className="text-xs text-textSecondary">{new Date(thread.created_at).toLocaleString()}</p>
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {thread.replies.length === 0 ? (
          <p className="text-sm text-textSecondary">No replies yet.</p>
        ) : (
          thread.replies.map((replyItem) => (
            <div key={replyItem.id} className="rounded-xl border border-border bg-surfaceLight px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-primary">{replyItem.author_role}</p>
                <p className="text-xs text-textSecondary">{new Date(replyItem.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm text-textPrimary">{replyItem.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Add a reply"
        />
        <Button
          onClick={async () => {
            if (!reply.trim()) return;
            await onReply(thread.id, reply);
            setReply('');
          }}
        >
          Reply
        </Button>
      </div>
    </div>
  );
}
