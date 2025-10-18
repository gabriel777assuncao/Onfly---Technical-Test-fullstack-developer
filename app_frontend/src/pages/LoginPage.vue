<template>
  <q-page class="login-page">
    <q-card class="card glass" flat bordered>
      <q-card-section class="header">
        <div class="brand">
          <q-avatar size="36px" class="brand-logo">
            <q-icon name="flight_takeoff" />
          </q-avatar>
          <div>
            <div class="title">Entrar</div>
            <div class="subtitle">Acesse sua conta Onfly</div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="form-section">
        <q-form ref="formRef" greedy @submit.prevent="submitLogin">
          <q-input
            v-model="email"
            :rules="emailRules"
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
            v-model="password"
            :rules="passwordRules"
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
              :loading="isSubmitting"
              :disable="!canSubmit"
              type="submit"
              label="Entrar"
              class="btn-primary"
              color="primary"
              unelevated
              rounded
              no-caps
              :aria-busy="isSubmitting"
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
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, Loading, type QForm } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useNotifyError } from 'src/composables/useNotifyError';
import { pickFieldToFocus } from 'src/ui/errorMessages';
import type { DomainError } from 'src/domain/errors';

const router = useRouter();
const authStore = useAuthStore();
const { notifyError } = useNotifyError();

const email = ref<string>('');
const password = ref<string>('');
const isShowingPassword = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const formRef = ref<QForm | null>(null);

const requiredRule = (value: string) => (!!value && value.trim().length > 0) || 'Obrigatório';
const emailRule = (value: string) => /.+@.+\..+/.test(value) || 'E-mail inválido';
const emailRules = [requiredRule, emailRule];
const passwordRules = [requiredRule];

const canSubmit = computed<boolean>(() => !isSubmitting.value && !!email.value && !!password.value);

function togglePasswordVisibility(): void {
  isShowingPassword.value = !isShowingPassword.value;
}

async function submitLogin(): Promise<void> {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;
  if (!canSubmit.value) return;
  isSubmitting.value = true;
  Loading.show();
  try {
    await authStore.loginWithCredentials({ email: email.value.trim(), password: password.value });
    Notify.create({ type: 'positive', message: 'Bem-vindo!', position: 'top-right' });
    await router.push('/');
  } catch (error) {
    const domainError = error as DomainError;
    notifyError(domainError);
    const field = pickFieldToFocus(domainError);
    if (field === 'email') {
      return;
    }
    if (field === 'password') {
      return;
    }
  } finally {
    Loading.hide();
    isSubmitting.value = false;
  }
}

function goToRegister(): void {
  void router.push('/register');
}
</script>

<style scoped>
.login-page {
  min-height: 100%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(1200px 600px at 12% 8%, rgba(25,118,210,0.10), transparent 55%),
    radial-gradient(900px 520px at 88% 92%, rgba(25,118,210,0.06), transparent 55%),
    linear-gradient(180deg, #f7fbff, #f2f6fb);
  padding: 24px;
}
.card {
  width: min(96vw, 420px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(25,118,210,0.15);
}
.glass {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(6px);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.brand {
  display: flex;
  gap: 10px;
  align-items: center;
}
.brand-logo {
  background: rgba(30,136,229,.1);
  color: #1e88e5;
}
.title {
  font-weight: 700;
  font-size: 18px;
}
.subtitle {
  font-size: 12.5px;
  color: #6b7280;
}
.form-section {
  padding-top: 4px;
}
.field {
  margin-top: 12px;
}
.btn-ghost {
  border-radius: 10px;
}
.btn-primary {
  border-radius: 12px;
  min-height: 38px;
}
:deep(.q-field__control) {
  background: #fff !important;
  border: 1px solid #e0e0e0 !important;
  transition: all 0.2s ease;
  color: #111 !important;
}
:deep(.q-field--focused .q-field__control) {
  border-color: #42a5f5 !important;
  box-shadow: 0 0 4px rgba(66, 165, 245, 0.25);
  background: #f9fcff !important;
}
:root.body--dark & .login-page {
  background:
    radial-gradient(1200px 600px at 12% 8%, rgba(56,163,255,0.16), transparent 55%),
    radial-gradient(900px 520px at 88% 92%, rgba(56,163,255,0.10), transparent 55%),
    linear-gradient(180deg, #0e1420, #0b1220);
}
:root.body--dark & .glass {
  background: rgba(17,25,40,0.55);
  color: #e5e7eb;
}
</style>
