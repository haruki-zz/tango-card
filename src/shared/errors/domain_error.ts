export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function create_domain_error(code: string, message: string): DomainError {
  return new DomainError(code, message);
}
