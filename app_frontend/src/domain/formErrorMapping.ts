import { DomainErrorCodeEnum } from "src/types/errors.types";
import type { DomainError } from "src/domain/errors";

export type FieldErrorMap = Record<string, string>;

export function mapDomainErrorToFieldErrorMap(domainError: DomainError): FieldErrorMap {
  const fieldErrorMap: FieldErrorMap = {};

  if (domainError.details && typeof domainError.details === "object") {
    const entries = Object.entries(domainError.details);
    for (const [key, messages] of entries) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrorMap[key] = String(messages[0]);
      }
    }
  }

  if (domainError.code === DomainErrorCodeEnum.EMAIL_TAKEN) {
    fieldErrorMap.email = "E-mail já cadastrado.";
  }

  if (domainError.code === DomainErrorCodeEnum.INVALID_CREDENTIALS) {
    fieldErrorMap.password = "Credenciais inválidas.";
  }

  return fieldErrorMap;
}
