<template>
  <div class="w-full overflow-hidden">
    <!-- Calendar Header -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-950/80 dark:to-emerald-950/80 text-white"
    >
      <button
        @click="prevMonth"
        class="p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>

      <div class="relative flex-1">
        <button
          @click="showMonthPicker = !showMonthPicker"
          class="text-sm font-semibold w-full text-center px-2 py-1 rounded-md hover:bg-white/10 transition-colors duration-200"
        >
          {{ currentMonthText }}
        </button>
        <!-- Month/Year Picker Popup -->
        <div
          v-if="showMonthPicker"
          class="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-56"
          @click.stop
        >
          <!-- Year Selection -->
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">年份</label>
            <div class="flex items-center gap-1">
              <button
                @click="selectYear(currentYear - 1)"
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeftIcon class="w-3 h-3" />
              </button>
              <select
                v-model="selectedYear"
                @change="onYearMonthChange"
                class="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option
                  v-for="year in yearOptions"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </option>
              </select>
              <button
                @click="selectYear(currentYear + 1)"
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRightIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
          <!-- Month Selection -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">月份</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="month in 12"
                :key="month"
                @click="selectMonth(month)"
                :class="[
                  'px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                  selectedMonth === month
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                {{ month }}月
              </button>
            </div>
          </div>
        </div>
        <!-- Backdrop -->
        <div
          v-if="showMonthPicker"
          class="fixed inset-0 z-40"
          @click="showMonthPicker = false"
        ></div>
      </div>

      <button
        @click="nextMonth"
        class="p-1.5 rounded-md hover:bg-white/10 transition-colors duration-200"
      >
        <ChevronRightIcon class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-2">
        <!-- Budget Remaining -->
        <div class="relative">
          <button
            @click="openBudgetDialog"
            class="flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            <span class="text-xs font-medium">预算{{ budgetRemainingPercent }}%</span>
            <ChevronRightIcon class="w-3 h-3" />
          </button>
          <!-- Budget Detail Dialog -->
          <BudgetDetailDialog
            ref="budgetDialogRef"
            :current-month="currentMonthString"
            :budget-data="budgetData"
            :current-month-expense="currentMonthExpense"
            @close="closeBudgetDialog"
            @update="loadBudgetData"
          />
        </div>
        <!-- Analysis Button -->
        <button
          @click="showAnalysis"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <ChartBarIcon class="w-4 h-4" />
          <span class="text-xs font-medium">分析</span>
        </button>
      </div>
    </div>

    <!-- Weekday Headers -->
    <div
      class="grid grid-cols-7 bg-green-50 dark:bg-transparent border-b border-green-200 dark:border-green-900/30"
    >
      <div
        v-for="day in weekdays"
        :key="day"
        class="py-3 text-center text-xs font-semibold text-green-700 dark:text-green-500/50 uppercase tracking-wide"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-black">
      <div
        v-for="date in calendarDates"
        :key="date.key"
        class="min-h-20 p-1 flex flex-col relative transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/20 border border-green-200 dark:border-green-700"
        :class="{
          'bg-gray-50 dark:bg-transparent text-gray-400 dark:text-gray-600':
            !date.isCurrentMonth,
          'bg-white dark:bg-gray-900/50':
            date.isCurrentMonth && !date.isToday,
          'bg-gray-100 dark:bg-gray-800/50 border-2 border-green-400 dark:border-green-600':
            date.isToday,
        }"
      >
        <!-- Date and Add Button -->
        <div class="flex justify-between items-start mb-1">
          <span
            v-if="!date.isToday"
            class="text-xs font-medium"
            :class="{
              'text-gray-900 dark:text-gray-100': date.isCurrentMonth,
              'text-gray-400 dark:text-green-700/30': !date.isCurrentMonth,
            }"
          >
            {{ date.day }}
          </span>
          <span
            v-else
            class="w-5 h-5 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center text-xs font-bold shadow-md"
          >
            {{ date.day }}
          </span>
          <button
            v-if="date.isCurrentMonth"
            @click="addFlow(date)"
            class="w-4 h-4 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <PlusIcon class="w-3 h-3" />
          </button>
        </div>

        <!-- Flow Data -->
        <div v-if="date.isCurrentMonth" class="flex flex-col gap-0.5 flex-1">
          <!-- Expense -->
          <div
            v-if="getDateExpense(date.dateString)"
            @click="clickDay(date.dateString, '支出')"
            class="flex items-center gap-1 px-1 py-0.5 rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            :class="getExpenseClass(getDateExpense(date.dateString))"
          >
            <span class="text-sm font-bold">-</span>
            <span>{{ getDateExpense(date.dateString).toFixed(0) }}</span>
          </div>
          <!-- Income -->
          <div
            v-if="getDateIncome(date.dateString)"
            @click="clickDay(date.dateString, '收入')"
            class="flex items-center gap-1 px-1 py-0.5 rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50"
          >
            <span class="text-sm font-bold">+</span>
            <span>{{ getDateIncome(date.dateString).toFixed(0) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/outline";

interface CalendarDate {
  date: Date;
  dateString: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  key: string;
}

interface Props {
  currentDate: Date;
  incomeData: Record<string, number>;
  expenseData: Record<string, number>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "add-flow": [date: CalendarDate];
  "click-day": [dateString: string, flowType: string];
  "month-change": [date: Date];
  "show-analysis": [month: string];
}>();

const currentDate = ref(new Date(props.currentDate));
const showMonthPicker = ref(false);
const budgetDialogRef = ref<{ open: () => void; close: () => void } | null>(null);
const budgetData = ref<Budget | null>(null);

// 打开预算对话框
const openBudgetDialog = () => {
  if (budgetDialogRef.value) {
    budgetDialogRef.value.open();
  }
};

// 关闭预算对话框
const closeBudgetDialog = () => {
  if (budgetDialogRef.value) {
    budgetDialogRef.value.close();
  }
};

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

// 当前月份字符串（用于显示和API调用）
const currentMonthString = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;
  return `${year} 年 ${month} 月`;
});

