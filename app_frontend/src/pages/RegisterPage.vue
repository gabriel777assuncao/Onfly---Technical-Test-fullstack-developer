<template>
  <AuthShell
    layout-variant="hero"
    :header-title="'Criar conta'"
    :header-subtitle="'Junte-se ao sistema de viagens'"
    :icon-name="'person_add'"
    :card-max-width="520"
    :badge-text-content="'Quasar v2'"
  >
    <q-form ref="formReference" greedy @submit.prevent="formActions.submitRegistration">
      <q-input
        v-model="registerForm.fullName"
        :rules="validationRules.fullNameValidationRules"
        label="Nome completo"
        dense
        standout
        class="field"
        rounded
      >
        <template #prepend><q-icon name="badge" /></template>
      </q-input>

      <q-input
        v-model="registerForm.userName"
        :rules="validationRules.userNameValidationRules"
        label="Usuário"
        dense
        standout
        class="field"
        rounded
      >
        <template #prepend><q-icon name="alternate_email" /></template>
        <template #hint>Nome de usuário para login</template>
      </q-input>

      <q-input
        v-model="registerForm.emailAddress"
        :rules="validationRules.emailAddressValidationRules"
        label="E-mail"
        type="email"
        dense
        standout
        class="field"
        rounded
      >
        <template #prepend><q-icon name="mail" /></template>
      </q-input>

      <q-input
        v-model="registerForm.userPassword"
        :rules="validationRules.userPasswordValidationRules"
        :type="isShowingPassword ? 'text' : 'password'"
        label="Senha"
        dense
        standout
        class="field"
        rounded
        autocomplete="new-password"
      >
        <template #prepend><q-icon name="lock" /></template>
        <template #append>
          <q-icon
            :name="isShowingPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            role="button"
            tabindex="0"
            @click="formActions.togglePasswordVisibility"
            @keydown.enter.prevent="formActions.togglePasswordVisibility"
            @keydown.space.prevent="formActions.togglePasswordVisibility"
            @mousedown.prevent="formActions.setPasswordVisibilityWhilePressing(true)"
            @mouseup="formActions.setPasswordVisibilityWhilePressing(false)"
            @mouseleave="formActions.setPasswordVisibilityWhilePressing(false)"
            @touchstart.passive="formActions.setPasswordVisibilityWhilePressing(true)"
            @touchend.passive="formActions.setPasswordVisibilityWhilePressing(false)"
            :aria-label="isShowingPassword ? 'Ocultar senha' : 'Mostrar senha'"
          />
        </template>
        <template #hint>
          <div class="row items-center q-gutter-sm">
            <q-linear-progress
              :value="passwordStrengthView.value"
              :color="passwordStrengthView.color"
              track-color="grey-3"
              class="pw-meter"
            />
            <span class="text-caption text-grey-7">{{ passwordStrengthView.label }}</span>
          </div>
        </template>
      </q-input>

      <q-input
        v-model="registerForm.userPasswordConfirmation"
        :rules="validationRules.userPasswordConfirmationValidationRules"
        :type="isShowingPasswordConfirmation ? 'text' : 'password'"
        label="Confirmar senha"
        dense
        standout
        class="field"
        rounded
        autocomplete="new-password"
      >
        <template #prepend><q-icon name="lock_person" /></template>
        <template #append>
          <q-icon
            :name="isShowingPasswordConfirmation ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            role="button"
            tabindex="0"
            @click="formActions.togglePasswordConfirmationVisibility"
            @keydown.enter.prevent="formActions.togglePasswordConfirmationVisibility"
            @keydown.space.prevent="formActions.togglePasswordConfirmationVisibility"
            @mousedown.prevent="formActions.setPasswordConfirmationVisibilityWhilePressing(true)"
            @mouseup="formActions.setPasswordConfirmationVisibilityWhilePressing(false)"
            @mouseleave="formActions.setPasswordConfirmationVisibilityWhilePressing(false)"
            @touchstart.passive="formActions.setPasswordConfirmationVisibilityWhilePressing(true)"
            @touchend.passive="formActions.setPasswordConfirmationVisibilityWhilePressing(false)"
            :aria-label="isShowingPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'"
          />
        </template>
      </q-input>

      <div class="actions">
        <q-checkbox
          v-model="hasAcceptedTerms"
          :true-value="true"
          :false-value="false"
          :rules="[mustAcceptTermsRule]"
          label="Aceito os termos"
        />
        <q-btn
          type="submit"
          :loading="isSubmittingRequest"
          :disable="!canSubmitForm"
          :aria-busy="isSubmittingRequest"
          label="Cadastrar"
          class="btn-primary"
          unelevated
          rounded
          no-caps
        />
      </div>

      <q-separator class="q-my-md" />

      <div class="login-cta">
        <span class="text-caption text-grey-7">Já tem conta?</span>
        <q-btn
          flat
          class="btn-ghost"
          color="primary"
          padding="xs sm"
          label="Entrar"
          @click="formActions.goToLogin"
        />
      </div>
    </q-form>

    <template #note>
      <div class="tiny-note">
        Ao criar uma conta, você concorda com nossos
        <a href="#" class="note-link">Termos</a> e
        <a href="#" class="note-link">Política de Privacidade</a>.
      </div>
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { Notify, Loading, type QForm } from 'quasar';
import { useNotifyError } from 'src/composables/errors/useNotifyError';
import { pickFieldToFocus } from 'src/ui/errorMessages';
import type { DomainError } from 'src/domain/errors';
import AuthShell from 'components/auth/AuthShell.vue';
import { useRegisterValidation } from 'src/services/RegisterValidation';

