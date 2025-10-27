export function create_uuid(): string {
  const crypto_api = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (crypto_api && typeof crypto_api.randomUUID === 'function') {
    return crypto_api.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
