import { computed } from "vue";

export interface StrengthView {
  value: number,
  color: string,
  label: string,
}

export function requiredFieldRule(value: string): true | string {
  const hasValue = typeof value === "string" && value.trim().length > 0;
  
  if (hasValue) {
    return true;
  }

  return "Obrigatório";
}

export function minLengthRule(minimumLength: number) {
  return function validateMinimumLength(value: string): true | string {
    const isValid = (value ?? "").trim().length >= minimumLength;

    if (isValid) {
      return true;
    }

    return `Mínimo de ${minimumLength} caracteres`;
  };
}

export function maxLengthRule(maximumLength: number) {
  return function validateMaximumLength(value: string): true | string {
    const isValid = (value ?? "").trim().length <= maximumLength;

    if (isValid) {
      return true;
    }

    return `Máximo de ${maximumLength} caracteres`;
  };
}

export function emailFormatRule(value: string): true | string {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = pattern.test(String(value ?? ""));

  if (isValid) {
    return true;
  }

  return "E-mail inválido";
}

export function passwordPolicyRule(value: string): true | string {
  const text = String(value ?? "");
  if (text.length < 8) {
    return "A senha deve ter no mínimo 8 caracteres";
  }

  if (!/[A-Za-z]/.test(text)) {
    return "A senha deve conter letras";
  }

  if (!/[a-z]/.test(text) || !/[A-Z]/.test(text)) {
    return "A senha deve conter letras maiúsculas e minúsculas";
  }

  if (!/[0-9]/.test(text)) {
    return "A senha deve conter números";
  }

  if (!/[^A-Za-z0-9]/.test(text)) {
    return "A senha deve conter símbolos";
  }

  return true;
}

export function useRegisterValidation(getPasswordValue: () => string) {
  const fullNameValidationRules = [requiredFieldRule, minLengthRule(3), maxLengthRule(255)];
  const userNameValidationRules = [requiredFieldRule, minLengthRule(3), maxLengthRule(255)];
  const emailAddressValidationRules = [requiredFieldRule, emailFormatRule];

  const userPasswordValidationRules = [requiredFieldRule, passwordPolicyRule];

  const userPasswordConfirmationValidationRules = [
    requiredFieldRule,
    function mustMatchPassword(value: string): true | string {
      const matches = value === getPasswordValue();

      if (matches) {
        return true;
      }

      return "Senhas diferentes";
    },
  ];

  function mustAcceptTermsRule(value: boolean): true | string {
    if (value) {
      return true;
    }

    return "Você precisa aceitar os termos";
  }

  const passwordStrengthView = computed<StrengthView>(() => {
    const passwordValue = String(getPasswordValue() ?? "");
    let scoreValue = 0;

    if (passwordValue.length >= 8) {
      scoreValue += 1;
    }
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) {
      scoreValue += 1;
    }
    if (/[0-9]/.test(passwordValue)) {
      scoreValue += 1;
    }
    if (/[^A-Za-z0-9]/.test(passwordValue)) {
      scoreValue += 1;
    }

    const mappingList: StrengthView[] = [
      { value: 0.25, color: "negative", label: "Fraca" },
      { value: 0.5, color: "warning", label: "Média" },
      { value: 0.75, color: "info", label: "Boa" },
      { value: 1, color: "positive", label: "Forte" },
    ];

    const index = Math.max(0, Math.min(scoreValue, 4) - 1);
    const view = mappingList[index] ?? { value: 0, color: "grey-5", label: "Muito fraca" };

    return view;
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
