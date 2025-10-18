export type DomainErrorCode =
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION'
  | 'NETWORK'
  | 'UNKNOWN';

export class DomainError extends Error {
  code: DomainErrorCode;
  fields?: string[];

  constructor(message: string, code: DomainErrorCode, fields?: string[]) {
    super(message);
    this.name = 'DomainError';
    this.code = code;

    if (fields !== undefined) {
      this.fields = fields;
    }
  }
}

type HttpResponseLike = { response?: { status?: number; data?: unknown } };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getProperty<T = unknown>(object: Record<string, unknown> | undefined, key: string): T | undefined {
  if (!object) return undefined;
  return (key in object ? (object[key] as T) : undefined);
}

function detectDuplicateFieldFromMessage(message: string): 'email' | 'username' | undefined {
  const match = message.match(/users_(\w+)_unique/i);
  const field = match?.[1]?.toLowerCase();

  if (field === 'email') {
    return 'email';
  }

  if (field === 'username') {
    return 'username';
  }

  return undefined;
}

export function mapHttpToDomainError(error: unknown): DomainError {
  const httpLike = error as HttpResponseLike;
  const statusCode = httpLike?.response?.status ?? 0;
  const responseData = httpLike?.response?.data;
  const responseBody = isPlainRecord(responseData) ? responseData : undefined;

  if (statusCode === 401) {
    return new DomainError('Credenciais inválidas.', 'INVALID_CREDENTIALS');
  }

  if (statusCode === 0) {
    return new DomainError('Falha de rede.', 'NETWORK');
  }

  const message = getProperty<string>(responseBody, 'message') ?? 'Erro desconhecido.';

  if (statusCode === 500 && typeof message === 'string' && /duplicate entry/i.test(message)) {
    const field = detectDuplicateFieldFromMessage(message);

    if (field === 'email') {
      return new DomainError('E-mail já cadastrado.', 'EMAIL_TAKEN', ['email']);
    }
    if (field === 'username') {
      return new DomainError('Usuário já cadastrado.', 'USERNAME_TAKEN', ['username']);
    }
    return new DomainError('Registro duplicado.', 'VALIDATION');
  }

  if (statusCode === 422) {
    const errorsObject = getProperty<Record<string, unknown>>(responseBody, 'errors');
    const fieldNames = isPlainRecord(errorsObject) ? Object.keys(errorsObject) : undefined;

    return new DomainError('Dados inválidos.', 'VALIDATION', fieldNames);
  }

  return new DomainError(message, 'UNKNOWN');
}
