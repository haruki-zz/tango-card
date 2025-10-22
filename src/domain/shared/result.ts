export type Result<TData, TError> = SuccessResult<TData> | FailureResult<TError>;

export interface SuccessResult<TData> {
  readonly ok: true;
  readonly data: TData;
}

export interface FailureResult<TError> {
  readonly ok: false;
  readonly error: TError;
}

export function create_success_result<TData>(data: TData): SuccessResult<TData> {
  return { ok: true, data };
}

export function create_failure_result<TError>(error: TError): FailureResult<TError> {
  return { ok: false, error };
}
