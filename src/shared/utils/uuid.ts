import { randomUUID } from 'node:crypto';

export function create_uuid(): string {
  return randomUUID();
}
