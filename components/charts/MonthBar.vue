<template>
  <div class="">
    <div
      class="w-full border-b border-gray-200 dark:border-gray-700 md:h-12 mb-4"
    >
      <div v-if="title">
        <h4
          class="text-lg text-center font-semibold text-green-950 dark:text-white my-2"
        >
          {{ title }}
        </h4>
      </div>
    </div>
    <div v-show="noData" :style="`width: ${width}; height: ${height};`">
      <h3 style="width: 100%; text-align: center; color: tomato">暂无数据</h3>
    </div>
    <div
      v-show="!noData"
      :id="chartId"
      class="chart-content"
      :style="`width: ${width}; height: ${height};`"
    ></div>
    <!-- 翻页控制 - 放在图表下方，与折线图拖动条对齐 -->
    <div
      v-if="allData.length > 0 && totalPages > 1"
      class="flex items-center justify-center gap-2 h-8 -mt-12 relative z-10"
    >
      <!-- 左箭头 -->
      <button
        @click="goToPreviousPage"
        :disabled="currentPageIndex === 0"
        class="relative z-20 p-1.5 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-green-950 dark:text-white transition-colors"
        title="上一页"
      >
        <ChevronLeftIcon class="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <!-- 当前时间范围显示 -->
      <span
        class="relative z-20 text-xs md:text-sm text-gray-600 dark:text-gray-400 px-2 py-1"
      >
        {{ currentPageRange }}
      </span>

      <!-- 右箭头 -->
      <button
        @click="goToNextPage"
        :disabled="currentPageIndex >= totalPages - 1"
        class="relative z-20 p-1.5 md:p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-green-950 dark:text-white transition-colors"
        title="下一页"
      >
        <ChevronRightIcon class="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  </div>

  <!-- 流水表格对话框 -->
  <div
    v-if="showFlowTable"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click="showFlowTable = false"
  >
    <div
      class="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      @click.stop
    >
      <div
        class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-green-950 dark:text-white">
          流水详情
        </h3>
        <button
          @click="showFlowTable = false"
          class="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          关闭
        </button>
      </div>
      <div class="p-2 md:p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
        <DatasFlowTable :query="query" v-if="showFlowTable" :actions="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { onMounted, ref, computed } from "vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";
import type { CommonChartData } from "~/utils/model";

// 使用 props 来接收外部传入的参数
const { title, width, height } = defineProps(["title", "width", "height"]);

// 生成唯一ID避免冲突
const chartId = ref(`chartDiv-${Math.random().toString(36).substr(2, 9)}`);

const dataListOut: any[] = [];
const dataListIn: any[] = [];
const notInOut: any[] = [];
const xAxisList: any[] = [];
const noData = ref(false);

const allData = ref<CommonChartData[]>([]);
const MONTHS_PER_PAGE = 6; // 每页显示6个月（半年）
const currentPageIndex = ref(0);

// 计算总页数
const totalPages = computed(() => {
  if (allData.value.length === 0) return 0;
  return Math.ceil(allData.value.length / MONTHS_PER_PAGE);
});

// 计算当前页面的时间范围显示
const currentPageRange = computed(() => {
  if (allData.value.length === 0) return "";
  const startIndex = currentPageIndex.value * MONTHS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + MONTHS_PER_PAGE - 1,
    allData.value.length - 1
  );
  const startMonth = allData.value[startIndex]?.type || "";
  const endMonth = allData.value[endIndex]?.type || "";
  if (startMonth && endMonth) {
    return `${startMonth} 至 ${endMonth}`;
  }
  return "";
});

// 翻页功能
const goToPreviousPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--;
    updateChartData();
  }
};

const goToNextPage = () => {
  if (currentPageIndex.value < totalPages.value - 1) {
    currentPageIndex.value++;
    updateChartData();
  }
};

// 更新图表数据（只显示当前页的6个月）
const updateChartData = () => {
  // 确保图表已初始化
  if (!chart) {
    return;
  }

  dataListOut.length = 0;
  dataListIn.length = 0;
  notInOut.length = 0;
  xAxisList.length = 0;

  let startIndex: number;
  let endIndex: number;

  // 如果是最后一页，确保显示最新的6个月（如果可能）
  if (currentPageIndex.value >= totalPages.value - 1) {
    // 计算最新的6个月的起始索引
    const startIndexForLatest6 = Math.max(0, allData.value.length - MONTHS_PER_PAGE);
    startIndex = startIndexForLatest6;
    endIndex = allData.value.length;
  } else {
    // 其他页面按正常分页逻辑
    startIndex = currentPageIndex.value * MONTHS_PER_PAGE;
    endIndex = Math.min(
      startIndex + MONTHS_PER_PAGE,
      allData.value.length
    );
  }

  const currentPageData = allData.value.slice(startIndex, endIndex);

  currentPageData.forEach((data) => {
    xAxisList.push(data.type);
    dataListOut.push(Number(data.outSum).toFixed(2));
    dataListIn.push(Number(data.inSum).toFixed(2));
    notInOut.push(Number(data.zeroSum).toFixed(2));
  });

  optionRef.value.series[0].data = dataListOut;
  optionRef.value.series[1].data = dataListIn;
  optionRef.value.series[2].data = notInOut;
  optionRef.value.xAxis.data = xAxisList;

  chart.setOption(optionRef.value, { notMerge: true });
};

