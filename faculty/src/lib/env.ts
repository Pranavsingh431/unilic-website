export function getLandingUrl() {
  const value = process.env.NEXT_PUBLIC_LANDING_URL;

  if (!value) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_LANDING_URL');
  }

  return value;
}
