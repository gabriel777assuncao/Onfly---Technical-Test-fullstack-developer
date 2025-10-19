<template>
  <div class="q-gutter-md">
    <div class="row items-center q-gutter-sm">
      <q-select
        v-model="selectedStatusFilter"
        :options="statusOptions"
        label="Filtrar por status"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 240px"
      />
      <q-btn :loading="isLoading" label="Atualizar" color="primary" @click="fetchTravelOrders" />
      <q-btn flat label="Limpar filtros" color="grey-8" @click="resetAllFilters" />
    </div>

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
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="statusColor(props.row.status)"
            :label="translateStatus(props.row.status)"
          />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'
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
  return status === 'approved'
    ? 'positive'
    : status === 'canceled'
      ? 'negative'
      : 'warning'
}
</script>
