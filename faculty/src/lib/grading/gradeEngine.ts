import { GRADE_SCALE, type ComputedStudent, type Grade, type GradePolicy, type StudentMarks, type WeightageConfig } from './types';

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

export function computeCategoryScores(
  student: StudentMarks,
  assessmentCategories: Record<string, string[]>,
  categoryMaxMarks: Record<string, number>,
  weightages: WeightageConfig
) {
  return Object.entries(assessmentCategories).reduce<Record<string, number>>(
    (accumulator, [category, assessments]) => {
      const rawCategoryScore = assessments.reduce(
        (sum, assessment) => sum + (student.marks[assessment] ?? 0),
        0
      );
      const actualMaxMarks = categoryMaxMarks[category] ?? 0;
      const assignedWeight = weightages[category] ?? 0;
      const totalContribution =
        actualMaxMarks > 0 ? (rawCategoryScore / actualMaxMarks) * assignedWeight : 0;

      accumulator[category] = roundToTwo(totalContribution);
      return accumulator;
    },
    {}
  );
}

export function computeTotals(
  students: StudentMarks[],
  assessmentCategories: Record<string, string[]>,
  weightages: WeightageConfig,
  categoryMaxMarks: Record<string, number>
) {
  return students.map<ComputedStudent>((student) => {
    const categoryScores = computeCategoryScores(
      student,
      assessmentCategories,
      categoryMaxMarks,
      weightages
    );
    const total = roundToTwo(
      Object.values(categoryScores).reduce((sum, contribution) => sum + contribution, 0)
    );

    return {
      name: student.name,
      entryNumber: student.entryNumber,
      email: student.email,
      marks: student.marks,
      categoryScores,
      categoryMaxScores: Object.entries(assessmentCategories).reduce<Record<string, number>>(
        (accumulator, [category]) => {
          accumulator[category] = roundToTwo(categoryMaxMarks[category] ?? 0);
          return accumulator;
        },
        {}
      ),
      total,
      grade: 'F',
    };
  });
}

function assignAbsoluteGrades(students: ComputedStudent[], cutoffs: Record<Grade, number>) {
  return students.map<ComputedStudent>((student) => {
    const matchedGrade =
      GRADE_SCALE.find((grade) => student.total >= (cutoffs[grade] ?? 0)) ?? 'F';

    return {
      ...student,
      grade: matchedGrade,
    };
  });
}

function buildRelativeGradeCounts(totalStudents: number, distribution: Record<Grade, number>) {
  const counts = {} as Record<Grade, number>;
  let assigned = 0;

  GRADE_SCALE.forEach((grade, index) => {
    if (index === GRADE_SCALE.length - 1) {
      counts[grade] = Math.max(totalStudents - assigned, 0);
      return;
    }

    const rawCount = Math.floor(((distribution[grade] ?? 0) / 100) * totalStudents);
    counts[grade] = rawCount;
    assigned += rawCount;
  });

  return counts;
}

function assignRelativeGrades(students: ComputedStudent[], distribution: Record<Grade, number>) {
  const rankedStudents = [...students]
    .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name))
    .map((student, index) => ({
      ...student,
      rank: index + 1,
    }));

  const counts = buildRelativeGradeCounts(rankedStudents.length, distribution);
  let cursor = 0;

  for (const grade of GRADE_SCALE) {
    const count = counts[grade] ?? 0;

    for (let index = 0; index < count && cursor < rankedStudents.length; index += 1) {
      rankedStudents[cursor] = {
        ...rankedStudents[cursor],
        grade,
      };
      cursor += 1;
    }
  }

  while (cursor < rankedStudents.length) {
    rankedStudents[cursor] = {
      ...rankedStudents[cursor],
      grade: 'F',
    };
    cursor += 1;
  }

  return rankedStudents;
}

export function computeGradeResults(input: {
  students: StudentMarks[];
  assessmentCategories: Record<string, string[]>;
  weightages: WeightageConfig;
  categoryMaxMarks: Record<string, number>;
  gradePolicy: GradePolicy;
}) {
  const totals = computeTotals(
    input.students,
    input.assessmentCategories,
    input.weightages,
    input.categoryMaxMarks
  );

  if (input.gradePolicy.type === 'relative' && input.gradePolicy.distribution) {
    return assignRelativeGrades(totals, input.gradePolicy.distribution);
  }

  return assignAbsoluteGrades(
    totals,
    input.gradePolicy.absoluteCutoffs ?? {
      A: 90,
      'A-': 85,
      B: 80,
      'B-': 75,
      C: 70,
      'C-': 65,
      D: 60,
      E: 50,
      F: 0,
    }
  );
}