const optionRef = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },

  toolbox: {
    feature: {
      // 下载按钮
      // saveAsImage: {}
    },
  },
  xAxis: {
    name: "年月",
    type: "category",
    data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
  },
  yAxis: {
    name: "金额(元)",
    type: "value",
  },

  legend: {
    selected: {
      支出: true,
      收入: true,
      不计收支: false,
    },
    data: [
      {
        name: "支出",
        textStyle: {
          color: "rgba(217,159,8, 0.9)",
        },
      },
      {
        name: "收入",
        textStyle: {
          color: "rgba(76, 152, 112, 0.9)",
        },
      },
      {
        name: "不计收支",
        textStyle: {
          color: "rgba(66, 66, 66, 0.9)",
        },
      },
    ], // 系列的名称，与 series 中的 name 对应
  },
  series: [
    {
      name: "支出",
      data: [120, 200, 150, 80, 70, 110, 130],
      type: "bar",
      itemStyle: {
        color: "rgba(217,159,8, 0.9)",
      },
      label: {
        show: true,
        position: "top",
        fontSize: 14,
        color: "rgba(217,159,8, 0.9)",
      },
    },
    {
      name: "收入",
      data: [120, 200, 150, 80, 70, 110, 130],
      type: "bar",
      itemStyle: {
        color: "rgba(76, 152, 112, 0.9)",
      },
      label: {
        show: true,
        position: "top",
        fontSize: 14,
        color: "rgba(76, 152, 112, 0.9)",
      },
    },
    {
      name: "不计收支",
      data: [120, 200, 150, 80, 70, 110, 130],
      type: "bar",
      itemStyle: {
        color: "rgba(66, 66, 66, 0.9)",
      },
      label: {
        show: true,
        position: "top",
        fontSize: 14,
        color: "rgba(66, 66, 66, 0.9)",
      },
    },
  ],
});

let chartDiv: any;
let chart: echarts.ECharts;

const query = ref<FlowQuery>({ pageNum: 1, pageSize: 20 });
const showFlowTable = ref(false);

const doQuery = () => {
  const queryParams: any = {
    bookId: localStorage.getItem("bookId"),
  };
  doApi
    .post<CommonChartData[]>("api/entry/analytics/month", queryParams)
    .then((res) => {
      if (res) {
        if (res.length === 0) {
          allData.value = [];
          noData.value = true;
          return;
        }
        // 按时间排序（从旧到新）
        allData.value = res.sort((a, b) => {
          return a.type.localeCompare(b.type);
        });
        noData.value = false;

        // 设置到最后一页，updateChartData会确保显示最新的6个月
        const totalPages = Math.ceil(allData.value.length / MONTHS_PER_PAGE);
        currentPageIndex.value = Math.max(0, totalPages - 1);

        // 更新图表数据
        updateChartData();
      }
    });
};

/**
 * 生成16进制随机颜色
 */
// const getRandomColor = () => {
//   var letters = '6789ABCDEF'
//   var color = '#'
//   for (var i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 10)]
//   }
//   return color
// }

onMounted(() => {
  chartDiv = document.getElementById(chartId.value);
  const oldInstance = echarts.getInstanceByDom(chartDiv);
  if (oldInstance) {
    oldInstance.dispose();
  }
  chart = echarts.init(chartDiv);
  chart.on("click", function (param) {
    query.value.startDay = param.name + "-01";
    query.value.endDay = param.name + "-31";
    showFlowTable.value = true;
  });
  doQuery();
});
</script>

<style scoped>
.chart-content {
  padding: 10px;
}

@media screen and (min-width: 960px) {
  .mini-buttons {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .pc-button {
    display: none;
  }

  .mini-buttons {
    margin: 8px 3px;
  }

  .chart-content {
    font-size: small;
  }

  .chart-content > div > canvas {
    margin: 20px;
  }
}
</style>
