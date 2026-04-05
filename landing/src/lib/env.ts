function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getFacultyAppUrl() {
  return getRequiredEnv('NEXT_PUBLIC_FACULTY_URL');
}

export function getStudentAppUrl() {
  return getRequiredEnv('NEXT_PUBLIC_STUDENT_URL');
}
