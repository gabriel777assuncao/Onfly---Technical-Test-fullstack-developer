<template>
  <q-page class="q-pa-lg bg-grey-2">
    <q-card flat bordered class="q-pa-md bg-white">

      <div class="row items-center justify-between q-mb-md">
        <div class="text-h5 text-primary">
          <q-icon name="dashboard" size="sm" class="q-mr-sm" />
          Dashboard — Pedidos de Viagem
        </div>
      </div>

      <TravelOrdersInsights :orders="travelOrders" :isLoading="isLoading" class="q-mb-md" />

      <TravelOrdersTable />

    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import TravelOrdersInsights from 'src/components/TravelOrdersInsights.vue';
import TravelOrdersTable from 'src/components/TravelOrdersTable.vue';
import { useTravelOrders } from 'src/composables/travel/useTravelOrders';
import { useAuthStore } from 'src/stores/auth';
import { computed } from 'vue';

const auth = useAuthStore();
const isAdmin = computed(() => auth.isAdmin);

const {
  travelOrders,
  isLoading,
} = useTravelOrders({
  currentUserId: auth.user?.id ?? null,
  isAdmin: isAdmin.value
});

</script>

<style scoped>
.rounded-borders { border-radius: 10px; }
</style>
