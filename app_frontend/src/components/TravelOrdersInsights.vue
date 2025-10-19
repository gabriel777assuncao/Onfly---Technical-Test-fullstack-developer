<template>
  <q-card flat bordered class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1">{{ title }}</div>
      <q-badge outline color="grey-7" :label="totalLabel" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-sm">Distribuição por status</div>

          <div v-if="isLoading" class="q-pa-md">
            <q-skeleton type="circle" size="150px" />
          </div>

          <div v-else class="chart-box">
            <Doughnut
              v-if="hasDoughnutData"
              :data="doughnutData"
              :options="doughnutOptions"
              aria-label="Gráfico de pizza com a distribuição dos pedidos por status"
              role="img"
            />
            <div v-else class="text-grey-6 text-caption">Sem dados para exibir.</div>

            <span class="sr-only">
              {{ donutA11yDescription }}
            </span>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-sm">Pedidos por mês</div>

          <div v-if="isLoading" class="q-pa-md">
            <q-skeleton height="160px" square />
          </div>

          <div v-else class="chart-box">
            <Line
              v-if="hasLineData"
              :data="lineData"
              :options="lineOptions"
              aria-label="Gráfico de linha com a quantidade de pedidos por mês"
              role="img"
            />
            <div v-else class="text-grey-6 text-caption">Sem dados para exibir.</div>

            <span class="sr-only">
              {{ lineA11yDescription }}
            </span>
          </div>
        </q-card>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

export interface ITravelOrder {
  id: number;
  destination: string;
  departure_date: string;
  return_date: string;
  status: 'requested' | 'approved' | 'canceled';
  created_at: string;
}

interface IStatusCount {
  requested: number;
  approved: number;
  canceled: number;
}

interface IMonthBuckets {
  keys: string[];
  labels: string[];
}

interface IMonthlyAggregation {
  labels: string[];
  data: number[];
}

const props = defineProps({
  orders: { type: Array as PropType<ITravelOrder[]>, required: true },
  isLoading: { type: Boolean, default: false },
  monthsWindow: { type: Number, default: 6 },
  title: { type: String, default: 'Visão Geral' },
});

const COLOR_STATUS_REQUESTED = '#42A5F5';
const COLOR_STATUS_APPROVED  = '#43A047';
const COLOR_STATUS_CANCELED  = '#E53935';
const COLOR_LINE_SERIES      = '#1E88E5';

const STATUS_LABEL_BY_CODE: Record<ITravelOrder['status'], string> = {
  requested: 'Solicitado',
  approved: 'Aprovado',
  canceled: 'Cancelado',
};

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function countOrdersByStatus(orders: ITravelOrder[]): IStatusCount {
  return orders.reduce<IStatusCount>((accumulator, order) => {
    accumulator[order.status] = (accumulator[order.status] ?? 0) + 1;
    return accumulator;
  }, { requested: 0, approved: 0, canceled: 0 });
}

function buildRecentMonthBuckets(totalMonths: number): IMonthBuckets {
  const today = new Date();
  const indexes = Array.from({ length: totalMonths }, (_, i) => totalMonths - 1 - i);

  const keys: string[] = [];
  const labels: string[] = [];

  indexes.forEach((offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const key = getMonthKey(date);
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    keys.push(key);
    labels.push(label);
  });

  return { keys, labels };
}

function aggregateOrdersByMonth(orders: ITravelOrder[], lastMonths: number): IMonthlyAggregation {
  const { keys, labels } = buildRecentMonthBuckets(lastMonths);
  const accumulator = new Map<string, number>(keys.map((k) => [k, 0]));

  orders.forEach((order) => {
    const monthKey = getMonthKey(new Date(order.created_at));

    if (!accumulator.has(monthKey)) {
      return;
    }
    accumulator.set(monthKey, (accumulator.get(monthKey) ?? 0) + 1);
  });

  const data = keys.map((k) => accumulator.get(k) ?? 0);
  return { labels, data };
}

function coerceToNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const maybeY = (value as { y?: unknown })?.y;
  if (typeof maybeY === 'number') return maybeY;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/** ===== Plugin: total no centro do donut ===== */
const doughnutCenterTotalPlugin: Plugin<'doughnut'> = {
  id: 'centerTotal',
  afterDraw(chart): void {
    const dataset = chart.data.datasets?.[0];
    const rawValues = Array.isArray(dataset?.data) ? dataset.data : [];
    const total = (rawValues as unknown[]).reduce<number>((sum, item) => sum + coerceToNumber(item), 0);

    if (!total) return;

    const { ctx, chartArea } = chart;
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.font = '600 16px system-ui, -apple-system, Roboto, Arial';
    ctx.fillStyle = '#37474F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), x, y);
    ctx.restore();
  },
};

ChartJS.register(doughnutCenterTotalPlugin);

const totalLabel = computed<string>(() => `${props.orders.length} pedido(s)`);

const doughnutData = computed<ChartData<'doughnut'>>(() => {
  const counts = countOrdersByStatus(props.orders);

  return {
    labels: [STATUS_LABEL_BY_CODE.requested, STATUS_LABEL_BY_CODE.approved, STATUS_LABEL_BY_CODE.canceled],
    datasets: [
      {
        data: [counts.requested, counts.approved, counts.canceled],
        backgroundColor: [COLOR_STATUS_REQUESTED, COLOR_STATUS_APPROVED, COLOR_STATUS_CANCELED],
        borderWidth: 0,
      },
    ],
  };
});

const hasDoughnutData = computed<boolean>(() => (doughnutData.value.datasets?.[0]?.data?.length ?? 0) > 0);

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: { enabled: true },
  },
} satisfies ChartOptions<'doughnut'>;

const lineData = computed<ChartData<'line'>>(() => {
  const monthly = aggregateOrdersByMonth(props.orders, props.monthsWindow);

  return {
    labels: monthly.labels,
    datasets: [
      {
        label: 'Pedidos',
        data: monthly.data,
        tension: 0.25,
        borderColor: COLOR_LINE_SERIES,
        pointBackgroundColor: COLOR_LINE_SERIES,
        pointRadius: 3,
        fill: false,
      },
    ],
  };
});

const hasLineData = computed<boolean>(() => (lineData.value.datasets?.[0]?.data?.length ?? 0) > 0);

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
} satisfies ChartOptions<'line'>;

const donutA11yDescription = computed<string>(() => {
  const c = countOrdersByStatus(props.orders);

  return `Total de ${props.orders.length} pedidos: ${c.requested} solicitados, ${c.approved} aprovados e ${c.canceled} cancelados.`;
});

const lineA11yDescription = computed<string>(() => {
  const monthly = aggregateOrdersByMonth(props.orders, props.monthsWindow);
  const points = monthly.labels.map((label, i) => `${label}: ${monthly.data[i]}`).join('; ');
  return `Série temporal de pedidos nos últimos ${props.monthsWindow} meses. ${points}.`;
});
</script>

<style scoped>
.chart-box { height: 220px; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  border: 0;
  padding: 0;
  white-space: nowrap;
  clip-path: inset(50%);
  clip: rect(0 0 0 0);
  overflow: hidden;
}
</style>