const router = useRouter();
const authenticationStore = useAuthStore();
const { notifyError } = useNotifyError();

const formReference = ref<QForm | null>(null);
const isSubmittingRequest = ref<boolean>(false);
const hasAcceptedTerms = ref<boolean>(false);
const isShowingPassword = ref<boolean>(false);
const isShowingPasswordConfirmation = ref<boolean>(false);

type RegisterForm = {
  fullName: string;
  userName: string;
  emailAddress: string;
  userPassword: string;
  userPasswordConfirmation: string;
};

const registerForm = reactive<RegisterForm>({
  fullName: '',
  userName: '',
  emailAddress: '',
  userPassword: '',
  userPasswordConfirmation: '',
});

const { validationRules, mustAcceptTermsRule, passwordStrengthView } = useRegisterValidation(() => registerForm.userPassword);

const canSubmitForm = computed<boolean>(() => {
  return !isSubmittingRequest.value && hasAcceptedTerms.value;
});

async function submitRegistration(): Promise<void> {
  const isFormValid = await formReference.value?.validate();
  if (!isFormValid) {
    return;
  }

  if (!canSubmitForm.value) {
    return;
  }

  isSubmittingRequest.value = true;
  Loading.show();

  try {
    await authenticationStore.registerAccount({
      name: registerForm.fullName.trim(),
      username: registerForm.userName.trim(),
      email: registerForm.emailAddress.trim(),
      password: registerForm.userPassword,
      password_confirmation: registerForm.userPasswordConfirmation,
    });
    Notify.create({
      type: 'positive',
      message: 'Conta criada e login efetuado! 🎉',
      position: 'top-right',
    });

    await router.push('/');
  } catch (error) {
    const domainError = error as DomainError;
    notifyError(domainError);
    const fieldName = pickFieldToFocus(domainError);

    if (fieldName) {
      return;
    }
  } finally {
    Loading.hide();
    isSubmittingRequest.value = false;
  }
}

function togglePasswordVisibility(): void {
  isShowingPassword.value = !isShowingPassword.value;
}

function togglePasswordConfirmationVisibility(): void {
  isShowingPasswordConfirmation.value = !isShowingPasswordConfirmation.value;
}

function setPasswordVisibilityWhilePressing(value: boolean): void {
  isShowingPassword.value = value;
}

function setPasswordConfirmationVisibilityWhilePressing(value: boolean): void {
  isShowingPasswordConfirmation.value = value;
}

async function goToLogin(): Promise<void> {
  await router.push('/login');
}

const formActions = {
  submitRegistration,
  goToLogin,
  togglePasswordVisibility,
  togglePasswordConfirmationVisibility,
  setPasswordVisibilityWhilePressing,
  setPasswordConfirmationVisibilityWhilePressing,
};

</script>

<style scoped>
.field {
  margin-top: 12px;
}
.pw-meter {
  width: 120px;
  border-radius: 8px;
}
.actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.login-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.tiny-note {
  text-align: center;
  font-size: 12.5px;
  color: #6b7280;
  margin-top: 2px;
}
.note-link {
  color: #1e88e5;
  text-decoration: none;
}
.note-link:hover {
  text-decoration: underline;
}
</style>
