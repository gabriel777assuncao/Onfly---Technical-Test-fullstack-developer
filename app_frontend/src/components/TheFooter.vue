<template>
  <footer class="footer">
    <div class="container row items-center justify-between">
      <div class="text-caption text-grey-6">
        © {{ year }} Onfly — Simplificando viagens corporativas
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn flat size="sm" color="grey-6" icon="email" labelement="Contato" @click="scrollTo('contact')" />
        <q-btn flat size="sm" color="grey-6" icon="code" labelement="GitHub" @click="goToRepo" />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const year = computed<number>(() => new Date().getFullYear());

function goToRepo(): void {
  window.open('https://github.com/gabrielement777assuncao', '_blank', 'noopener,noreferrer');
}

function scrollTo(id: string): void {
  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({behavior: 'smooth'});
  }
}
</script>

<style scoped>
.footer {
  background: #f2f8ff;
  border-top: 1px solid #e3edf8;
  color: #1b263b;
  padding: 20px 0;
}
.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
