<template>
  <q-card flat bordered class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1">{{ componentTitle }}</div>
      <q-badge outline color="grey-7" :label="totalOrdersLabel" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-sm">Distribuição por status</div>

          <div v-if="isLoadingData" class="q-pa-md">
            <q-skeleton type="circle" size="150px" />
          </div>

          <div v-else class="chart-box">
            <Doughnut
              v-if="hasDoughnutValues"
              :data="doughnutChartData"
              :options="doughnutChartOptions"
              aria-label="Gráfico de pizza com a distribuição dos pedidos por status"
              role="img"
            />
            <div v-else class="text-grey-6 text-caption">Sem dados para exibir.</div>

            <span class="sr-only">{{ doughnutAccessibilityDescription }}</span>
          </div>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-grey-7 q-mb-sm">Pedidos por mês</div>

          <div v-if="isLoadingData" class="q-pa-md">
            <q-skeleton height="160px" square />
          </div>

          <div v-else class="chart-box">
            <Line
              v-if="hasLineValues"
              :data="lineChartData"
              :options="lineChartOptions"
              aria-label="Gráfico de linha com a quantidade de pedidos por mês"
              role="img"
            />
            <div v-else class="text-grey-6 text-caption">Sem dados para exibir.</div>

            <span class="sr-only">{{ lineAccessibilityDescription }}</span>
          </div>
        </q-card>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, withDefaults, defineProps } from "vue";
import {
  Chart as ChartJs,
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
} from "chart.js";
import { Doughnut, Line } from "vue-chartjs";
import type {
  TravelOrderEntity,
  TravelOrdersInsightsProps as ComponentPropsShape,
  OrderStatusCounter,
  MonthlyAggregationResult,
  MonthKeyAndLabelBuckets
} from "src/types/travelOrder.types";

ChartJs.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

const props = withDefaults(defineProps<ComponentPropsShape>(), {
  isLoading: false,
  monthsWindow: 6,
  title: "Visão Geral",
});

const componentTitle = computed<string>(() => props.title);

const isLoadingData = computed<boolean>(() => props.isLoading);

const colorStatusRequested = "#42A5F5";
const colorStatusApproved = "#43A047";
const colorStatusCanceled = "#E53935";
const colorLineSeries = "#1E88E5";

const statusLabelByCode: Record<TravelOrderEntity["status"], string> = {
  requested: "Solicitado",
  approved: "Aprovado",
  canceled: "Cancelado",
};

function buildMonthKeyFromDate(inputDate: Date): string {
  return `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, "0")}`;
}

function countOrdersByStatus(inputOrderList: TravelOrderEntity[]): OrderStatusCounter {
  return inputOrderList.reduce<OrderStatusCounter>((accumulator, currentOrder) => {
    accumulator[currentOrder.status] = (accumulator[currentOrder.status] ?? 0) + 1;
    return accumulator;
  }, { requested: 0, approved: 0, canceled: 0 });
}

function buildRecentMonthBuckets(totalMonths: number): MonthKeyAndLabelBuckets {
  const todayDate = new Date();
  const monthIndexOffsets = Array.from({ length: totalMonths }, (_, index) => totalMonths - 1 - index);

  const monthKeyList: string[] = [];
  const monthLabelList: string[] = [];

  monthIndexOffsets.forEach((offsetValue) => {
    const monthBaseDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - offsetValue, 1);
    const monthKeyText = buildMonthKeyFromDate(monthBaseDate);
    const monthLabelText = monthBaseDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthKeyList.push(monthKeyText);
    monthLabelList.push(monthLabelText);
  });

  return { keys: monthKeyList, labels: monthLabelList };
}

function aggregateOrdersByMonth(inputOrderList: TravelOrderEntity[], monthWindowSize: number): MonthlyAggregationResult {
  const { keys, labels } = buildRecentMonthBuckets(monthWindowSize);
  const monthCounterMap = new Map<string, number>(keys.map((key) => [key, 0]));

  inputOrderList.forEach((currentOrder) => {
    const monthKey = buildMonthKeyFromDate(new Date(currentOrder.created_at));
    if (!monthCounterMap.has(monthKey)) {
      return;
    }
    monthCounterMap.set(monthKey, (monthCounterMap.get(monthKey) ?? 0) + 1);
  });

  const valueList = keys.map((key) => monthCounterMap.get(key) ?? 0);

  return { labels, data: valueList };
}

