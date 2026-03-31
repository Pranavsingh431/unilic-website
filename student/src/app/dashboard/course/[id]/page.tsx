'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CalendarDays, ExternalLink, FileText, MessageSquare, Send, Upload, Users } from 'lucide-react';

import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import { getAuthenticatedStudent } from '@/lib/portal';
import { formatDate } from '@/lib/utils';
import { Course, supabase, User } from '@/lib/supabase';

interface CourseResource {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_url: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
}

interface Thread {
  id: string;
  content: string;
  author_role: 'faculty' | 'student';
  created_at: string;
}

interface Reply {
  id: string;
  thread_id: string;
  content: string;
  author_role: 'faculty' | 'student';
  created_at: string;
}

export default function StudentCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission | undefined>>({});
  const [threads, setThreads] = useState<(Thread & { replies: Reply[] })[]>([]);
  const [activeTab, setActiveTab] = useState<'resources' | 'assignments' | 'discussions'>('resources');
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, string>>({});
  const [threadDraft, setThreadDraft] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void bootstrap();
  }, [courseId]);

  async function bootstrap() {
    const student = await getAuthenticatedStudent();
    if (!student) {
      router.push('/auth');
      return;
    }

    setUser(student);
    await Promise.all([loadCourse(student.id), loadResources(), loadAssignments(student.id), loadThreads()]);
  }

  async function loadCourse(studentId: string) {
    const { data: enrollment } = await supabase
      .from('course_students')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      router.push('/dashboard');
      return;
    }

    const { data } = await supabase.from('courses').select('*').eq('id', courseId).single();
    setCourse(data ?? null);
  }

  async function loadResources() {
    const { data, error: resourceError } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (resourceError) {
      setError(resourceError.message);
      return;
    }

    setResources((data ?? []) as CourseResource[]);
  }

  async function loadAssignments(studentId: string) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('due_date', { ascending: true });

    if (assignmentError) {
      setError(assignmentError.message);
      return;
    }

    const rows = (assignmentRows ?? []) as Assignment[];
    setAssignments(rows);

    if (rows.length === 0) {
      setSubmissions({});
      return;
    }

    const { data: submissionRows, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', studentId)
      .in('assignment_id', rows.map((assignment) => assignment.id));

    if (submissionError) {
      setError(submissionError.message);
      return;
    }

    setSubmissions(
      (submissionRows ?? []).reduce<Record<string, Submission>>((accumulator, submission) => {
        accumulator[submission.assignment_id] = submission as Submission;
        return accumulator;
      }, {})
    );
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

    const rows = (threadRows ?? []) as Thread[];
    if (rows.length === 0) {
      setThreads([]);
      return;
    }

    const { data: replyRows, error: replyError } = await supabase
      .from('thread_replies')
      .select('*')
      .in('thread_id', rows.map((thread) => thread.id))
      .order('created_at', { ascending: true });

    if (replyError) {
      setError(replyError.message);
      return;
    }

    const repliesByThread = (replyRows ?? []).reduce<Record<string, Reply[]>>((accumulator, reply) => {
      if (!accumulator[reply.thread_id]) {
        accumulator[reply.thread_id] = [];
      }
      accumulator[reply.thread_id].push(reply as Reply);
      return accumulator;
    }, {});

    setThreads(rows.map((thread) => ({ ...thread, replies: repliesByThread[thread.id] ?? [] })));
  }

  async function submitAssignment(assignmentId: string) {
    if (!user || !submissionDrafts[assignmentId]?.trim()) return;

    const existing = submissions[assignmentId];
    const payload = {
      assignment_id: assignmentId,
      student_id: user.id,
      file_url: submissionDrafts[assignmentId].trim(),
    };

    const { error: submissionError } = existing
      ? await supabase.from('assignment_submissions').update({ file_url: payload.file_url }).eq('id', existing.id)
      : await supabase.from('assignment_submissions').insert(payload);

    if (submissionError) {
      setError(submissionError.message);
      return;
    }

    setSubmissionDrafts((current) => ({ ...current, [assignmentId]: '' }));
    await loadAssignments(user.id);
  }

  async function createThread(event: FormEvent) {
    event.preventDefault();
    if (!user || !threadDraft.trim()) return;

    const { error: threadError } = await supabase.from('course_threads').insert({
      course_id: courseId,
      author_id: user.id,
      author_role: 'student',
      content: threadDraft.trim(),
    });

    if (threadError) {
      setError(threadError.message);
      return;
    }

    setThreadDraft('');
    await loadThreads();
  }

  async function addReply(threadId: string, content: string) {
    if (!user || !content.trim()) return;

    const { error: replyError } = await supabase.from('thread_replies').insert({
      thread_id: threadId,
      author_id: user.id,
      author_role: 'student',
      content: content.trim(),
    });

    if (replyError) {
      setError(replyError.message);
      return;
    }

    await loadThreads();
  }

  if (!user || !course) {
    return (
      <PageContainer className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-3xl bg-surfaceLight" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
          <div className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <Link href="/dashboard" className="text-sm text-primary hover:text-primaryHover">← Back to dashboard</Link>
            <h1 className="mt-4 text-4xl font-bold text-textPrimary">{course.course_name}</h1>
            <p className="mt-2 text-textSecondary">{course.course_code}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-textSecondary">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatDate(course.semester_start)} - {formatDate(course.semester_end)}</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Faculty: {course.professor_name}</span>
            </div>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard icon={FileText} label="Assignments" value={assignments.length} hint="Deadlines and submission status" />
            <StatCard icon={Upload} label="Resources" value={resources.length} hint="Files and links shared by faculty" />
            <StatCard icon={MessageSquare} label="Discussions" value={threads.length} hint="Ask questions and follow updates" />
          </div>

          <div className="flex flex-wrap gap-3">
            {(['resources', 'assignments', 'discussions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-primary text-white' : 'border border-border bg-surfaceLight text-textSecondary hover:border-primary hover:text-textPrimary'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <Link href="/dashboard/grades" className="rounded-2xl border border-border bg-surfaceLight px-4 py-2 text-sm font-medium text-textSecondary hover:border-primary hover:text-textPrimary">My grades</Link>
          </div>

          {activeTab === 'resources' ? (
            <SectionCard title="Resources" description="Everything faculty has shared for this course.">
              {resources.length === 0 ? (
                <Card className="p-6 text-sm text-textSecondary">No resources yet.</Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {resources.map((resource) => (
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
                  ))}
                </div>
              )}
            </SectionCard>
          ) : null}

          {activeTab === 'assignments' ? (
            <SectionCard title="Assignments" description="Submit links or files and keep track of feedback.">
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <Card className="p-6 text-sm text-textSecondary">No assignments published yet.</Card>
                ) : (
                  assignments.map((assignment) => {
                    const submission = submissions[assignment.id];
                    return (
                      <Card key={assignment.id} className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-lg font-medium text-textPrimary">{assignment.title}</p>
                            <p className="mt-2 text-sm text-textSecondary">{assignment.description || 'No description provided.'}</p>
                          </div>
                          <div className="rounded-xl border border-border bg-surfaceLight px-3 py-2 text-sm text-textSecondary">
                            Due {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Not set'}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
                          <Card className="bg-surface p-4 shadow-none">
                            <p className="text-sm text-textSecondary">Submission link</p>
                            <div className="mt-3 flex gap-3">
                              <Input
                                value={submissionDrafts[assignment.id] ?? ''}
                                onChange={(event) =>
                                  setSubmissionDrafts((current) => ({
                                    ...current,
                                    [assignment.id]: event.target.value,
                                  }))
                                }
                                placeholder="https://drive.google.com/..."
                                className="flex-1"
                              />
                              <Button
                                onClick={() => void submitAssignment(assignment.id)}
                              >
                                <Send className="h-4 w-4" />
                                {submission ? 'Update' : 'Submit'}
                              </Button>
                            </div>
                          </Card>

                          <Card className="bg-surface p-4 text-sm shadow-none">
                            <p className="font-medium text-textPrimary">Status</p>
                            <p className="mt-2">{submission ? 'Submitted' : 'Pending'}</p>
                            <p className="mt-3 text-textSecondary">
                              {submission?.grade !== null && submission?.grade !== undefined ? `Grade: ${submission.grade}` : 'Not graded yet'}
                            </p>
                            <p className="mt-2 text-textSecondary">{submission?.feedback || 'No feedback yet.'}</p>
                          </Card>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'discussions' ? (
            <SectionCard title="Discussions" description="Start a thread or reply to ongoing course conversations.">
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <form onSubmit={createThread} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
                  <label className="block text-sm text-textSecondary">New discussion</label>
                  <Textarea
                    value={threadDraft}
                    onChange={(event) => setThreadDraft(event.target.value)}
                    className="min-h-[180px]"
                  />
                  <Button>
                    <Send className="h-4 w-4" />
                    Post thread
                  </Button>
                </form>

                <div className="space-y-4">
                  {threads.length === 0 ? (
                    <Card className="p-6 text-sm text-textSecondary">No discussions yet.</Card>
                  ) : (
                    threads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} onReply={addReply} />
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}
    </PageContainer>
  );
}

function ThreadCard({
  thread,
  onReply,
}: {
  thread: Thread & { replies: Reply[] };
  onReply: (threadId: string, content: string) => Promise<void>;
}) {
  const [reply, setReply] = useState('');

  return (
    <Card className="p-5">
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
            <Card key={replyItem.id} className="bg-surface p-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-primary">{replyItem.author_role}</p>
                <p className="text-xs text-textSecondary">{new Date(replyItem.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm text-textPrimary">{replyItem.content}</p>
            </Card>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <Input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="flex-1"
          placeholder="Reply to this thread"
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
    </Card>
  );
}
