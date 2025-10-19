<template>
  <header class="header">
    <div class="container row items-center justify-between">
      <div class="row items-center q-gutter-sm cursor-pointer" @click="goHome">
        <div class="brand">Onfly</div>
      </div>

      <nav class="row items-center q-gutter-md">
        <q-btn flat label="Início" color="white" @click="goHome" />
        <q-btn flat label="Sobre" color="white" @click="scrollTo('about')" />
        <q-btn flat label="Contato" color="white" @click="scrollTo('contact')" />

        <template v-if="isAuthenticated">
          <q-btn flat label="Dashboard" color="white" @click="goDashboard" />
          <q-btn outline color="white" text-color="white" label="Sair" @click="logout" />
        </template>

        <template v-else>
          <q-btn color="white" text-color="primary" label="Entrar" @click="goLogin" />
          <q-btn color="primary" unelevated label="Criar conta" @click="goRegister" />
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

async function goHome(): Promise<void> {
  await router.push('/');
}

async function goLogin(): Promise<void> {
  await router.push('/login');
}

async function goRegister(): Promise<void> {
  await router.push('/register');
}

async function goDashboard(): Promise<void> {
  await router.push('/app');
}

async function logout(): Promise<void> {
  await authStore.logoutUser();
  await router.push('/');
}

function scrollTo(id: string): void {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped>
.header {
  background: linear-gradient(90deg, #1e88e5 0%, #42a5f5 100%);
  color: white;
  padding: 12px 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px;
}

.brand {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: .2px;
}
</style>
