function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    return '';
  }

  return value;
}

export function getFacultyAppUrl() {
  return getRequiredEnv('NEXT_PUBLIC_FACULTY_URL');
}

export function getStudentAppUrl() {
  return getRequiredEnv('NEXT_PUBLIC_STUDENT_URL');
}
