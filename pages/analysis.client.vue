<template>
  <div class="w-full">
    <!-- Content Area -->
    <div class="xl:max-w-[80vw] mx-auto w-full mt-2">
      <!-- Desktop & Tablet: Chart Carousel -->
      <div class="w-full" v-if="!loading">
        <div
          class="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-2 md:p-4 mb-4"
        >
          <!-- Chart Container -->
          <div
            class="w-full flex flex-col md:flex-row justify-between md:space-x-4 space-y-4 md:space-y-0 rounded-md p-2"
          >
            <div class="w-full border-b md:border-b-0 md:border-r flex flex-col">
              <DailyLineChart
                title="每日流水曲线"
                width="100%"
                height="300px"
              />
            </div>
            <div class="w-full flex flex-col">
              <MonthBar title="每月流水统计" width="100%" height="300px" />
            </div>
          </div>
        </div>
        <div
          class="w-full bg-white dark:bg-gray-900 rounded-lg shadow p-2 md:p-4 mb-4"
        >
          <!-- Chart Container -->
          <div
            class="flex justify-between items-center flex-col md:flex-row gap-2 md:gap-4 md:items-center w-full md:w-auto mb-4"
          >
            <h3 class="min-w-20 text-base md:text-lg font-semibold text-green-950 dark:text-white">
              收支分析
            </h3>
            <!-- 时间筛选和图表类型切换 -->
            <!-- 时间筛选 -->
            <div class="flex gap-2 items-center flex-wrap">
              <UiDatePicker
                v-model="flowStartDay"
                placeholder="开始日期"
                class="text-sm md:text-base w-36 md:w-48"
                clearable
              />
              <span class="text-gray-500 dark:text-gray-400">至</span>
              <UiDatePicker
                v-model="flowEndDay"
                placeholder="结束日期"
                class="text-sm md:text-base w-36 md:w-48"
                clearable
                position="right"
              />
            </div>
            <!-- 图表类型切换 -->
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                @click="flowChartType = 'pie'"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                  flowChartType === 'pie'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                ]"
              >
                饼图
              </button>
              <button
                @click="flowChartType = 'bar'"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                  flowChartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                ]"
              >
                柱图
              </button>
            </div>
          </div>

          <!-- 饼图展示 -->
          <div
            v-if="flowChartType === 'pie'"
            class="w-full flex flex-col md:flex-row justify-between md:space-x-4 space-y-4 md:space-y-0 rounded-md p-2"
          >
            <div class="w-full border-b md:border-b-0 md:border-r">
              <ChartsCommonPie
                title="支出类型分析"
                width="100%"
                height="300px"
                groupBy="industryType"
                flowType="支出"
                seriesName="支出类型"
                :showLegend="true"
                queryField="industryType"
                :startDay="flowStartDay || undefined"
                :endDay="flowEndDay || undefined"
              />
            </div>
            <div class="w-full">
              <ChartsCommonPie
                title="收入类型分析"
                width="100%"
                height="300px"
                groupBy="industryType"
                flowType="收入"
                seriesName="收入类型"
                :showLegend="true"
                queryField="industryType"
                :startDay="flowStartDay || undefined"
                :endDay="flowEndDay || undefined"
              />
            </div>
          </div>

          <!-- 柱图展示 -->
          <div
            v-if="flowChartType === 'bar'"
            class="w-full flex flex-col md:flex-row justify-between md:space-x-4 space-y-4 md:space-y-0 rounded-md p-2"
          >
            <div class="w-full border-b md:border-b-0 md:border-r">
              <ChartsCommonBar
                title="支出类型分析"
                width="100%"
                height="300px"
                groupBy="industryType"
                flowType="支出"
                seriesName="支出类型"
                :showLegend="true"
                queryField="industryType"
                :startDay="flowStartDay || undefined"
                :endDay="flowEndDay || undefined"
              />
            </div>
            <div class="w-full">
              <ChartsCommonBar
                title="收入类型分析"
                width="100%"
                height="300px"
                groupBy="industryType"
                flowType="收入"
                seriesName="收入类型"
                :showLegend="true"
                queryField="industryType"
                :startDay="flowStartDay || undefined"
                :endDay="flowEndDay || undefined"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "public",
  middleware: ["auth"],
});

import { ref, onMounted, onUnmounted, onBeforeUnmount, nextTick } from "vue";
import DailyLineChart from "~/components/charts/DailyLineChart.vue";
import MonthBar from "~/components/charts/MonthBar.vue";

const windowWidth = ref(
  typeof window !== "undefined" ? window.innerWidth : 1200
);

// 图表类型切换状态
const flowChartType = ref<"pie" | "bar">("pie");

// 时间筛选状态 - 默认近一个月
const getDefaultDateRange = () => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start: formatDate(oneMonthAgo),
    end: formatDate(today),
  };
};

const defaultDateRange = getDefaultDateRange();
const flowStartDay = ref<string | null>(defaultDateRange.start);
const flowEndDay = ref<string | null>(defaultDateRange.end);

// 窗口大小变化监听
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const loading = ref(true);
onMounted(async () => {
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
  }
  // 等待DOM完全渲染
  await nextTick();
  loading.value = false;
});

onBeforeUnmount(() => {
  // 清理资源
  loading.value = true;
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
});
</script>
