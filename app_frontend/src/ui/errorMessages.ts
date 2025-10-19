import type { DomainError } from 'src/domain/errors';

export function humanizeDomainError(err: DomainError): string {
  switch (err.code) {
    case 'EMAIL_TAKEN': return 'Este e-mail já está em uso.';
    case 'USERNAME_TAKEN': return 'Este nome de usuário já está em uso.';
    case 'INVALID_CREDENTIALS': return 'E-mail ou senha incorretos.';
    case 'VALIDATION': return 'Verifique os campos do formulário.';
    case 'NETWORK': return 'Sem conexão. Tente novamente em instantes.';
    default: return 'Ops! Algo deu errado.';
  }
}

export function pickFieldToFocus(err: DomainError): string | null {
  const fields = err.fields ?? [];
  if (fields.length === 0) return null;
  const priority = ['email', 'username', 'password', 'name'];
  return priority.find((f) => fields.includes(f)) ?? fields[0] ?? null;
}
