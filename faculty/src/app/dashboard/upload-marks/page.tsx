'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  computeGradeResults,
  GRADE_SCALE,
  GradePolicy,
  parseExcelMarksBuffer,
  ParsedMarksResult,
  WeightageConfig,
  type ComputedStudent,
} from '@unilic/shared';
import { Download, FileSpreadsheet, Mail, Save, Send, Upload } from 'lucide-react';

import SectionCard from '@/components/SectionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageContainer } from '@/components/ui/PageContainer';
import { getAuthenticatedFaculty, publishGrades, saveComputedGrades, saveGradingConfiguration, sendGradeEmail, sendMarksEmail } from '@/lib/portal';
import { Course, supabase, User } from '@/lib/supabase';

type Mode = 'grade' | 'marks';

const DEFAULT_CUTOFFS: Record<(typeof GRADE_SCALE)[number], number> = {
  A: 90,
  'A-': 85,
  B: 80,
  'B-': 75,
  C: 70,
  'C-': 65,
  D: 60,
  E: 50,
  F: 0,
};

const DEFAULT_DISTRIBUTION: Record<(typeof GRADE_SCALE)[number], number> = {
  A: 5,
  'A-': 10,
  B: 20,
  'B-': 20,
  C: 20,
  'C-': 10,
  D: 10,
  E: 3,
  F: 2,
};

