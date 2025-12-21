export function startOfUtcDay(seconds: number) {
  const date = new Date(seconds * 1000);
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000);
}
