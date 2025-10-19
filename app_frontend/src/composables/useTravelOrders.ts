import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { api } from 'src/boot/axios';

export interface ITablePagination {
  sortBy: string;
  descending: boolean;
  page: number;
  rowsPerPage: number;
  rowsNumber?: number;
}

export interface ITravelOrder {
  id: number;
  destination: string;
  departure_date: string;
  return_date: string;
  status: 'requested' | 'approved' | 'canceled';
  created_at: string;
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

  if (wrapped?.data && Array.isArray(wrapped.data.data)) {
    const items = wrapped.data.data;
    const total = wrapped.data.meta?.total ?? items.length;

    return { items, total };
  }

  const resource = response as ILaravelResourceCollection<T>;

  if (resource?.data && Array.isArray(resource.data)) {
    const items = resource.data;
    const total = resource.meta?.total ?? items.length;

    return { items, total };
  }

  const maybe = response as { data?: T[]; meta?: { total?: number } };
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

export function useTravelOrders(): {
  travelOrders: Ref<ITravelOrder[]>;
  isLoading: Ref<boolean>;
  selectedStatusFilter: Ref<string | null>;
  tablePagination: Ref<ITablePagination>;
  computedQueryParams: ComputedRef<IOrdersQueryParams>;
  fetchTravelOrders: () => Promise<void>;
  handleTableRequest: (payload: ITableRequestPayload) => void;
  resetAllFilters: () => void;
} {
  const travelOrders = ref<ITravelOrder[]>([]);
  const isLoading = ref<boolean>(false);
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

  function handleTableRequest(payload: ITableRequestPayload): void {
    tablePagination.value = payload.pagination;
    void fetchTravelOrders();
  }

  function resetAllFilters(): void {
    selectedStatusFilter.value = null;

    tablePagination.value.page = 1;
    void fetchTravelOrders();
  }

  watch(
    computedQueryParams,
    () => {
      void fetchTravelOrders();
    },
    { immediate: true },
  );

  return {
    travelOrders,
    isLoading,
    selectedStatusFilter,
    tablePagination,
    computedQueryParams,
    fetchTravelOrders,
    handleTableRequest,
    resetAllFilters,
  };
}
