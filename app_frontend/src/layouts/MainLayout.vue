<template>
  <q-layout view="lHh Lpr lFf">
    <TheHeader />

    <q-page-container>
      <router-view />
    </q-page-container>

    <TheFooter />
  </q-layout>
</template>

<script setup lang="ts">
import TheFooter from 'src/components/TheFooter.vue';
import TheHeader from "components/TheHeader.vue";
</script>

<style scoped>
.q-page-container {
  min-height: calc(100vh - 120px);
  background: #f9fbff;
}
</style>
