<template>
  <q-page class="flex flex-center">
    <div class="column items-center q-gutter-md">
      <div class="text-h5">Bem-vindo ao Onfly Travel Manager 🚀</div>
      <q-btn color="primary" label="Ir para Login" @click="goLogin" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
function goLogin() {
  void router.push('/login')
}
</script>
