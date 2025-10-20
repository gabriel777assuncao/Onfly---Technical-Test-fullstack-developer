import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import { api } from "boot/requests/httpClient";
import type {
  TravelOrderEntity,
  TablePaginationState,
  TableRequestPayload,
  TravelOrderStatusUpdateResponse,
} from "src/types/travelOrder.types";

type OrdersQueryParameters = {
  page?: number,
  "page.size"?: number,
  sort?: string,
  "filter[status]"?: string,
};

type LaravelResourceCollection<T> = { data: T[], meta?: { total?: number } };
type WrappedLaravelCollection<T> = { data: LaravelResourceCollection<T> };
type ApiListResponse<T> =
  | WrappedLaravelCollection<T>
  | LaravelResourceCollection<T>
  | { data?: T[], meta?: { total?: number } }
  | T[];

type NormalizedList<T> = { items: T[], total: number };

type ApiErrorShape = { response?: { status?: number, data?: { message?: string } } };

export interface UseTravelOrdersOptions {
  currentUserId?: number | null,
  isAdmin?: boolean,
}

export function useTravelOrders(options: UseTravelOrdersOptions = {}): {
  travelOrders: Ref<TravelOrderEntity[]>,
  isLoading: Ref<boolean>,
  isUpdating: Ref<boolean>,
  selectedStatusFilter: Ref<string | null>,
  tablePagination: Ref<TablePaginationState>,
  computedQueryParams: ComputedRef<OrdersQueryParameters>,
  fetchTravelOrders: () => Promise<void>,
  handleTableRequest: (requestPayload: TableRequestPayload) => Promise<void>,
  resetAllFilters: () => Promise<void>,
  updateOrderStatus: (orderId: number, nextStatusCode: "approved" | "canceled") => Promise<TravelOrderStatusUpdateResponse>,
  canUpdateStatus: (order: TravelOrderEntity) => boolean,
} {
  const { currentUserId = null, isAdmin = false } = options;

  const travelOrders = ref<TravelOrderEntity[]>([]);
  const isLoading = ref<boolean>(false);
  const isUpdating = ref<boolean>(false);
  const selectedStatusFilter = ref<string | null>(null);

  const tablePagination = ref<TablePaginationState>({
    page: 1,
    rowsPerPage: 15,
    rowsNumber: 0,
    sortBy: "created_at",
    descending: true,
  });

  const computedQueryParams = computed<OrdersQueryParameters>(() => {
    const queryParams: OrdersQueryParameters = {
      page: tablePagination.value.page,
      "page.size": tablePagination.value.rowsPerPage,
      sort: `${tablePagination.value.descending ? "-" : ""}${tablePagination.value.sortBy}`,
    };
    if (selectedStatusFilter.value) queryParams["filter[status]"] = selectedStatusFilter.value;
    return queryParams;
  });

  function normalizeApiListResponse<T>(response: ApiListResponse<T>): NormalizedList<T> {
    const wrapped = response as WrappedLaravelCollection<T>;
    const resource = response as LaravelResourceCollection<T>;
    const maybe = response as { data?: T[], meta?: { total?: number } };
    if (wrapped?.data && Array.isArray(wrapped.data.data)) return { items: wrapped.data.data, total: wrapped.data.meta?.total ?? wrapped.data.data.length };
    if (resource?.data && Array.isArray(resource.data)) return { items: resource.data, total: resource.meta?.total ?? resource.data.length };
    if (Array.isArray(maybe?.data)) return { items: maybe.data, total: maybe.meta?.total ?? maybe.data.length };
    if (Array.isArray(response)) return { items: response, total: response.length };
    return { items: [], total: 0 };
  }

  function extractErrorMessage(error: unknown, fallback = "Erro ao atualizar o status do pedido."): string {
    const structuredError = error as ApiErrorShape;
    return structuredError?.response?.data?.message ?? fallback;
  }

  async function fetchTravelOrders(): Promise<void> {
    isLoading.value = true;
    try {
      const { data } = await api.get("/travel-orders", { params: computedQueryParams.value });
      const normalized = normalizeApiListResponse<TravelOrderEntity>(data);
      travelOrders.value = normalized.items;
      tablePagination.value.rowsNumber = normalized.total;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleTableRequest(requestPayload: TableRequestPayload): Promise<void> {
    tablePagination.value = requestPayload.pagination;
    await fetchTravelOrders();
  }

  async function resetAllFilters(): Promise<void> {
    selectedStatusFilter.value = null;
    tablePagination.value.page = 1;
    await fetchTravelOrders();
  }

  function canUpdateStatus(order: TravelOrderEntity): boolean {
    if (!isAdmin) {
      return false;
    }

    if (order.status !== "requested") {
      return false;
    }

    const hasUser = currentUserId != null;
    const hasOwner = order.user_id != null;

    if (hasUser && hasOwner && currentUserId === order.user_id) {
      return false;
    }

    return true;
  }

  function applyOptimisticUpdate(orderIds: number[], nextStatus: "approved" | "canceled"): Map<number, TravelOrderEntity["status"]> {
    const snapshot = new Map<number, TravelOrderEntity["status"]>();
    for (const order of travelOrders.value) {
      if (!orderIds.includes(order.id)) continue;
      snapshot.set(order.id, order.status);
      order.status = nextStatus;
    }
    return snapshot;
  }

  function rollbackOptimisticUpdate(snapshot: Map<number, TravelOrderEntity["status"]>): void {
    for (const order of travelOrders.value) {
      const previousStatus = snapshot.get(order.id);
      if (previousStatus) order.status = previousStatus;
    }
  }

  async function updateOrderStatus(orderId: number, nextStatus: "approved" | "canceled"): Promise<TravelOrderStatusUpdateResponse> {
    if (!isAdmin) {
      return {success: false, message: "Apenas administradores podem alterar o status."}
    };

    const target = travelOrders.value.find((order) => order.id === orderId);

    if (!target) {
      return {success: false, message: "Pedido não encontrado."}
    }

    if (!canUpdateStatus(target)) {
      return {success: false, message: "Não é possível alterar o status deste pedido."}
    }

    isUpdating.value = true;
    const snapshot = applyOptimisticUpdate([orderId], nextStatus);

    try {
      await api.patch(`/travel-orders/${orderId}/status`, { status: nextStatus });
      isUpdating.value = false;
      return { success: true, message: `Pedido ${nextStatus === "approved" ? "aprovado" : "cancelado"} com sucesso!` };
    } catch (error) {
      rollbackOptimisticUpdate(snapshot);
      isUpdating.value = false;
      const message = extractErrorMessage(error);

      return { success: false, message };
    }
  }

  watch(computedQueryParams, async () => { await fetchTravelOrders(); }, { immediate: true });

  return {
    travelOrders,
    isLoading,
    isUpdating,
    selectedStatusFilter,
    tablePagination,
    computedQueryParams,
    fetchTravelOrders,
    handleTableRequest,
    resetAllFilters,
    updateOrderStatus,
    canUpdateStatus,
  };
}
