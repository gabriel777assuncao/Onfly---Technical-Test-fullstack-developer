import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { api } from 'src/boot/axios';

export interface ITablePagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber?: number;
}

export type TravelOrderStatus = 'requested' | 'approved' | 'canceled';

export interface ITravelOrder {
  id: number;
  destination: string;
  departure_date: string;
  return_date: string;
  status: TravelOrderStatus;
  created_at: string;
  user_id?: number;
}

export interface IOrdersQueryParams {
  page?: number;
  'page.size'?: number;
  sort?: string;
  'filter[status]'?: string;
}

export interface ITableRequestPayload {
  pagination: ITablePagination;
  filter?: unknown;
  getCellValue: (column: unknown, row: unknown) => unknown;
}

export interface IUser {
  id: number;
  name: string;
  email?: string;
}

export interface ITravelOrder {
  id: number;
  requester_name: string | null;
  destination: string;
  departure_date: string;
  return_date: string;
  status: 'requested' | 'approved' | 'canceled';
  created_at: string;
  user_id?: number;
  user?: IUser | null;
}

interface ILaravelResourceCollection<T> {
  data: T[];
  meta?: { total?: number };
}

interface IWrappedLaravelCollection<T> {
  data: ILaravelResourceCollection<T>;
}

type IApiListResponse<T> =
  | IWrappedLaravelCollection<T>
  | ILaravelResourceCollection<T>
  | { data?: T[]; meta?: { total?: number } }
  | T[];

interface INormalizedList<T> {
  items: T[];
  total: number;
}

function normalizeApiListResponse<T>(response: IApiListResponse<T>): INormalizedList<T> {
  const wrapped = response as IWrappedLaravelCollection<T>;
  const resource = response as ILaravelResourceCollection<T>;
  const maybe = response as { data?: T[]; meta?: { total?: number } };

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
    return { items: response, total: response.length };
  }

  return { items: [], total: 0 };
}

type ApiError = { response?: { status?: number; data?: { message?: string } } };

function getApiErrorMessage(error: unknown, fallback = 'Erro ao atualizar o status do pedido.'): string {
  const err = error as ApiError;
  return err?.response?.data?.message ?? fallback;
}

export interface UseTravelOrdersOptions {
  currentUserId?: number | null;
  isAdmin?: boolean;
}

export function useTravelOrders(options: UseTravelOrdersOptions = {}): {
  travelOrders: Ref<ITravelOrder[]>;
  isLoading: Ref<boolean>;
  isUpdating: Ref<boolean>;
  selectedStatusFilter: Ref<string | null>;
  tablePagination: Ref<ITablePagination>;
  computedQueryParams: ComputedRef<IOrdersQueryParams>;
  fetchTravelOrders: () => Promise<void>;
  handleTableRequest: (payload: ITableRequestPayload) => Promise<void>;
  resetAllFilters: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: 'approved' | 'canceled') => Promise<{ success: boolean; message?: string }>;
  canUpdateStatus: (order: ITravelOrder) => boolean;
} {
  const { currentUserId = null, isAdmin = false } = options;

  const travelOrders = ref<ITravelOrder[]>([]);
  const isLoading = ref<boolean>(false);
  const isUpdating = ref<boolean>(false);
  const selectedStatusFilter = ref<string | null>(null);

  const tablePagination = ref<ITablePagination>({
    page: 1,
    rowsPerPage: 15,
    rowsNumber: 0,
    sortBy: 'created_at',
    descending: true,
  });

  const computedQueryParams = computed<IOrdersQueryParams>(() => {
    const queryParams: IOrdersQueryParams = {
      page: tablePagination.value.page,
      'page.size': tablePagination.value.rowsPerPage,
      sort: `${tablePagination.value.descending ? '-' : ''}${tablePagination.value.sortBy}`,
    };

    if (selectedStatusFilter.value) {
      queryParams['filter[status]'] = selectedStatusFilter.value;
    }

    return queryParams;
  });

  async function fetchTravelOrders(): Promise<void> {
    isLoading.value = true;

    try {
      const { data } = await api.get('/travel-orders', { params: computedQueryParams.value });
      const normalized = normalizeApiListResponse<ITravelOrder>(data);
      travelOrders.value = normalized.items;
      tablePagination.value.rowsNumber = normalized.total;
    } finally {
      isLoading.value = false;
    }
  }

  async function handleTableRequest(payload: ITableRequestPayload): Promise<void> {
    tablePagination.value = payload.pagination;
    await fetchTravelOrders();
  }

  async function resetAllFilters(): Promise<void> {
    selectedStatusFilter.value = null;
    tablePagination.value.page = 1;
    await fetchTravelOrders();
  }

  function canUpdateStatus(order: ITravelOrder): boolean {
    if (!isAdmin) return false;
    if (order.status !== 'requested') return false;

    const hasCurrentUser = currentUserId != null;
    const hasOwner = order.user_id != null;

    if (hasCurrentUser && hasOwner && currentUserId === order.user_id) return false;

    return true;
  }

  function applyOptimisticUpdate(orderIds: number[], newStatus: Exclude<TravelOrderStatus, 'requested'>): Map<number, TravelOrderStatus> {
    const previousStatuses = new Map<number, TravelOrderStatus>();

    for (const order of travelOrders.value) {
      const isTarget = orderIds.includes(order.id);
      if (!isTarget) continue;
      previousStatuses.set(order.id, order.status);
      order.status = newStatus;
    }

    return previousStatuses;
  }

  function rollbackOptimisticUpdate(previousStatuses: Map<number, TravelOrderStatus>): void {
    for (const order of travelOrders.value) {
      const previous = previousStatuses.get(order.id);
      if (!previous) continue;
      order.status = previous;
    }
  }

  async function updateOrderStatus(orderId: number, newStatus: 'approved' | 'canceled'): Promise<{ success: boolean; message?: string }> {
    if (!isAdmin) {
      return { success: false, message: 'Apenas administradores podem alterar o status.' };
    }

    const targetOrder = travelOrders.value.find((order) => order.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Pedido não encontrado.' };
    }

    const canUpdate = canUpdateStatus(targetOrder);
    if (!canUpdate) {
      return { success: false, message: 'Não é possível alterar o status deste pedido.' };
    }

    isUpdating.value = true;
    const snapshot = applyOptimisticUpdate([orderId], newStatus);

    try {
      await api.patch(`/travel-orders/${orderId}/status`, { status: newStatus });
      isUpdating.value = false;
      return { success: true, message: `Pedido ${newStatus === 'approved' ? 'aprovado' : 'cancelado'} com sucesso!` };
    } catch (error: unknown) {
      rollbackOptimisticUpdate(snapshot);
      isUpdating.value = false;
      const message = getApiErrorMessage(error);
      return { success: false, message };
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