// 计算预算剩余百分比（使用实时支出数据）
const budgetRemainingPercent = computed(() => {
  if (!budgetData.value || !budgetData.value.budget || budgetData.value.budget <= 0) {
    return 100;
  }
  const used = currentMonthExpense.value; // 使用实时计算的支出
  const remaining = budgetData.value.budget - used;
  const percent = (remaining / budgetData.value.budget) * 100;
  return Math.max(0, Math.round(percent));
});

// 加载预算数据
const loadBudgetData = async () => {
  const bookId = localStorage.getItem("bookId");
  if (!bookId) return;

  // 格式化月份：YYYY-MM
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;

  try {
    const budgets = await doApi.post<Budget[]>("api/entry/budget/list", {
      bookId,
      month: monthStr,
    });
    
    if (budgets && budgets.length > 0) {
      budgetData.value = budgets[0];
      // 如果 used 为空，需要计算当前月份的支出
      if (budgetData.value.used === null || budgetData.value.used === undefined) {
        await calculateUsedAmount(monthStr);
      }
    } else {
      budgetData.value = null;
    }
  } catch (error) {
    console.error("加载预算数据失败:", error);
    budgetData.value = null;
  }
};

// 计算已使用金额（当前月份的支出总额）
const calculateUsedAmount = async (monthStr: string) => {
  const bookId = localStorage.getItem("bookId");
  if (!bookId) return;

  try {
    // 使用 reloadUsedAmount API 更新预算的 used 字段
    await doApi.post("api/entry/budget/reloadUsedAmount", {
      bookId,
      month: monthStr,
    });
    // 重新加载预算数据
    await loadBudgetData();
  } catch (error) {
    console.error("计算已使用金额失败:", error);
  }
};

// 月份/年份选择器相关
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);
const selectedYear = ref(currentYear.value);
const selectedMonth = ref(currentMonth.value);

// 生成年份选项（当前年份前后各10年）
const yearOptions = computed(() => {
  const years = [];
  const startYear = currentYear.value - 10;
  const endYear = currentYear.value + 10;
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
});

// 监听当前日期变化，更新选择器
watch(
  () => [currentYear.value, currentMonth.value],
  () => {
    selectedYear.value = currentYear.value;
    selectedMonth.value = currentMonth.value;
  },
  { immediate: true }
);

const selectYear = (year: number) => {
  selectedYear.value = year;
  onYearMonthChange();
};

const selectMonth = (month: number) => {
  selectedMonth.value = month;
  currentDate.value = new Date(selectedYear.value, month - 1, 1);
  emit("month-change", currentDate.value);
  showMonthPicker.value = false;
};

const onYearMonthChange = () => {
  currentDate.value = new Date(selectedYear.value, selectedMonth.value - 1, 1);
  emit("month-change", currentDate.value);
  showMonthPicker.value = false;
};

const currentMonthText = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;
  return `${year} 年 ${month} 月`;
});

const calendarDates = computed((): CalendarDate[] => {
  const dates: CalendarDate[] = [];
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  // Get first day of month and calculate start of calendar
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - firstDay.getDay());

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDay);
    date.setDate(startDay.getDate() + i);

    const isCurrentMonth = date.getMonth() === month;
    const isToday = isSameDay(date, new Date());
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    dates.push({
      date: new Date(date),
      dateString: formatDate(date),
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isWeekend,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    });
  }

  return dates;
});

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// 计算当前月份的总支出（实时从 props.expenseData 计算）
const currentMonthExpense = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${year}-${month}`;
  
  let total = 0;
  for (const [date, amount] of Object.entries(props.expenseData)) {
    if (date.startsWith(monthPrefix)) {
      total += amount;
    }
  }
  return total;
});

const getDateIncome = (dateString: string): number => {
  return props.incomeData[dateString] || 0;
};

const getDateExpense = (dateString: string): number => {
  return props.expenseData[dateString] || 0;
};

const getExpenseClass = (amount: number): string => {
  if (!amount || amount === 0) {
    return "bg-gray-100/50 dark:bg-transparent dark:border dark:border-gray-800/30 text-gray-600 dark:text-gray-500/50 hover:bg-gray-100 dark:hover:bg-gray-950/15";
  } else {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50";
  }
};

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
  emit("month-change", currentDate.value);
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
  emit("month-change", currentDate.value);
};

const addFlow = (date: CalendarDate) => {
  emit("add-flow", date);
};

const clickDay = (dateString: string, flowType: string) => {
  emit("click-day", dateString, flowType);
};

const showAnalysis = () => {
  emit("show-analysis", currentMonthText.value);
};

// Watch for prop changes
watch(
  () => props.currentDate,
  (newDate) => {
    currentDate.value = new Date(newDate);
    loadBudgetData();
  }
);

// 监听月份变化，重新加载预算
watch(
  () => [currentYear.value, currentMonth.value],
  () => {
    loadBudgetData();
  }
);

// 组件挂载时加载预算数据
onMounted(() => {
  loadBudgetData();
});

// 点击外部关闭月份选择器
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showMonthPicker.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