function coerceChartValueToNumber(inputValue: unknown): number {
  if (typeof inputValue === "number") {
    return inputValue;
  }
  const possiblePoint = (inputValue as { y?: unknown })?.y;
  if (typeof possiblePoint === "number") {
    return possiblePoint;
  }
  const numericValue = Number(inputValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

const doughnutCenterTotalPlugin: Plugin<"doughnut"> = {
  id: "centerTotal",
  afterDraw(chartInstance): void {
    const datasetReference = chartInstance.data.datasets?.[0];
    const rawValueList = Array.isArray(datasetReference?.data) ? datasetReference.data : [];
    const totalValue = (rawValueList as unknown[]).reduce<number>((sumValue, currentItem) => sumValue + coerceChartValueToNumber(currentItem), 0);

    if (!totalValue) {
      return;
    }

    const { ctx, chartArea } = chartInstance;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.font = "600 16px system-ui, -apple-system, Roboto, Arial";
    ctx.fillStyle = "#37474F";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(totalValue), centerX, centerY);
    ctx.restore();
  },
};

ChartJs.register(doughnutCenterTotalPlugin);

const totalOrdersLabel = computed<string>(() => {
  return `${props.orders.length} pedido(s)`;
});

const statusCounter = computed<OrderStatusCounter>(() => {
  return countOrdersByStatus(props.orders);
});

const doughnutTotal = computed<number>(() => {
  return statusCounter.value.requested + statusCounter.value.approved + statusCounter.value.canceled;
});

const doughnutChartData = computed<ChartData<"doughnut">>(() => {
  return {
    labels: [statusLabelByCode.requested, statusLabelByCode.approved, statusLabelByCode.canceled],
    datasets: [
      {
        data: [statusCounter.value.requested, statusCounter.value.approved, statusCounter.value.canceled],
        backgroundColor: [colorStatusRequested, colorStatusApproved, colorStatusCanceled],
        borderWidth: 0,
      },
    ],
  };
});

const hasDoughnutValues = computed<boolean>(() => {
  return doughnutTotal.value > 0;
});

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom" as const },
    tooltip: { enabled: true },
  },
} satisfies ChartOptions<"doughnut">;

const monthlyAggregation = computed<MonthlyAggregationResult>(() => {
  return aggregateOrdersByMonth(props.orders, props.monthsWindow);
});

const lineTotal = computed<number>(() => {
  return monthlyAggregation.value.data.reduce((sumValue, currentValue) => sumValue + currentValue, 0);
});

const lineChartData = computed<ChartData<"line">>(() => {
  return {
    labels: monthlyAggregation.value.labels,
    datasets: [
      {
        label: "Pedidos",
        data: monthlyAggregation.value.data,
        tension: 0.25,
        borderColor: colorLineSeries,
        pointBackgroundColor: colorLineSeries,
        pointRadius: 3,
        fill: false,
      },
    ],
  };
});

const hasLineValues = computed<boolean>(() => {
  return lineTotal.value > 0;
});

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
} satisfies ChartOptions<"line">;

const doughnutAccessibilityDescription = computed<string>(() => {
  return `Total de ${props.orders.length} pedidos: ${statusCounter.value.requested} solicitados, ${statusCounter.value.approved} aprovados e ${statusCounter.value.canceled} cancelados.`;
});

const lineAccessibilityDescription = computed<string>(() => {
  const pointSummaryText = monthlyAggregation.value.labels.map((labelText, index) => `${labelText}: ${monthlyAggregation.value.data[index]}`).join("; ");
  return `Série temporal de pedidos nos últimos ${props.monthsWindow} meses. ${pointSummaryText}.`;
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
