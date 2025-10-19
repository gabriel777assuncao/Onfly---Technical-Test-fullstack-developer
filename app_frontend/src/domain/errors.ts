export type DomainErrorCode =
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION'
  | 'NETWORK'
  | 'UNKNOWN';

type TakenCode = Extract<DomainErrorCode, 'EMAIL_TAKEN' | 'USERNAME_TAKEN'>;

export type FieldErrors = Partial<Record<string, string[]>>;

export class DomainError extends Error {
  code: DomainErrorCode;
  fields?: string[];
  details?: FieldErrors;

  constructor(message: string, code: DomainErrorCode, fields?: string[], details?: FieldErrors) {
    super(message);
    this.name = 'DomainError';
    this.code = code;

    if (fields !== undefined) {
      this.fields = fields;
    }

    if (details !== undefined) {
      this.details = details;
    }
  }
}

type HttpResponse = {
  status?: number;
  data?: unknown;
};

type HttpLikeError = {
  response?: HttpResponse;
};

type ApiPayload = {
  code?: string;
  error_code?: string;
  errorCode?: string;
  message?: string;
  error_message?: string;
  fields?: string[];
  errors?: FieldErrors;
  error?: ApiPayload;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiPayload(value: unknown): value is ApiPayload {
  return isRecord(value);
}

function pick<T = unknown>(obj: Record<string, unknown> | undefined, key: string): T | undefined {
  if (!obj) return undefined;
  return key in obj ? (obj[key] as T) : undefined;
}

function looksLikeTakenMessage(messages: string[] | undefined): boolean {
  if (!messages || messages.length === 0) return false;

  const pattern = /(já cadastrado|já está em uso|already exists|already taken)/i;
  return messages.some((m) => pattern.test(m));
}

function getPayload(body: unknown): ApiPayload | undefined {
  if (!isApiPayload(body)) return undefined;

  const nested = pick<unknown>(body, 'error');
  if (isApiPayload(nested)) return nested;

  return body;
}

function normalizeApiCode(payload: ApiPayload | undefined): string {
  const raw =
    payload?.code ??
    payload?.error_code ??
    payload?.errorCode ??
    '';
  return String(raw || '').trim().toUpperCase();
}

function getApiMessage(payload: ApiPayload | undefined, fallback: string): string {
  const msg = payload?.message ?? payload?.error_message;
  return msg || fallback;
}

function getFieldErrors(source: unknown): FieldErrors | undefined {
  if (!isApiPayload(source)) return undefined;
  return source.errors;
}

function detectTakenFromErrors(errors: FieldErrors | undefined): TakenCode | undefined {
  if (!errors) return undefined;

  const emailMsgs = errors.email;
  if (looksLikeTakenMessage(emailMsgs)) return 'EMAIL_TAKEN';

  const usernameMsgs = errors.username ?? errors.user ?? errors.login;
  if (looksLikeTakenMessage(usernameMsgs)) return 'USERNAME_TAKEN';

  return undefined;
}

function makeTakenError(kind: TakenCode, details?: FieldErrors, fields?: string[]) {
  const message = kind === 'EMAIL_TAKEN'
    ? 'E-mail já cadastrado.'
    : 'Usuário já cadastrado.';

  const defaultFields = kind === 'EMAIL_TAKEN' ? ['email'] : ['username'];
  return new DomainError(message, kind, fields ?? defaultFields, details);
}

function resolveTakenFromPayload(payload: ApiPayload | undefined): DomainError | undefined {
  const apiCode = normalizeApiCode(payload);

  if (apiCode === 'EMAIL_TAKEN') {
    return makeTakenError('EMAIL_TAKEN', payload?.errors, payload?.fields);
  }

  if (apiCode === 'USERNAME_TAKEN') {
    return makeTakenError('USERNAME_TAKEN', payload?.errors, payload?.fields);
  }

  const takenFromErrors = detectTakenFromErrors(payload?.errors);
  if (takenFromErrors) {
    const hintFields: string[] | undefined =
      takenFromErrors === 'EMAIL_TAKEN' ? ['email'] : ['username'];

    return makeTakenError(takenFromErrors, payload?.errors, hintFields);
  }

  return undefined;
}

export function mapHttpToDomainError(error: unknown): DomainError {
  const http = error as HttpLikeError;
  const status = http?.response?.status ?? 0;

  const data = http?.response?.data;
  const body = isRecord(data) ? data : undefined;

  if (status === 0) {
    return new DomainError('Falha de rede.', 'NETWORK');
  }

  if (status === 401) {
    return new DomainError('Credenciais inválidas.', 'INVALID_CREDENTIALS');
  }

  if (status === 422) {
    const errorsObject: FieldErrors = getFieldErrors(body) ?? {};
    const taken = detectTakenFromErrors(errorsObject);

    if (taken) {
      return makeTakenError(taken, errorsObject);
    }

    const fields = Object.keys(errorsObject);
    const message = (isRecord(body) ? pick<string>(body, 'message') : undefined) ?? 'Dados inválidos.';
    return new DomainError(message, 'VALIDATION', fields, errorsObject);
  }

  if (status === 409) {
    const payload = getPayload(body);
    const taken = resolveTakenFromPayload(payload);

    if (taken) {
      return taken;
    }

    const apiMessage = getApiMessage(payload, 'Conflito.');
    const apiFields = payload?.fields;
    return new DomainError(apiMessage, 'VALIDATION', apiFields);
  }

  const fallbackMessage =
    (isRecord(body) ? pick<string>(body, 'message') : undefined) ?? 'Erro desconhecido.';
  return new DomainError(fallbackMessage, 'UNKNOWN');
}