export default function UploadMarksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('courseId') ?? '';

  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(queryCourseId);
  const [mode, setMode] = useState<Mode>('grade');
  const [parsed, setParsed] = useState<ParsedMarksResult | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [weightages, setWeightages] = useState<WeightageConfig>({});
  const [policyType, setPolicyType] = useState<'absolute' | 'relative'>('absolute');
  const [absoluteCutoffs, setAbsoluteCutoffs] = useState(DEFAULT_CUTOFFS);
  const [distribution, setDistribution] = useState(DEFAULT_DISTRIBUTION);
  const [computedStudents, setComputedStudents] = useState<ComputedStudent[]>([]);
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const faculty = await getAuthenticatedFaculty();
    if (!faculty) {
      router.push('/auth');
      return;
    }

    setUser(faculty);

    const { data: courseRows } = await supabase
      .from('courses')
      .select('*')
      .eq('professor_id', faculty.id)
      .order('created_at', { ascending: false });

    setCourses(courseRows ?? []);
  }

  function resetWorkflow(parsedResult: ParsedMarksResult) {
    setParsed(parsedResult);
    setSelectedColumns(parsedResult.assessments);
    setWeightages(
      Object.keys(parsedResult.categories).reduce<WeightageConfig>((accumulator, category) => {
        accumulator[category] = 0;
        return accumulator;
      }, {})
    );
    setComputedStudents([]);
    setSavedVersion(null);
    setMessage('');
    setError('');
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsedResult = parseExcelMarksBuffer(buffer);
      resetWorkflow(parsedResult);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to parse the Excel file.');
    }
  }

  const currentCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const totalAllocated = useMemo(
    () => Object.values(weightages).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [weightages]
  );
  const distributionTotal = useMemo(
    () => Object.values(distribution).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [distribution]
  );

  const gradePolicy: GradePolicy = useMemo(
    () =>
      policyType === 'absolute'
        ? { type: 'absolute', absoluteCutoffs }
        : { type: 'relative', distribution },
    [policyType, absoluteCutoffs, distribution]
  );

  function toggleColumn(column: string) {
    setSelectedColumns((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column]
    );
  }

  function computeGrades() {
    if (!parsed) return;
    setComputedStudents(
      computeGradeResults({
        students: parsed.students,
        assessmentCategories: parsed.categories,
        weightages,
        categoryMaxMarks: parsed.categoryMaxMarks,
        gradePolicy,
      })
    );
    setMessage('Grades computed. Review them carefully before emailing or publishing.');
  }

  async function sendMarks() {
    if (!user || !parsed || !currentCourse) return;
    setBusy(true);
    setError('');

    try {
      for (const student of parsed.students) {
        await sendMarksEmail({
          student,
          professorEmail: user.email,
          selectedColumns,
          maxMarks: parsed.maxMarks,
          courseName: currentCourse.course_name,
        });
      }
      setMessage(`Marks emailed to ${parsed.students.length} students.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send marks emails.');
    } finally {
      setBusy(false);
    }
  }

  async function sendGrades() {
    if (!user || !currentCourse) return;
    setBusy(true);
    setError('');

    try {
      for (const student of computedStudents) {
        await sendGradeEmail({
          student,
          professorEmail: user.email,
          courseName: currentCourse.course_name,
        });
      }
      setMessage(`Tentative grades emailed to ${computedStudents.length} students.`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send grade emails.');
    } finally {
      setBusy(false);
    }
  }

  async function persistGrades() {
    if (!parsed || !currentCourse) return;
    setBusy(true);
    setError('');

    try {
      await saveGradingConfiguration(currentCourse.id, weightages, gradePolicy, parsed.categoryMaxMarks);
      const version = await saveComputedGrades(currentCourse.id, computedStudents);
      setSavedVersion(version);
      setMessage(`Saved computed grades as version ${version}.`);
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : 'Failed to save grades.');
    } finally {
      setBusy(false);
    }
  }

  async function publishFinalGrades() {
    if (!currentCourse || !savedVersion) return;
    setBusy(true);
    setError('');

    try {
      await publishGrades(currentCourse.id, savedVersion);
      setMessage(`Published grade version ${savedVersion}. Students can now see it on the web portal.`);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish grades.');
    } finally {
      setBusy(false);
    }
  }

  function exportExcel() {
    if (computedStudents.length === 0 || !parsed) return;

    const rows = computedStudents.map((student) => ({
      Name: student.name,
      'Entry Number': student.entryNumber,
      Email: student.email,
      ...Object.fromEntries(
        Object.keys(parsed.categories).map((category) => [category, student.categoryScores[category] ?? 0])
      ),
      'Total Marks': student.total,
      Grade: student.grade,
      Rank: student.rank ?? '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');
    XLSX.writeFile(workbook, `${currentCourse?.course_code ?? 'course'}-grades.xlsx`);
  }

  const absoluteValid = useMemo(() => {
    for (let index = 0; index < GRADE_SCALE.length - 1; index += 1) {
      const current = absoluteCutoffs[GRADE_SCALE[index]];
      const next = absoluteCutoffs[GRADE_SCALE[index + 1]];
      if (current <= next) {
        return false;
      }
    }
    return true;
  }, [absoluteCutoffs]);

  const canCompute =
    !!parsed &&
    !!currentCourse &&
    totalAllocated === 100 &&
    (policyType === 'absolute' ? absoluteValid : distributionTotal === 100);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-surfaceLight" />
        <div className="h-72 animate-pulse rounded-3xl bg-surfaceLight" />
      </div>
    );
  }

  return (
    <PageContainer>
          <div className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-soft">
            <Link href="/dashboard" className="text-sm text-primary hover:text-primaryHover">← Back to dashboard</Link>
            <h1 className="mt-4 text-4xl font-bold text-textPrimary">Marks upload and grading</h1>
            <p className="mt-3 max-w-3xl text-textSecondary">
              This web workflow mirrors the mobile grading engine: upload Excel, preview parsed marks, choose whether
              to email raw marks or compute full grades, then save or publish the result.
            </p>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

          <SectionCard title="1. Upload Excel" description="The first row should contain max marks and the next row should contain headers.">
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface p-10 text-center transition hover:border-primary">
                <Upload className="mb-4 h-10 w-10 text-primary" />
                <p className="text-lg font-medium text-textPrimary">Select marks sheet</p>
                <p className="mt-2 text-sm text-textSecondary">Supports the same Excel structure used in the mobile app.</p>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              </label>
              <div className="rounded-3xl border border-border bg-surface p-5">
                <label className="mb-2 block text-sm text-textSecondary">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-textPrimary outline-none transition focus:border-primary"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} · {course.course_name}
                    </option>
                  ))}
                </select>
                <div className="mt-5 rounded-2xl border border-border bg-surfaceLight p-4 text-sm text-textSecondary">
                  {parsed ? (
                    <>
                      <p className="font-medium text-textPrimary">{parsed.students.length} students parsed</p>
                      <p className="mt-1">{parsed.assessments.length} assessment columns detected</p>
                    </>
                  ) : (
                    'Choose a course and upload a sheet to begin.'
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {parsed ? (
            <>
              <SectionCard title="2. Parsed preview" description="Check that the roster and columns were detected correctly before continuing.">
                <div className="mb-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setMode('grade')}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium ${mode === 'grade' ? 'bg-primary text-white' : 'border border-border bg-surfaceLight text-textSecondary'}`}
                  >
                    Grade students
                  </button>
                  <button
                    onClick={() => setMode('marks')}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium ${mode === 'marks' ? 'bg-primary text-white' : 'border border-border bg-surfaceLight text-textSecondary'}`}
                  >
                    Send marks only
                  </button>
                </div>
                {parsed.warnings.length > 0 ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    {parsed.warnings.slice(0, 8).map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
                <div className="overflow-hidden rounded-2xl border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surfaceLight">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">Student</th>
                        {parsed.assessments.map((assessment) => (
                          <th key={assessment} className="px-4 py-3 text-left text-sm font-medium text-textSecondary">{assessment}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {parsed.students.map((student) => (
                        <tr key={student.entryNumber}>
                          <td className="px-4 py-3 text-sm text-textPrimary">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-textSecondary">{student.entryNumber}</div>
                          </td>
                          {parsed.assessments.map((assessment) => (
                            <td key={`${student.entryNumber}-${assessment}`} className="px-4 py-3 text-sm text-textSecondary">
                              {student.marks[assessment] ?? 0} / {parsed.maxMarks[assessment] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {mode === 'marks' ? (
                <SectionCard title="3. Select columns and send marks" description="Pick exactly which marks to share and email them directly.">
                  <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="space-y-3">
                      {parsed.assessments.map((assessment) => (
                        <label key={assessment} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-textPrimary">
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(assessment)}
                            onChange={() => toggleColumn(assessment)}
                            className="h-4 w-4 rounded border-border bg-background text-primary"
                          />
                          <span>{assessment}</span>
                        </label>
                      ))}
                      <Button
                        disabled={busy || selectedColumns.length === 0 || !currentCourse}
                        onClick={() => void sendMarks()}
                        className="mt-3"
                      >
                        <Mail className="h-4 w-4" />
                        Send marks to students
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {parsed.students.slice(0, 8).map((student) => (
                        <div key={student.entryNumber} className="rounded-2xl border border-border bg-surface p-4">
                          <p className="font-medium text-textPrimary">{student.name}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {selectedColumns.map((column) => (
                              <div key={`${student.entryNumber}-${column}`} className="rounded-xl bg-surfaceLight px-3 py-2 text-sm text-textSecondary">
                                {column}: {student.marks[column] ?? 0} / {parsed.maxMarks[column] ?? '-'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              ) : (
                <>
                  <SectionCard title="3. Configure marks allocation" description="Enter allocated marks out of 100 for each category. The raw maxima come directly from the Excel max row.">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(parsed.categories).map(([category, columns]) => (
                        <div key={category} className="rounded-2xl border border-border bg-surface p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-textPrimary">{category}</p>
                              <p className="mt-1 text-xs text-textSecondary">{columns.join(', ')}</p>
                            </div>
                            <div className="rounded-xl border border-border bg-surfaceLight px-3 py-1 text-xs text-textSecondary">
                              Raw max {parsed.categoryMaxMarks[category] ?? 0}
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="mb-2 block text-sm text-textSecondary">Allocated marks / 100</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={weightages[category] ?? 0}
                              onChange={(event) =>
                                setWeightages((current) => ({
                                  ...current,
                                  [category]: Number(event.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-border bg-surfaceLight p-4 text-sm text-textSecondary">
                      Total allocated marks: <span className={totalAllocated === 100 ? 'text-emerald-700' : 'text-amber-700'}>{totalAllocated} / 100</span>
                    </div>
                  </SectionCard>

                  <SectionCard title="4. Grade policy" description="Choose the policy now, compute later.">
                    <div className="mb-4 flex gap-3">
                      <button
                        onClick={() => setPolicyType('absolute')}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium ${policyType === 'absolute' ? 'bg-primary text-white' : 'border border-border bg-surfaceLight text-textSecondary'}`}
                      >
                        Absolute grading
                      </button>
                      <button
                        onClick={() => setPolicyType('relative')}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium ${policyType === 'relative' ? 'bg-primary text-white' : 'border border-border bg-surfaceLight text-textSecondary'}`}
                      >
                        Relative grading
                      </button>
                    </div>

                    {policyType === 'absolute' ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        {GRADE_SCALE.map((grade) => (
                          <div key={grade} className="rounded-2xl border border-border bg-surface p-4">
                            <label className="mb-2 block text-sm text-textSecondary">{grade} minimum</label>
                            <Input
                              type="number"
                              value={absoluteCutoffs[grade]}
                              onChange={(event) =>
                                setAbsoluteCutoffs((current) => ({
                                  ...current,
                                  [grade]: Number(event.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-3">
                        {GRADE_SCALE.map((grade) => (
                          <div key={grade} className="rounded-2xl border border-border bg-surface p-4">
                            <label className="mb-2 block text-sm text-textSecondary">{grade} distribution %</label>
                            <Input
                              type="number"
                              value={distribution[grade]}
                              onChange={(event) =>
                                setDistribution((current) => ({
                                  ...current,
                                  [grade]: Number(event.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-border bg-surfaceLight p-4 text-sm text-textSecondary">
                      {policyType === 'absolute'
                        ? absoluteValid
                          ? 'Cutoffs are in descending order.'
                          : 'Cutoffs must descend from A to F.'
                        : `Distribution total: ${distributionTotal} / 100`}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button
                        disabled={!canCompute}
                        onClick={computeGrades}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Compute grades
                      </Button>
                    </div>
                  </SectionCard>

                  {computedStudents.length > 0 ? (
                    <SectionCard title="5. Grade preview" description="Review results, then email, export, save, and publish.">
                      <div className="mb-4 flex flex-wrap gap-3">
                        <Button onClick={exportExcel} variant="secondary">
                          <Download className="h-4 w-4" />
                          Export Excel
                        </Button>
                        <Button disabled={busy} onClick={() => void sendGrades()} variant="secondary">
                          <Send className="h-4 w-4" />
                          Send tentative grades
                        </Button>
                        <Button disabled={busy} onClick={() => void persistGrades()} variant="secondary">
                          <Save className="h-4 w-4" />
                          Save grades
                        </Button>
                        <Button
                          disabled={busy || !savedVersion}
                          onClick={() => void publishFinalGrades()}
                        >
                          Publish final grades
                        </Button>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-surfaceLight">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">Student</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">Total</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">Grade</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">Rank</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white">
                            {computedStudents.map((student) => (
                              <tr key={student.entryNumber}>
                                <td className="px-4 py-3 text-sm text-textPrimary">
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-textSecondary">{student.entryNumber}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-textSecondary">{student.total} / 100</td>
                                <td className="px-4 py-3 text-sm font-semibold text-primary">{student.grade}</td>
                                <td className="px-4 py-3 text-sm text-textSecondary">{student.rank ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SectionCard>
                  ) : null}
                </>
              )}
            </>
          ) : null}
    </PageContainer>
  );
}
