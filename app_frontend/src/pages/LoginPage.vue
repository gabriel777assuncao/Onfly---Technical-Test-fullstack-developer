<template>
  <AuthShell
    layout-variant="simple"
    :header-title="'Entrar'"
    :header-subtitle="'Acesse sua conta Onfly'"
    :icon-name="'lock'"
    :card-max-width="420"
    :is-flat="true"
    :is-bordered="true"
  >
    <q-form ref="formReference" greedy @submit.prevent="submitLogin">
      <q-input
        v-model="emailAddress"
        :rules="emailValidationRules"
        :error="!!emailFieldErrorText"
        :error-message="emailFieldErrorText"
        label="E-mail"
        type="email"
        dense
        standout
        class="field"
        rounded
        autocomplete="email"
      >
        <template #prepend><q-icon name="mail" /></template>
      </q-input>

      <q-input
        v-model="userPassword"
        :rules="passwordValidationRules"
        :error="!!passwordFieldErrorText"
        :error-message="passwordFieldErrorText"
        :type="isShowingPassword ? 'text' : 'password'"
        label="Senha"
        dense
        standout
        class="field"
        rounded
        autocomplete="current-password"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon
            :name="isShowingPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            role="button"
            tabindex="0"
            @click="togglePasswordVisibility"
            @keydown.enter.prevent="togglePasswordVisibility"
            @keydown.space.prevent="togglePasswordVisibility"
            :aria-label="isShowingPassword ? 'Ocultar senha' : 'Mostrar senha'"
          />
        </template>
      </q-input>

      <div class="actions">
        <q-btn
          :loading="isSubmittingRequest"
          :disable="!canSubmitForm"
          type="submit"
          label="Entrar"
          class="btn-primary"
          color="primary"
          unelevated
          rounded
          no-caps
          :aria-busy="isSubmittingRequest"
        />
      </div>

      <q-separator class="q-my-md" />

      <div class="row justify-between items-center">
        <q-btn
          flat
          class="btn-ghost"
          color="primary"
          padding="xs sm"
          label="Criar conta"
          @click="goToRegister"
        />
      </div>
    </q-form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Notify, Loading, type QForm } from "quasar";
import { useAuthStore } from "src/stores/auth";
import { mapHttpToDomainError } from "src/domain/errors";
import { requiredFieldRule, emailFormatRule } from "src/services/RegisterValidation";
import { mapDomainErrorToFieldErrorMap, type FieldErrorMap } from "src/domain/formErrorMapping";
import AuthShell from "components/auth/AuthShell.vue";

const router = useRouter();
const authenticationStore = useAuthStore();

const emailAddress = ref<string>("");
const userPassword = ref<string>("");
const isShowingPassword = ref<boolean>(false);
const isSubmittingRequest = ref<boolean>(false);
const formReference = ref<QForm | null>(null);

const fieldErrorMap = ref<FieldErrorMap>({});

const emailValidationRules = [requiredFieldRule, emailFormatRule];
const passwordValidationRules = [requiredFieldRule];

const emailFieldErrorText = computed<string>(() => {
  if ("email" in fieldErrorMap.value) {
    return fieldErrorMap.value.email;
  }

  return "";
});

const passwordFieldErrorText = computed<string>(() => {
  if ("password" in fieldErrorMap.value) {
    return fieldErrorMap.value.password;
  }

  return "";
});

const canSubmitForm = computed<boolean>(() => {
  const hasEmail = emailAddress.value.trim().length > 0;
  const hasPassword = userPassword.value.length > 0;

  return !isSubmittingRequest.value && hasEmail && hasPassword;
});

function togglePasswordVisibility(): void {
  const isVisible = isShowingPassword.value === true;

  isShowingPassword.value = !isVisible;
}

function clearFieldErrors(): void {
  fieldErrorMap.value = {};
}

async function submitLogin(): Promise<void> {
  isSubmittingRequest.value = true;
  Loading.show();

  try {
    clearFieldErrors();

    await authenticationStore.loginWithCredentials({
      email: emailAddress.value.trim(),
      password: userPassword.value,
    });

    Notify.create({
      type: "positive",
      message: "Bem-vindo!",
      position: "top-right",
    });

    await router.push("/");
  } catch (unknownError) {
    const domainError = mapHttpToDomainError(unknownError);
    const mapped = mapDomainErrorToFieldErrorMap(domainError);

    fieldErrorMap.value = mapped;

    Notify.create({
      type: "negative",
      message: domainError.message,
      position: "top-right",
    });
  } finally {
    Loading.hide();
    isSubmittingRequest.value = false;
  }
}

async function goToRegister(): Promise<void> {
  await router.push("/register");
}
</script>

<style scoped>
.field { margin-top: 12px; }
.actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
