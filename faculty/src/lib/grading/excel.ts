import * as XLSX from 'xlsx';

import type { ParsedMarksResult, StudentMarks } from './types';

const REQUIRED_HEADERS = ['Name', 'Entry Number', 'Student Email'] as const;
const IGNORED_HEADERS = ['Total Marks'];

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function coerceNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function detectCategory(header: string) {
  return header.replace(/\s+\d+\s*$/, '').trim() || header.trim();
}

function buildCategories(assessments: string[]) {
  return assessments.reduce<Record<string, string[]>>((accumulator, assessment) => {
    const category = detectCategory(assessment);

    if (!accumulator[category]) {
      accumulator[category] = [];
    }

    accumulator[category].push(assessment);
    return accumulator;
  }, {});
}

function hasRequiredHeaders(row: unknown[]) {
  const normalized = new Set((row || []).map((value) => normalizeHeader(value)));
  return REQUIRED_HEADERS.every((header) => normalized.has(normalizeHeader(header)));
}

function parseMatrix(matrix: unknown[][]): ParsedMarksResult {
  if (matrix.length < 2) {
    throw new Error('The Excel file must include a max-marks row and a header row.');
  }

  const firstRow = matrix[0] || [];
  const secondRow = matrix[1] || [];
  const headersRowIndex = hasRequiredHeaders(firstRow) ? 0 : hasRequiredHeaders(secondRow) ? 1 : -1;

  if (headersRowIndex === -1) {
    throw new Error('Invalid Excel format. Could not find the required header row.');
  }

  const maxMarksRowIndex = headersRowIndex === 0 ? 1 : 0;
  const dataStartIndex = Math.max(headersRowIndex, maxMarksRowIndex) + 1;
  const headers = (matrix[headersRowIndex] || []).map((header) => String(header ?? '').trim());
  const maxMarksMatrixRow = matrix[maxMarksRowIndex] || [];

  if (!headers.length) {
    throw new Error('The Excel file is empty.');
  }

  const normalizedHeaders = new Map(headers.map((header) => [normalizeHeader(header), header]));
  const missingRequiredHeaders = REQUIRED_HEADERS.filter(
    (header) => !normalizedHeaders.has(normalizeHeader(header))
  );

  if (missingRequiredHeaders.length > 0) {
    throw new Error(
      `Invalid Excel format. Missing required column(s): ${missingRequiredHeaders.join(', ')}`
    );
  }

  const nameHeader = normalizedHeaders.get(normalizeHeader('Name'))!;
  const entryNumberHeader = normalizedHeaders.get(normalizeHeader('Entry Number'))!;
  const emailHeader = normalizedHeaders.get(normalizeHeader('Student Email'))!;
  const ignoredHeaderSet = new Set(
    [...REQUIRED_HEADERS, ...IGNORED_HEADERS].map((header) => normalizeHeader(header))
  );

  const assessments = headers.filter((header) => !ignoredHeaderSet.has(normalizeHeader(header)));
  const categories = buildCategories(assessments);
  const warnings: string[] = [];

  if (maxMarksMatrixRow.length === 0) {
    throw new Error('The Excel file must include a max-marks row.');
  }

  const rawRows = matrix.slice(dataStartIndex).map<Record<string, unknown>>((row) =>
    headers.reduce<Record<string, unknown>>((accumulator, header, index) => {
      accumulator[header] = row[index] ?? '';
      return accumulator;
    }, {})
  );

  const maxMarks = assessments.reduce<Record<string, number>>((accumulator, assessment) => {
    const columnIndex = headers.findIndex((header) => header === assessment);
    const parsedValue = coerceNumber(maxMarksMatrixRow[columnIndex]);

    if (parsedValue === null) {
      warnings.push(`Max-marks row is missing a numeric value for "${assessment}". Stored as 0.`);
      accumulator[assessment] = 0;
      return accumulator;
    }

    accumulator[assessment] = parsedValue;
    return accumulator;
  }, {});

  const categoryMaxMarks = Object.entries(categories).reduce<Record<string, number>>(
    (accumulator, [category, columns]) => {
      accumulator[category] = columns.reduce((sum, column) => sum + (maxMarks[column] ?? 0), 0);
      return accumulator;
    },
    {}
  );

  const students = rawRows.reduce<StudentMarks[]>((accumulator, row, rowIndex) => {
    const displayRow = rowIndex + dataStartIndex + 1;
    const name = String(row[nameHeader] ?? '').trim();
    const entryNumber = String(row[entryNumberHeader] ?? '').trim();
    const email = String(row[emailHeader] ?? '').trim();

    if (!name || !entryNumber || !email) {
      warnings.push(`Skipped row ${displayRow}: missing name, entry number, or student email.`);
      return accumulator;
    }

    const marks = assessments.reduce<Record<string, number>>((markAccumulator, assessment) => {
      const parsedValue = coerceNumber(row[assessment]);

      if (parsedValue === null) {
        if (String(row[assessment] ?? '').trim()) {
          warnings.push(
            `Row ${displayRow} (${name}) has a non-numeric value for "${assessment}". Stored as 0.`
          );
        } else {
          warnings.push(`Row ${displayRow} (${name}) is missing "${assessment}". Stored as 0.`);
        }

        markAccumulator[assessment] = 0;
        return markAccumulator;
      }

      markAccumulator[assessment] = parsedValue;
      return markAccumulator;
    }, {});

    accumulator.push({
      name,
      entryNumber,
      email,
      marks,
    });

    return accumulator;
  }, []);

  return {
    students,
    assessments,
    categories,
    maxMarks,
    categoryMaxMarks,
    warnings,
  };
}

export function parseExcelMarksBuffer(buffer: ArrayBuffer): ParsedMarksResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('The Excel file does not contain any sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  return parseMatrix(matrix);
}
