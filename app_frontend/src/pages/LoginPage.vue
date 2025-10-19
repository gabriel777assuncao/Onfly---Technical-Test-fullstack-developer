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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, Loading, type QForm } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useNotifyError } from 'src/composables/useNotifyError';
import { pickFieldToFocus } from 'src/ui/errorMessages';
import type { DomainError } from 'src/domain/errors';
import AuthShell from 'src/components/AuthShell.vue';

const router = useRouter();
const authenticationStore = useAuthStore();
const { notifyError } = useNotifyError();

const emailAddress = ref<string>('');
const userPassword = ref<string>('');
const isShowingPassword = ref<boolean>(false);
const isSubmittingRequest = ref<boolean>(false);
const formReference = ref<QForm | null>(null);

const requiredFieldRule = (value: string) => (!!value && value.trim().length > 0) || 'Obrigatório';
const emailFormatRule = (value: string) => /.+@.+\..+/.test(value) || 'E-mail inválido';
const emailValidationRules = [requiredFieldRule, emailFormatRule];
const passwordValidationRules = [requiredFieldRule];

const canSubmitForm = computed<boolean>(() => {
  return !isSubmittingRequest.value && !!emailAddress.value && !!userPassword.value;
});
function togglePasswordVisibility(): void {
  isShowingPassword.value = !isShowingPassword.value;
}

async function submitLogin(): Promise<void> {
  isSubmittingRequest.value = true;
  Loading.show();

  try {
    await authenticationStore.loginWithCredentials({
      email: emailAddress.value.trim(),
      password: userPassword.value,
    });

    Notify.create({
      type: 'positive',
      message: 'Bem-vindo!',
      position: 'top-right',
    });

    await router.push('/');
  } catch (error) {
    const domainError = error as DomainError;

    notifyError(domainError);
    pickFieldToFocus(domainError);
  } finally {
    Loading.hide();
    isSubmittingRequest.value = false;
  }
}

async function goToRegister(): Promise<void> {
    await router.push('/register');
}

</script>

<style scoped>
.field {
  margin-top: 12px;
}
.actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
