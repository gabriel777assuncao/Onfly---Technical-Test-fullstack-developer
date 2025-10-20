<template>
  <div class="q-gutter-md">
    <!-- Header com filtros -->
    <div class="row items-center q-gutter-sm">
      <q-select
        v-model="selectedStatusFilter"
        :options="travelOrderStatusOptionList"
        label="Filtrar por status"
        dense
        outlined
        clearable
        emit-value
        map-options
        style="min-width: 240px"
      />

      <q-btn
        :loading="isLoading"
        label="Atualizar"
        color="primary"
        @click="onRefresh"
      />

      <q-btn
        flat
        label="Limpar filtros"
        color="grey-8"
        @click="onReset"
      />

      <q-space />

      <q-btn
        color="primary"
        icon="add"
        label="Novo pedido"
        @click="isCreateDialogVisible = true"
      />
    </div>

    <!-- Tabela de pedidos -->
    <q-table
      :rows="travelOrders"
      :columns="tableColumnList"
      row-key="id"
      :loading="isLoading"
      v-model:pagination="tablePagination"
      binary-state-sort
      @request="onTableRequest"
      flat
      bordered
    >
      <!-- Coluna de status -->
      <template #body-cell-status="slotScope">
        <q-td :props="slotScope">
          <q-badge
            :color="statusColorByCode[slotScope.row.status]"
            :label="statusLabelByCode[slotScope.row.status]"
          />
        </q-td>
      </template>

      <!-- Coluna de ações -->
      <template #body-cell-actions="slotScope">
        <q-td :props="slotScope" class="text-right">
          <div v-if="shouldDisplayActionButtons(slotScope.row)" class="q-gutter-xs">
            <q-btn
              size="sm"
              dense
              color="positive"
              icon="check"
              label="Aprovar"
              :loading="isUpdating"
              @click="confirmStatusUpdate(slotScope.row, 'approved')"
            />
            <q-btn
              size="sm"
              dense
              color="negative"
              icon="close"
              label="Cancelar"
              :loading="isUpdating"
              @click="confirmStatusUpdate(slotScope.row, 'canceled')"
            />
          </div>

          <div v-if="rowStatusNote(slotScope.row)" class="text-caption text-grey-6">
            {{ rowStatusNote(slotScope.row) }}
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Modal de criação -->
    <CreateTravelOrderModal
      v-model="isCreateDialogVisible"
      :preset-requester-name="authenticationStore.user?.name ?? null"
      @created="onCreatedOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { QTableColumn } from "quasar";
import { Notify, Dialog } from "quasar";
import { useAuthStore } from "stores/auth";
import { useTravelOrders } from "src/composables/travel/useTravelOrders";
import type { TravelOrderEntity, TableRequestPayload } from "src/types/travelOrder.types";
import CreateTravelOrderModal from "components/travel/CreateTravelOrderForm.vue";

/** ======== Stores e Estado Global ======== **/
const authenticationStore = useAuthStore();
const isAdministratorProfile = computed<boolean>(() => authenticationStore.isAdmin);

/** ======== Estados Locais ======== **/
const isCreateDialogVisible = ref<boolean>(false);

/** ======== Composable Principal ======== **/
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
  currentUserId: authenticationStore.user?.id ?? null,
  isAdmin: isAdministratorProfile.value,
});

/** ======== Constantes de Status ======== **/
const travelOrderStatusOptionList = [
  { label: "Solicitado", value: "requested" },
  { label: "Aprovado", value: "approved" },
  { label: "Cancelado", value: "canceled" },
];

const statusLabelByCode: Record<string, string> = {
  requested: "Solicitado",
  approved: "Aprovado",
  canceled: "Cancelado",
};

const statusColorByCode: Record<string, string> = {
  requested: "warning",
  approved: "positive",
  canceled: "negative",
};

/** ======== Colunas da Tabela ======== **/
const tableColumnList: QTableColumn[] = [
  { name: "id", field: "id", label: "ID", align: "left", sortable: true },
  {
    name: "requester_name",
    field: (row: TravelOrderEntity) => row.requester_name ?? row.user?.name ?? "—",
    label: "Solicitante",
    align: "left",
    sortable: true,
  },
  { name: "destination", field: "destination", label: "Destino", align: "left", sortable: true },
  { name: "departure_date", field: "departure_date", label: "Ida", align: "left", sortable: true },
  { name: "return_date", field: "return_date", label: "Volta", align: "left", sortable: true },
  { name: "status", field: "status", label: "Status", align: "left", sortable: true },
  { name: "created_at", field: "created_at", label: "Criado em", align: "left", sortable: true },
  { name: "actions", field: "id", label: "Ações", align: "right", sortable: false },
];

/** ======== Lógica ======== **/
function shouldDisplayActionButtons(travelOrder: TravelOrderEntity): boolean {
  return isAdministratorProfile.value && canUpdateStatus(travelOrder);
}

function rowStatusNote(travelOrder: TravelOrderEntity): string {
  if (!isAdministratorProfile.value) return "Apenas admin";
  if (travelOrder.status !== "requested")
    return statusLabelByCode[travelOrder.status] ?? travelOrder.status;
  return "";
}

async function onRefresh(): Promise<void> {
  await fetchTravelOrders();
}

async function onReset(): Promise<void> {
  await resetAllFilters();
}

async function onTableRequest(requestPayload: TableRequestPayload): Promise<void> {
  await handleTableRequest(requestPayload);
}

function confirmStatusUpdate(travelOrder: TravelOrderEntity, nextStatusCode: "approved" | "canceled"): void {
  const actionText = nextStatusCode === "approved" ? "aprovar" : "cancelar";
  Dialog.create({
    title: "Confirmar ação",
    message: `Tem certeza que deseja ${actionText} este pedido?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    applyStatusUpdate(travelOrder.id, nextStatusCode).catch(() => {});
  });
}

async function applyStatusUpdate(travelOrderIdentifier: number, nextStatusCode: "approved" | "canceled"): Promise<void> {
  const updateResult = await updateOrderStatus(travelOrderIdentifier, nextStatusCode);

  const notifyType = updateResult.success ? "positive" : "negative";
  const message =
    updateResult.message ??
    (updateResult.success
      ? "Status atualizado com sucesso!"
      : "Erro ao atualizar status.");

  Notify.create({
    type: notifyType,
    message,
    position: "top-right",
  });
}

async function onCreatedOrder(): Promise<void> {
  isCreateDialogVisible.value = false;
  await fetchTravelOrders();
}
</script>
