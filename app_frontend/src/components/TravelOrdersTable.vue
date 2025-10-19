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
      <q-btn :loading="isLoading" label="Atualizar" color="primary" @click="onRefresh" />
      <q-btn flat label="Limpar filtros" color="grey-8" @click="onReset" />
    </div>

    <q-table
      :rows="travelOrders"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      v-model:pagination="tablePagination"
      binary-state-sort
      @request="onTableRequest"
      flat
      bordered
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="statusColor(props.row.status)" :label="translateStatus(props.row.status)" />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <div v-if="showActionButtons(props.row)" class="q-gutter-xs">
            <q-btn
              size="sm"
              dense
              color="positive"
              icon="check"
              label="Aprovar"
              :loading="isUpdating"
              @click="confirmStatusUpdate(props.row, 'approved')"
            />
            <q-btn
              size="sm"
              dense
              color="negative"
              icon="close"
              label="Cancelar"
              :loading="isUpdating"
              @click="confirmStatusUpdate(props.row, 'canceled')"
            />
          </div>
          <div v-if="rowStatusNote(props.row)" class="text-caption text-grey-6">
            {{ rowStatusNote(props.row) }}
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { Notify, Dialog } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useTravelOrders, type ITravelOrder, type ITableRequestPayload } from 'src/composables/travel/useTravelOrders';

const auth = useAuthStore();
const isAdministrator = computed<boolean>(() => auth.isAdmin);

const {
  travelOrders,
  isLoading,
  isUpdating,
  selectedStatusFilter,
  tablePagination,
  fetchTravelOrders,
  handleTableRequest,
  resetAllFilters,
  updateOrderStatus,
  canUpdateStatus,
} = useTravelOrders({
  currentUserId: auth.user?.id ?? null,
  isAdmin: isAdministrator.value,
});

const statusOptions = [
  { label: 'Solicitado', value: 'requested' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Cancelado', value: 'canceled' },
];

const columns: QTableColumn[] = [
  { name: 'id', field: 'id', label: 'ID', align: 'left', sortable: true },
  {
    name: 'requester_name',
    field: (row: ITravelOrder) => row.requester_name ?? row.user?.name ?? '—',
    label: 'Solicitante',
    align: 'left',
    sortable: true,
  },
  { name: 'destination', field: 'destination', label: 'Destino', align: 'left', sortable: true },
  { name: 'departure_date', field: 'departure_date', label: 'Ida', align: 'left', sortable: true },
  { name: 'return_date', field: 'return_date', label: 'Volta', align: 'left', sortable: true },
  { name: 'status', field: 'status', label: 'Status', align: 'left', sortable: true },
  { name: 'created_at', field: 'created_at', label: 'Criado em', align: 'left', sortable: true },
  { name: 'actions', field: 'id', label: 'Ações', align: 'right', sortable: false },
];

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    requested: 'Solicitado',
    approved: 'Aprovado',
    canceled: 'Cancelado',
  };
  return map[status] ?? status;
}

function statusColor(status: string): string {
  if (status === 'approved') return 'positive';
  if (status === 'canceled') return 'negative';
  return 'warning';
}

function showActionButtons(travelOrder: ITravelOrder): boolean {
  if (!isAdministrator.value) return false;
  return canUpdateStatus(travelOrder);
}

function rowStatusNote(travelOrder: ITravelOrder): string {
  if (!isAdministrator.value) return 'Apenas admin';
  if (travelOrder.status !== 'requested') return translateStatus(travelOrder.status);
  return '';
}

async function onRefresh(): Promise<void> {
  await fetchTravelOrders();
}

async function onReset(): Promise<void> {
  await resetAllFilters();
}

async function onTableRequest(payload: ITableRequestPayload): Promise<void> {
  await handleTableRequest(payload);
}

function confirmStatusUpdate(travelOrder: ITravelOrder, nextStatus: 'approved' | 'canceled'): void {
  const actionText = nextStatus === 'approved' ? 'aprovar' : 'cancelar';

  Dialog.create({
    title: 'Confirmar ação',
    message: `Tem certeza que deseja ${actionText} este pedido?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    applyStatusUpdate(travelOrder.id, nextStatus)
      .catch(error => console.error('Erro ao atualizar status:', error));
  });
}

async function applyStatusUpdate(orderId: number, nextStatus: 'approved' | 'canceled'): Promise<void> {
  const result = await updateOrderStatus(orderId, nextStatus);
  if (result.success) {
    Notify.create({ type: 'positive', message: result.message || 'Status atualizado com sucesso!', position: 'top-right' });
    return;
  }
  Notify.create({ type: 'negative', message: result.message || 'Erro ao atualizar status.', position: 'top-right' });
}
</script>
