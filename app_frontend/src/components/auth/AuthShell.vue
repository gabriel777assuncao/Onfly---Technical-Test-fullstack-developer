<template>
  <q-page :class="['auth-page', pageClassName]">
    <div class="shell" :style="containerStyleObject">
      <div v-if="displayBrandSection" class="brand">
        <q-avatar :size="brandAvatarSize" class="brand-logo">
          <q-icon :name="brandIconName" />
        </q-avatar>
        <span class="brand-name">
          <slot name="brand">Onfly • Travel</slot>
        </span>
      </div>

      <q-card class="card glass" :flat="isFlat" :bordered="isBordered">
        <div v-if="layoutVariant === 'hero'" class="card-hero">
          <div class="hero-left">
            <q-avatar :size="headerAvatarSize" class="hero-avatar">
              <q-icon :name="iconName" :size="headerIconSize" />
            </q-avatar>
            <div>
              <div class="hero-title">{{ headerTitle }}</div>
              <div class="hero-subtitle">{{ headerSubtitle }}</div>
            </div>
          </div>
          <slot name="hero-right">
            <q-badge v-if="badgeTextContent" color="white" text-color="primary" class="hero-badge" outline>
              {{ badgeTextContent }}
            </q-badge>
          </slot>
        </div>

        <q-card-section v-else class="header">
          <div class="brand">
            <q-avatar :size="headerAvatarSize" class="brand-logo">
              <q-icon :name="iconName" :size="headerIconSize" />
            </q-avatar>
            <div>
              <div class="title">{{ headerTitle }}</div>
              <div class="subtitle">{{ headerSubtitle }}</div>
            </div>
          </div>
          <slot name="header-right" />
        </q-card-section>

        <q-separator />

        <q-card-section class="form-section">
          <slot />
        </q-card-section>
      </q-card>

      <slot name="note" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LayoutVariant = 'hero' | 'simple';

const properties = withDefaults(
  defineProps<{
    layoutVariant?: LayoutVariant;
    headerTitle: string;
    headerSubtitle?: string;
    iconName?: string;
    headerIconSize?: string;
    headerAvatarSize?: string;
    cardMaxWidth?: number;
    isFlat?: boolean;
    isBordered?: boolean;
    displayBrandSection?: boolean;
    brandIconName?: string;
    brandAvatarSize?: string;
    pageClassName?: string;
    badgeTextContent?: string | null;
  }>(),
  {
    layoutVariant: 'simple',
    headerSubtitle: '',
    iconName: 'person',
    headerIconSize: '28px',
    headerAvatarSize: '44px',
    cardMaxWidth: 520,
    isFlat: false,
    isBordered: false,
    displayBrandSection: true,
    brandIconName: 'flight_takeoff',
    brandAvatarSize: '28px',
    pageClassName: '',
    badgeTextContent: null,
  }
);

const containerStyleObject = computed(() => {
  return { width: `min(96vw, ${properties.cardMaxWidth}px)` };
});
</script>

<style scoped>
.auth-page {
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
  display: grid;
  gap: 10px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e88e5;
  margin-left: 4px;
}
.brand-logo {
  background: rgba(30,136,229,.1);
  color: #1e88e5;
}
.brand-name {
  font-weight: 600;
  letter-spacing: .2px;
}
.card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(25,118,210,0.15);
}
.glass {
  background: rgba(255,255,255,0.86);
  backdrop-filter: blur(6px);
}
.card-hero {
  padding: 18px;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hero-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.hero-avatar {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.25);
}
.hero-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: .2px;
}
.hero-subtitle {
  font-size: 12.5px;
  opacity: .95;
}
.hero-badge {
  backdrop-filter: blur(2px);
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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
  padding-top: 8px;
  padding-left: 16px;
  padding-right: 16px;
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
  box-shadow: 0 10px 18px rgba(25,118,210,.26);
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
:deep(.q-btn.btn-ghost) {
  background-color: transparent !important;
  color: #1976d2 !important;
  border: 1px solid transparent;
  box-shadow: none;
}
:deep(.q-btn.btn-ghost:hover) {
  background-color: #f5f9ff !important;
}
:root.body--dark & .auth-page {
  background:
    radial-gradient(1200px 600px at 12% 8%, rgba(56,163,255,0.16), transparent 55%),
    radial-gradient(900px 520px at 88% 92%, rgba(56,163,255,0.10), transparent 55%),
    linear-gradient(180deg, #0e1420, #0b1220);
}
:root.body--dark & .glass {
  background: rgba(17,25,40,0.55);
  color: #e5e7eb;
}

:deep(.q-field__native),
:deep(.q-field__input),
:deep(.q-field__prefix),
:deep(.q-field__suffix) {
  color: #111 !important;
}

:deep(.q-field__label),
:deep(.q-placeholder) {
  color: #555 !important;
}

:deep(.q-field--focused .q-field__label),
:deep(.q-field--focused .q-placeholder) {
  color: #1e88e5 !important;
}

</style>
