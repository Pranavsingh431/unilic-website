'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import SectionCard from '@/components/SectionCard';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { fetchPublishedGradesForStudent, getAuthenticatedStudent, PublishedGradeRow } from '@/lib/portal';
import { User } from '@/lib/supabase';

export default function StudentGradesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<PublishedGradeRow[]>([]);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const student = await getAuthenticatedStudent();
    if (!student) {
      return;
    }

    setUser(student);
    const rows = await fetchPublishedGradesForStudent(student.email);
    setGrades(rows);
  }

  if (!user) {
    return (
      <PageContainer className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="h-72 animate-pulse rounded-3xl bg-surfaceLight" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-6xl">
          <div className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <Link href="/dashboard" className="text-sm text-primary hover:text-primaryHover">← Back to dashboard</Link>
            <h1 className="mt-4 text-4xl font-bold text-textPrimary">Published grades</h1>
            <p className="mt-3 max-w-3xl text-textSecondary">Only final published grades appear here. Tentative grade emails do not automatically show in the portal.</p>
          </div>

          <SectionCard title="Grade records" description="Breakdowns shown below come directly from the published faculty grading run.">
            {grades.length === 0 ? (
              <Card className="p-8 text-sm text-textSecondary">No published grades yet.</Card>
            ) : (
              <div className="space-y-4">
                {grades.map((grade) => (
                  <Card key={grade.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-medium text-textPrimary">{grade.course_name ?? grade.course_id}</p>
                        <p className="mt-1 text-sm text-textSecondary">Published {new Date(grade.created_at).toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surfaceLight px-4 py-3 text-right">
                        <p className="text-sm text-textSecondary">Grade</p>
                        <p className="text-2xl font-semibold text-primary">{grade.grade}</p>
                        <p className="text-sm text-textSecondary">{grade.total_marks} / 100</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {Object.entries(grade.breakdown ?? {}).map(([category, value]) => (
                        <Card key={category} className="bg-surface p-4 shadow-none">
                          <p className="text-sm text-textSecondary">{category}</p>
                          <p className="mt-1 font-medium text-textPrimary">{value}</p>
                        </Card>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </SectionCard>
    </PageContainer>
  );
}
