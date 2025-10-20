import type { DomainError } from 'src/domain/errors';

const MESSAGES = {
  EMAIL_TAKEN: 'Este e-mail já está em uso.',
  USERNAME_TAKEN: 'Este nome de usuário já está em uso.',
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  VALIDATION: 'Verifique os campos do formulário.',
  NETWORK: 'Sem conexão. Tente novamente em instantes.',
} as const;

function isKnownCode(code: string): code is keyof typeof MESSAGES {
  // console.log(code);
  return code in MESSAGES;
}

export function humanizeDomainError(err: DomainError): string {
  console.log(err);
  const code = String(err.code);
  return isKnownCode(code) ? MESSAGES[code] : 'Ops! Algo deu errado.';
}

export function pickFieldToFocus(err: DomainError): string | null {
  const fields = err.fields ?? [];
  if (fields.length === 0) return null;
  const priority = ['email', 'username', 'password', 'name'];
  return priority.find((f) => fields.includes(f)) ?? fields[0] ?? null;
}
