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

      <q-toolbar class="q-pa-none q-mb-md bg-grey-1 rounded-borders q-pl-sm q-pr-sm">
        <q-select
          v-model="selectedStatusFilter"
          :options="statusOptions"
          label="Filtrar por status"
          dense
          outlined
          clearable
          emit-value
          map-options
          style="min-width: 200px"
        />

        <q-btn
          color="primary"
          label="Atualizar"
          icon="refresh"
          :loading="isLoading"
          class="q-ml-sm"
          @click="fetchTravelOrders"
        />

        <q-btn
          flat
          color="secondary"
          label="Limpar filtros"
          icon="clear"
          class="q-ml-xs"
          @click="resetAllFilters"
        />

        <q-space />
        <div class="text-caption text-grey-7 q-pr-sm">
          {{ tablePagination.rowsNumber || 0 }} registro(s)
        </div>
      </q-toolbar>

      <q-table
        :rows="travelOrders"
        :columns="columns"
        row-key="id"
        :loading="isLoading"
        v-model:pagination="tablePagination"
        binary-state-sort
        @request="handleTableRequest"
        flat
        bordered
        class="shadow-1"
        :rows-per-page-options="[15]"
      >
        <template #body-cell-status="slotProps">
          <q-td :props="slotProps">
            <q-chip
              dense
              square
              :color="statusColor(slotProps.row.status)"
              text-color="white"
              :label="translateStatus(slotProps.row.status)"
            />
          </q-td>
        </template>
      </q-table>

    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import TravelOrdersInsights from 'src/components/TravelOrdersInsights.vue'
import { useTravelOrders } from 'src/composables/useTravelOrders'

const {
  travelOrders,
  isLoading,
  selectedStatusFilter,
  tablePagination,
  fetchTravelOrders,
  handleTableRequest,
  resetAllFilters,
} = useTravelOrders()

const statusOptions = [
  { label: 'Solicitado', value: 'requested' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Cancelado', value: 'canceled' },
]

const columns: QTableColumn[] = [
  { name: 'id', field: 'id', label: 'ID', align: 'left', sortable: true },
  { name: 'destination', field: 'destination', label: 'Destino', align: 'left', sortable: true },
  { name: 'departure_date', field: 'departure_date', label: 'Ida', align: 'left', sortable: true },
  { name: 'return_date', field: 'return_date', label: 'Volta', align: 'left', sortable: true },
  { name: 'status', field: 'status', label: 'Status', align: 'left', sortable: true },
  { name: 'created_at', field: 'created_at', label: 'Criado em', align: 'left', sortable: true },
]

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    requested: 'Solicitado',
    approved: 'Aprovado',
    canceled: 'Cancelado',
  }
  return map[status] ?? status
}

function statusColor(status: string): string {
  switch (status) {
    case 'approved':  return 'positive';
    case 'canceled':  return 'negative';
    case 'requested': return 'primary';

    default:          return 'grey';
  }
}

</script>

<style scoped>
.rounded-borders { border-radius: 10px; }
</style>
