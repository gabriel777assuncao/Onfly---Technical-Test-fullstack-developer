<template>
  <q-page class="register-page">
    <div class="shell">
      <div class="brand">
        <q-avatar size="28px" class="brand-logo">
          <q-icon name="flight_takeoff" />
        </q-avatar>
        <span class="brand-name">Onfly • Travel</span>
      </div>

      <q-card class="card glass">
        <div class="card-hero">
          <div class="hero-left">
            <q-avatar size="44px" class="hero-avatar">
              <q-icon name="person_add" size="28px" />
            </q-avatar>
            <div>
              <div class="hero-title">Criar conta</div>
              <div class="hero-subtitle">Junte-se ao sistema de viagens</div>
            </div>
          </div>
          <q-badge color="white" text-color="primary" class="hero-badge" outline>
            Quasar v2
          </q-badge>
        </div>

        <q-separator color="white" />

        <q-card-section class="form-section">
          <q-form ref="formRef" greedy @submit.prevent="actions.submitRegistration">
            <q-input
              v-model="state.form.name"
              :rules="rules.nameRules"
              label="Nome completo"
              dense
              standout
              class="field"
              rounded
            >
              <template #prepend><q-icon name="badge" /></template>
            </q-input>

            <q-input
              v-model="state.form.username"
              :rules="rules.usernameRules"
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
              v-model="state.form.email"
              :rules="rules.emailRules"
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
              v-model="state.form.password"
              :rules="rules.passwordRules"
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
                  @click="actions.togglePasswordVisibility"
                  @keydown.enter.prevent="actions.togglePasswordVisibility"
                  @keydown.space.prevent="actions.togglePasswordVisibility"
                  @mousedown.prevent="actions.setPasswordVisibilityWhilePressing(true)"
                  @mouseup="actions.setPasswordVisibilityWhilePressing(false)"
                  @mouseleave="actions.setPasswordVisibilityWhilePressing(false)"
                  @touchstart.passive="actions.setPasswordVisibilityWhilePressing(true)"
                  @touchend.passive="actions.setPasswordVisibilityWhilePressing(false)"
                  :aria-label="isShowingPassword ? 'Ocultar senha' : 'Mostrar senha'"
                />
              </template>
              <template #hint>
                <div class="row items-center q-gutter-sm">
                  <q-linear-progress
                    :value="passwordStrength.value"
                    :color="passwordStrength.color"
                    track-color="grey-3"
                    class="pw-meter"
                  />
                  <span class="text-caption text-grey-7">{{ passwordStrength.label }}</span>
                </div>
              </template>
            </q-input>

            <q-input
              v-model="state.form.passwordConfirmation"
              :rules="rules.passwordConfirmationRules"
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
                  @click="actions.togglePasswordConfirmationVisibility"
                  @keydown.enter.prevent="actions.togglePasswordConfirmationVisibility"
                  @keydown.space.prevent="actions.togglePasswordConfirmationVisibility"
                  @mousedown.prevent="actions.setPasswordConfirmationVisibilityWhilePressing(true)"
                  @mouseup="actions.setPasswordConfirmationVisibilityWhilePressing(false)"
                  @mouseleave="actions.setPasswordConfirmationVisibilityWhilePressing(false)"
                  @touchstart.passive="actions.setPasswordConfirmationVisibilityWhilePressing(true)"
                  @touchend.passive="actions.setPasswordConfirmationVisibilityWhilePressing(false)"
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
                :loading="isSubmitting"
                :disable="!canSubmit"
                :aria-busy="isSubmitting"
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
                @click="actions.goToLogin"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <div class="tiny-note">
        Ao criar uma conta, você concorda com nossos
        <a href="#" class="note-link">Termos</a> e
        <a href="#" class="note-link">Política de Privacidade</a>.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { Notify, Loading, type QForm } from 'quasar';
import { useNotifyError } from 'src/composables/useNotifyError';
import { pickFieldToFocus } from 'src/ui/errorMessages';
import type { DomainError } from 'src/domain/errors';

const router = useRouter();
const authStore = useAuthStore();
const { notifyError } = useNotifyError();

const formRef = ref<QForm | null>(null);
const isSubmitting = ref(false);
const hasAcceptedTerms = ref(false);
const isShowingPassword = ref(false);
const isShowingPasswordConfirmation = ref(false);

type RegisterForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

const form = reactive<RegisterForm>({
  name: '',
  username: '',
  email: '',
  password: '',
  passwordConfirmation: '',
});

