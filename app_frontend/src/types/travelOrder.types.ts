export type TravelOrderStatus = "requested" | "approved" | "canceled";

export interface CreateTravelOrderPayload {
  requester_name: string,
  destination: string,
  departure_date: string,
  return_date: string,
}

export interface CreateTravelOrderModalProps {
  modelValue: boolean,
  presetRequesterName?: string | null,
}

export interface TravelOrderEntity {
  id: number, // OBS: se seu backend mudar para string (ex: 'TRV-ABC123'), troque para `string`
  destination: string,
  departure_date: string,
  return_date: string,
  status: TravelOrderStatus,
  created_at: string,
  requester_name?: string | null,
  user_id?: number,
  user?: { name?: string | null },
}

export interface TablePaginationState {
  sortBy: string,
  descending: boolean,
  page: number,
  rowsPerPage: number,
  rowsNumber?: number,
}

export interface TableRequestPayload {
  pagination: TablePaginationState,
  filter?: unknown,
  getCellValue: (column: unknown, row: unknown) => unknown,
}

export interface TravelOrderStatusUpdateResponse {
  success: boolean,
  message?: string,
}

export interface OrderStatusCounter {
  requested: number,
  approved: number,
  canceled: number,
}

export interface MonthKeyAndLabelBuckets {
  keys: string[],
  labels: string[],
}

export interface MonthlyAggregationResult {
  labels: string[],
  data: number[],
}

export interface TravelOrdersInsightsProps {
  orders: TravelOrderEntity[],
  isLoading?: boolean,
  monthsWindow?: number,
  title?: string,
}

export interface TravelOrdersTableProps {
  isAdmin?: boolean,
  currentUserId?: number | null,
}
