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
import { ref } from 'vue'

const router = useRouter()
const isLoading = ref(false)

async function goLogin() {
  try {
    isLoading.value = true

    await new Promise(resolve => setTimeout(resolve, 1000))

    await router.push('/login')
  } catch (error) {
    console.error('Erro ao navegar para login:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
