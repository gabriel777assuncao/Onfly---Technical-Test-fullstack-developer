import {
  DomainErrorCodeEnum,
  type FieldErrorsShape,
  type HttpLikeErrorShape,
  type ApiPayloadShape,
} from "src/types/errors.types";

export class DomainError extends Error {
  code: DomainErrorCodeEnum;
  fields?: string[];
  details?: FieldErrorsShape;

  constructor(message: string, code: DomainErrorCodeEnum, fields?: string[], details?: FieldErrorsShape) {
    super(message);
    this.name = "DomainError";
    this.code = code;

    if (fields !== undefined) {
      this.fields = fields;
    }

    if (details !== undefined) {
      this.details = details;
    }
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickKey<T = unknown>(source: Record<string, unknown> | undefined, key: string): T | undefined {
  if (!source) {
    return undefined;
  }

  if (key in source) {
    return source[key] as T;
  }

  return undefined;
}

function looksLikeTaken(messages: string[] | undefined): boolean {
  if (!messages || messages.length === 0) {
    return false;
  }

  const pattern = /(já cadastrado|já está em uso|already exists|already taken)/i;
  return messages.some((text) => pattern.test(text));
}

function extractApiPayload(body: unknown): ApiPayloadShape | undefined {
  if (!isPlainRecord(body)) {
    return undefined;
  }

  const nested = pickKey<unknown>(body, "error");

  if (isPlainRecord(nested)) {
    return nested as ApiPayloadShape;
  }

  return body as ApiPayloadShape;
}

function normalizeApiErrorCode(payload: ApiPayloadShape | undefined): string {
  const raw = payload?.code ?? payload?.error_code ?? payload?.errorCode ?? "";
  return String(raw || "").trim().toUpperCase();
}

const apiCodeToEnumMap: Record<string, DomainErrorCodeEnum> = {
  EMAIL_TAKEN: DomainErrorCodeEnum.EMAIL_TAKEN,
  USERNAME_TAKEN: DomainErrorCodeEnum.USERNAME_TAKEN,
  INVALID_CREDENTIALS: DomainErrorCodeEnum.INVALID_CREDENTIALS,
  VALIDATION: DomainErrorCodeEnum.VALIDATION,
  NETWORK: DomainErrorCodeEnum.NETWORK,
  UNKNOWN: DomainErrorCodeEnum.UNKNOWN,
};

function toDomainErrorEnum(codeText: string): DomainErrorCodeEnum | undefined {
  if (!codeText) {
    return undefined;
  }

  const match = apiCodeToEnumMap[codeText];
  if (match !== undefined) {
    return match;
  }

  return undefined;
}

function extractApiMessage(payload: ApiPayloadShape | undefined, fallbackMessageText: string): string {
  const text = payload?.message ?? payload?.error_message;
  if (text) {
    return text;
  }

  return fallbackMessageText;
}

function extractFieldErrors(source: unknown): FieldErrorsShape | undefined {
  if (!isPlainRecord(source)) {
    return undefined;
  }

  return (source as ApiPayloadShape).errors;
}

function detectTakenFromFieldErrors(errors: FieldErrorsShape | undefined): DomainErrorCodeEnum | undefined {
  if (!errors) {
    return undefined;
  }

  const emailMessages = errors.email;
  if (looksLikeTaken(emailMessages)) {
    return DomainErrorCodeEnum.EMAIL_TAKEN;
  }

  const usernameMessages = errors.username ?? errors.user ?? errors.login;
  if (looksLikeTaken(usernameMessages)) {
    return DomainErrorCodeEnum.USERNAME_TAKEN;
  }

  return undefined;
}

function makeTakenError(kind: DomainErrorCodeEnum, details?: FieldErrorsShape, fields?: string[]) {
  const message =
    kind === DomainErrorCodeEnum.EMAIL_TAKEN
      ? "E-mail já cadastrado."
      : "Usuário já cadastrado.";

  const defaultFields =
    kind === DomainErrorCodeEnum.EMAIL_TAKEN
      ? ["email"]
      : ["username"];

  return new DomainError(message, kind, fields ?? defaultFields, details);
}

function resolveTakenFromPayload(payload: ApiPayloadShape | undefined): DomainError | undefined {
  const apiCodeText = normalizeApiErrorCode(payload);
  const apiCodeEnum = toDomainErrorEnum(apiCodeText);

  if (apiCodeEnum === DomainErrorCodeEnum.EMAIL_TAKEN) {
    return makeTakenError(DomainErrorCodeEnum.EMAIL_TAKEN, payload?.errors, payload?.fields);
  }

  if (apiCodeEnum === DomainErrorCodeEnum.USERNAME_TAKEN) {
    return makeTakenError(DomainErrorCodeEnum.USERNAME_TAKEN, payload?.errors, payload?.fields);
  }

  const detected = detectTakenFromFieldErrors(payload?.errors);

  if (detected) {
    const hintFields =
      detected === DomainErrorCodeEnum.EMAIL_TAKEN
        ? ["email"]
        : ["username"];

    return makeTakenError(detected, payload?.errors, hintFields);
  }

  return undefined;
}

export function mapHttpToDomainError(unknownError: unknown): DomainError {
  const httpLikeError = unknownError as HttpLikeErrorShape;
  const statusCode = httpLikeError?.response?.status ?? 0;

  const rawData = httpLikeError?.response?.data;
  const responseBody = isPlainRecord(rawData) ? rawData : undefined;

  if (statusCode === 0) {
    return new DomainError("Falha de rede.", DomainErrorCodeEnum.NETWORK);
  }

  if (statusCode === 401) {
    return new DomainError("Credenciais inválidas.", DomainErrorCodeEnum.INVALID_CREDENTIALS);
  }

  if (statusCode === 422) {
    const fieldErrors = extractFieldErrors(responseBody) ?? {};
    const takenKind = detectTakenFromFieldErrors(fieldErrors);

    if (takenKind) {
      return makeTakenError(takenKind, fieldErrors);
    }

    const fieldList = Object.keys(fieldErrors);
    const messageText =
      (isPlainRecord(responseBody)
        ? pickKey<string>(responseBody, "message")
        : undefined) ?? "Dados inválidos.";

    return new DomainError(messageText, DomainErrorCodeEnum.VALIDATION, fieldList, fieldErrors);
  }

  if (statusCode === 409) {
    const payload = extractApiPayload(responseBody);
    const taken = resolveTakenFromPayload(payload);

    if (taken) {
      return taken;
    }

    const apiMessageText = extractApiMessage(payload, "Conflito.");
    const apiFields = payload?.fields;

    return new DomainError(apiMessageText, DomainErrorCodeEnum.VALIDATION, apiFields);
  }

  const fallbackMessageText =
    (isPlainRecord(responseBody)
      ? pickKey<string>(responseBody, "message")
      : undefined) ?? "Erro desconhecido.";

  return new DomainError(fallbackMessageText, DomainErrorCodeEnum.UNKNOWN);
}