const requiredRule = (value: string) => (!!value && value.trim().length > 0) || 'Obrigatório';
const minLengthRule = (min: number) => (value: string) => (value?.trim().length >= min) || `Mínimo de ${min} caracteres`;
const maxLengthRule = (max: number) => (value: string) => (value?.trim().length <= max) || `Máximo de ${max} caracteres`;
const emailRule = (value: string) => /.+@.+\..+/.test(value) || 'E-mail inválido';

const nameRules = [requiredRule, minLengthRule(3), maxLengthRule(255)];
const usernameRules = [requiredRule, minLengthRule(3), maxLengthRule(255)];
const emailRules = [requiredRule, emailRule];

const passwordPolicyRule = (value: string) => {
  if (!value || value.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
  if (!/[A-Za-z]/.test(value)) return 'A senha deve conter letras';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) return 'A senha deve conter letras maiúsculas e minúsculas';
  if (!/[0-9]/.test(value)) return 'A senha deve conter números';
  if (!/[^A-Za-z0-9]/.test(value)) return 'A senha deve conter símbolos';

  return true;
};

const passwordRules = [requiredRule, passwordPolicyRule];
const passwordConfirmationRules = [
  requiredRule,
  (value: string) => value === form.password || 'Senhas diferentes',
];
const mustAcceptTermsRule = (value: boolean) => value || 'Você precisa aceitar os termos';

type StrengthView = { value: number; color: string; label: string };

const passwordStrength = computed<StrengthView>(() => {
  const password = form.password;
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map: StrengthView[] = [
    { value: 0.25, color: 'negative', label: 'Fraca' },
    { value: 0.5, color: 'warning', label: 'Média' },
    { value: 0.75, color: 'info', label: 'Boa' },
    { value: 1, color: 'positive', label: 'Forte' },
  ];

  return map[Math.min(score, 4) - 1] ?? { value: 0, color: 'grey-5', label: 'Muito fraca' };
});

const canSubmit = computed(() => !isSubmitting.value && hasAcceptedTerms.value);

function togglePasswordVisibility() {
  isShowingPassword.value = !isShowingPassword.value;
}

function togglePasswordConfirmationVisibility() {
  isShowingPasswordConfirmation.value = !isShowingPasswordConfirmation.value;
}

function setPasswordVisibilityWhilePressing(value: boolean) {
  isShowingPassword.value = value;
}

function setPasswordConfirmationVisibilityWhilePressing(value: boolean) {
  isShowingPasswordConfirmation.value = value;
}

