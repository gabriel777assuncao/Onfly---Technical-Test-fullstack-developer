import { computed } from 'vue';

export type StrengthView = { value: number, color: string, label: string };

export function useRegisterValidation(getPasswordValue: () => string) {
  const requiredFieldRule = (value: string) => (!!value && value.trim().length > 0) || 'Obrigatório';
  const minLengthRule = (minimumLength: number) => (value: string) => (value?.trim().length >= minimumLength) || `Mínimo de ${minimumLength} caracteres`;
  const maxLengthRule = (maximumLength: number) => (value: string) => (value?.trim().length <= maximumLength) || `Máximo de ${maximumLength} caracteres`;
  const emailFormatRule = (value: string) => /.+@.+\..+/.test(value) || 'E-mail inválido';

  const fullNameValidationRules = [requiredFieldRule, minLengthRule(3), maxLengthRule(255)];
  const userNameValidationRules = [requiredFieldRule, minLengthRule(3), maxLengthRule(255)];
  const emailAddressValidationRules = [requiredFieldRule, emailFormatRule];

  const passwordPolicyRule = (value: string) => {
    if (!value || value.length < 8) { return 'A senha deve ter no mínimo 8 caracteres'; }
    if (!/[A-Za-z]/.test(value)) { return 'A senha deve conter letras'; }
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) { return 'A senha deve conter letras maiúsculas e minúsculas'; }
    if (!/[0-9]/.test(value)) { return 'A senha deve conter números'; }
    if (!/[^A-Za-z0-9]/.test(value)) { return 'A senha deve conter símbolos'; }
    return true;
  };

  const userPasswordValidationRules = [requiredFieldRule, passwordPolicyRule];
  const userPasswordConfirmationValidationRules = [
    requiredFieldRule,
    (value: string) => value === getPasswordValue() || 'Senhas diferentes',
  ];
  const mustAcceptTermsRule = (value: boolean) => value || 'Você precisa aceitar os termos';

  const passwordStrengthView = computed<StrengthView>(() => {
    const passwordValue = getPasswordValue();
    let scoreValue = 0;

    if (passwordValue.length >= 8) { scoreValue += 1; }
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) { scoreValue += 1; }
    if (/[0-9]/.test(passwordValue)) { scoreValue += 1; }
    if (/[^A-Za-z0-9]/.test(passwordValue)) { scoreValue += 1; }

    const mappingList: StrengthView[] = [
      { value: 0.25, color: 'negative', label: 'Fraca' },
      { value: 0.5, color: 'warning', label: 'Média' },
      { value: 0.75, color: 'info', label: 'Boa' },
      { value: 1, color: 'positive', label: 'Forte' },
    ];

    return mappingList[Math.min(scoreValue, 4) - 1] ?? { value: 0, color: 'grey-5', label: 'Muito fraca' };
  });

  const validationRules = {
    fullNameValidationRules,
    userNameValidationRules,
    emailAddressValidationRules,
    userPasswordValidationRules,
    userPasswordConfirmationValidationRules,
  };

  return { validationRules, mustAcceptTermsRule, passwordStrengthView };
}
