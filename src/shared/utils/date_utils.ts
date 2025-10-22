export function get_iso_timestamp(date = new Date()): string {
  return date.toISOString();
}

export function get_start_of_day(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function days_between(start: Date, end: Date): number {
  const milliseconds_per_day = 1000 * 60 * 60 * 24;
  const start_time = get_start_of_day(start).getTime();
  const end_time = get_start_of_day(end).getTime();
  return Math.round((end_time - start_time) / milliseconds_per_day);
}
