export const GRADE_SCALE = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'E', 'F'] as const;

export type Grade = (typeof GRADE_SCALE)[number];
export type GradingType = 'absolute' | 'relative';

export interface WeightageConfig {
  [category: string]: number;
}

export interface GradePolicy {
  type: GradingType;
  absoluteCutoffs?: Record<Grade, number>;
  distribution?: Record<Grade, number>;
}

export interface StudentMarks {
  name: string;
  entryNumber: string;
  email: string;
  marks: Record<string, number>;
}

export interface ParsedMarksResult {
  students: StudentMarks[];
  assessments: string[];
  categories: Record<string, string[]>;
  maxMarks: Record<string, number>;
  categoryMaxMarks: Record<string, number>;
  warnings: string[];
}

export interface ComputedStudent {
  name: string;
  entryNumber: string;
  email: string;
  marks: Record<string, number>;
  categoryScores: Record<string, number>;
  categoryMaxScores: Record<string, number>;
  total: number;
  rank?: number;
  grade: Grade;
}
