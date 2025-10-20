import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import { api } from "boot/requests/httpClient";
import type {
  TravelOrderEntity,
  TablePaginationState,
  TableRequestPayload,
  TravelOrderStatusUpdateResponse,
} from "src/types/travelOrder.types";

interface OrdersQueryParameters {
  page?: number,
  "page.size"?: number,
  sort?: string,
  "filter[status]"?: string,
}

interface LaravelResourceCollection<T> {
  data: T[],
  meta?: { total?: number },
}

interface WrappedLaravelCollection<T> {
  data: LaravelResourceCollection<T>,
}

type ApiListResponse<T> =
  | WrappedLaravelCollection<T>
  | LaravelResourceCollection<T>
  | { data?: T[], meta?: { total?: number } }
  | T[];

interface NormalizedList<T> {
  items: T[],
  total: number,
}

interface ApiErrorShape {
  response?: { status?: number, data?: { message?: string } },
}

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

    if (selectedStatusFilter.value) {
      queryParams["filter[status]"] = selectedStatusFilter.value;
    }

    return queryParams;
  });

  function normalizeApiListResponse<T>(response: ApiListResponse<T>): NormalizedList<T> {
    const wrapped = response as WrappedLaravelCollection<T>;
    const resource = response as LaravelResourceCollection<T>;
    const maybe = response as { data?: T[], meta?: { total?: number } };

    if (wrapped?.data && Array.isArray(wrapped.data.data)) {
      const items = wrapped.data.data;
      const total = wrapped.data.meta?.total ?? items.length;

      return { items, total };
    }

    if (resource?.data && Array.isArray(resource.data)) {
      const items = resource.data;
      const total = resource.meta?.total ?? items.length;

      return { items, total };
    }

    if (Array.isArray(maybe?.data)) {
      const items = maybe.data;
      const total = maybe.meta?.total ?? items.length;

      return { items, total };
    }

    if (Array.isArray(response)) {
      const items = response;
      const total = response.length;

      return { items, total };
    }

    return { items: [], total: 0 };
  }

  function extractErrorMessage(unknownError: unknown, fallbackMessageText = "Erro ao atualizar o status do pedido."): string {
    const structuredError = unknownError as ApiErrorShape;
    const apiMessage = structuredError?.response?.data?.message;

    if (apiMessage) {
      return apiMessage;
    }

    return fallbackMessageText;
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

    const hasCurrentUser = currentUserId != null;
    const hasOwnerUser = order.user_id != null;

    if (hasCurrentUser && hasOwnerUser && currentUserId === order.user_id) {
      return false;
    }

    return true;
  }

  function applyOptimisticUpdate(orderIdentifierList: number[], nextStatusCode: "approved" | "canceled"): Map<number, TravelOrderEntity["status"]> {
    const previousStatusMap = new Map<number, TravelOrderEntity["status"]>();

    for (const order of travelOrders.value) {
      const isTarget = orderIdentifierList.includes(order.id);

      if (!isTarget) {
        continue;
      }

      previousStatusMap.set(order.id, order.status);
      order.status = nextStatusCode;
    }

    return previousStatusMap;
  }

  function rollbackOptimisticUpdate(previousStatusMap: Map<number, TravelOrderEntity["status"]>): void {
    for (const order of travelOrders.value) {
      const previousStatus = previousStatusMap.get(order.id);

      if (!previousStatus) {
        continue;
      }

      order.status = previousStatus;
    }
  }

  async function updateOrderStatus(orderId: number, nextStatusCode: "approved" | "canceled"): Promise<TravelOrderStatusUpdateResponse> {
    if (!isAdmin) {
      return { success: false, message: "Apenas administradores podem alterar o status." };
    }

    const targetOrder = travelOrders.value.find((order) => order.id === orderId);

    if (!targetOrder) {
      return { success: false, message: "Pedido não encontrado." };
    }

    const isAllowed = canUpdateStatus(targetOrder);

    if (!isAllowed) {
      return { success: false, message: "Não é possível alterar o status deste pedido." };
    }

    isUpdating.value = true;

    const previousStatusSnapshot = applyOptimisticUpdate([orderId], nextStatusCode);

    try {
      await api.patch(`/travel-orders/${orderId}/status`, { status: nextStatusCode });
      isUpdating.value = false;
      return { success: true, message: `Pedido ${nextStatusCode === "approved" ? "aprovado" : "cancelado"} com sucesso!` };
    } catch (unknownError) {
      rollbackOptimisticUpdate(previousStatusSnapshot);
      isUpdating.value = false;

      const messageText = extractErrorMessage(unknownError);
      return { success: false, message: messageText };
    }
  }

  watch(
    computedQueryParams,
    async () => {
      await fetchTravelOrders();
    },
    { immediate: true },
  );

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