async function submitRegistration() {
  const isFormValid = await formRef.value?.validate();
  if (!isFormValid) {
    return;
  }

  if (!canSubmit.value) {
    return;
  }

  isSubmitting.value = true;
  Loading.show();
  try {
    await authStore.registerAccount({
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.passwordConfirmation,
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
    const field = pickFieldToFocus(domainError);

    if (field) {
      return;
    }
  } finally {
    Loading.hide();
    isSubmitting.value = false;
  }
}

function goToLogin() {
  void router.push('/login');
}

const state = { form, formRef };
const rules = { nameRules, usernameRules, emailRules, passwordRules, passwordConfirmationRules };
const actions = {
  submitRegistration,
  goToLogin,
  togglePasswordVisibility,
  togglePasswordConfirmationVisibility,
  setPasswordVisibilityWhilePressing,
  setPasswordConfirmationVisibilityWhilePressing,
};
</script>

<style scoped>
.register-page {
  min-height: 100%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(1200px 600px at 12% 8%, rgba(25,118,210,0.10), transparent 55%),
    radial-gradient(900px 520px at 88% 92%, rgba(25,118,210,0.06), transparent 55%),
    linear-gradient(180deg, #f7fbff, #f2f6fb);
  padding: 24px;
}
.shell {
  width: min(96vw, 520px);
  display: grid;
  gap: 10px;
}

.brand { display: flex; align-items: center; gap: 8px; color: #1e88e5; margin-left: 4px; }
.brand-logo { background: rgba(30,136,229,.1); color: #1e88e5; }
.brand-name { font-weight: 600; letter-spacing: .2px; }

.card { border-radius: 18px; overflow: hidden; box-shadow: 0 12px 36px rgba(25,118,210,0.15); }
.glass { background: rgba(255,255,255,0.82); backdrop-filter: blur(6px); }

.card-hero {
  padding: 18px 18px;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  display: flex; align-items: center; justify-content: space-between;
}

.hero-left { display: flex; gap: 12px; align-items: center; }
.hero-avatar { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); }
.hero-title { font-size: 18px; font-weight: 700; letter-spacing: .2px; }
.hero-subtitle { font-size: 12.5px; opacity: .95; }
.hero-badge { backdrop-filter: blur(2px); }

.form-section { padding: 16px 16px 10px; }
.field { margin-top: 12px; }

:deep(.q-field__prepend .q-icon),
:deep(.q-field__append .q-icon) {
  font-size: 22px !important;
  color: #5f6368;
}

:deep(.q-field--focused .q-field__prepend .q-icon) { color: #1e88e5 !important; }

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
:deep(.q-field__label),
:deep(.q-placeholder) { color: #6b7280 !important; }
:deep(input),
:deep(textarea) { color: #111 !important; }

:deep(.q-field--error .q-field__control) {
  background: #fff6f6 !important;
  border: 1px solid #ef5350 !important;
  box-shadow: 0 0 6px rgba(239,83,80,0.25);
}
:deep(.q-field--error .q-field__native),
:deep(.q-field--error .q-field__prefix),
:deep(.q-field--error .q-field__suffix),
:deep(.q-field--error .q-field__label),
:deep(.q-icon) { color: #b71c1c !important; }
:deep(.q-field--error input) { color: #111 !important; }

.pw-meter { width: 120px; border-radius: 8px; }

.actions { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; }

:deep(.q-btn.btn),
:deep(.q-btn.btn-primary),
:deep(.q-btn.btn-secondary),
:deep(.q-btn.btn-ghost) {
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: .2px;
  transition: transform .08s ease, box-shadow .12s ease, background-color .12s ease, border-color .12s ease, color .12s ease;
}

:deep(.q-btn.btn-primary) {
  min-width: 150px;
  background-color: #1976d2 !important;
  color: #ffffff !important;
  box-shadow: 0 8px 16px rgba(25, 118, 210, .20);
  border: 1px solid transparent;
}
:deep(.q-btn.btn-primary:hover) {
  background-color: #1565c0 !important;
  box-shadow: 0 10px 18px rgba(25, 118, 210, .26);
}
:deep(.q-btn.btn-primary:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px rgba(25,118,210,.65);
}
:deep(.q-btn.btn-primary:disabled),
:deep(.q-btn.btn-primary.q-btn--disabled) {
  background-color: #90caf9 !important;
  color: #ffffff !important;
  box-shadow: none;
  cursor: not-allowed;
}

:deep(.q-btn.btn-secondary) {
  min-width: 130px;
  background-color: #ffffff !important;
  color: #1976d2 !important;
  border: 1px solid #90caf9 !important;
  box-shadow: none;
}
:deep(.q-btn.btn-secondary:hover) { background-color: #f5f9ff !important; border-color: #64b5f6 !important; }
:deep(.q-btn.btn-secondary:focus-visible) { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(25,118,210,.55); }
:deep(.q-btn.btn-secondary.q-btn--disabled) { background:#fafafa !important; color:#90a4ae !important; border-color:#e0e0e0 !important; }

:deep(.q-btn.btn-ghost) {
  background-color: transparent !important;
  color: #1976d2 !important;
  border: 1px solid transparent;
  box-shadow: none;
}
:deep(.q-btn.btn-ghost:hover) { background-color: #f5f9ff !important; }
:deep(.q-btn.btn-ghost:focus-visible) { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(25,118,210,.45); }

:deep(.q-btn.q-btn--loading.btn-primary),
:deep(.q-btn.q-btn--loading.btn-secondary),
:deep(.q-btn.q-btn--loading.btn-ghost) {
  transform: translateY(0);
  box-shadow: none;
}

.login-cta { display:flex; align-items:center; justify-content:center; gap:6px; }

.tiny-note { text-align:center; font-size:12.5px; color:#6b7280; margin-top:2px; }
.note-link { color:#1e88e5; text-decoration:none; }
.note-link:hover { text-decoration: underline; }

:root.body--dark & .register-page {
  background:
    radial-gradient(1200px 600px at 12% 8%, rgba(56,163,255,0.16), transparent 55%),
    radial-gradient(900px 520px at 88% 92%, rgba(56,163,255,0.10), transparent 55%),
    linear-gradient(180deg, #0e1420, #0b1220);
}
:root.body--dark & .glass { background: rgba(17,25,40,0.55); color: #e5e7eb; }
:root.body--dark & .pw-meter { background: rgba(255,255,255,.08); }

@media (prefers-reduced-motion: reduce) {
  :deep(.q-btn.btn),
  :deep(.q-btn.btn-primary),
  :deep(.q-btn.btn-secondary),
  :deep(.q-btn.btn-ghost) { transition: none; }
}
</style>
