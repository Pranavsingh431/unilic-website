export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getDayName(dayNumber: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[dayNumber] || '';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateInstitutionEmail(email: string, domain: string = 'iitrpr.ac.in'): boolean {
  return email.endsWith(`@${domain}`);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateTimeline(
  startDate: Date,
  endDate: Date,
  schedule: { day: number; start_time: string; end_time: string }[]
): { session_date: string; start_time: string; end_time: string }[] {
  const sessions: { session_date: string; start_time: string; end_time: string }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO (1=Monday, 7=Sunday)

    if (isoDayOfWeek <= 5) { // Weekdays only
      const matchingSlot = schedule.find(s => s.day === isoDayOfWeek);
      if (matchingSlot) {
        sessions.push({
          session_date: current.toISOString().split('T')[0],
          start_time: matchingSlot.start_time,
          end_time: matchingSlot.end_time,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return sessions;
}
