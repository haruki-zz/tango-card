export const DAY_SECONDS = 86_400;

export function startOfUtcDay(seconds: number) {
  const date = new Date(seconds * 1000);
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000);
}

export function startOfUtcWeek(seconds: number) {
  const dayStart = startOfUtcDay(seconds);
  const dayOfWeek = new Date(dayStart * 1000).getUTCDay();
  return dayStart - dayOfWeek * DAY_SECONDS;
}
