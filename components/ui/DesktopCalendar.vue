<template>
  <div class="w-full">
    <!-- Calendar Header -->
    <div
      class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-950/80 dark:to-emerald-950/80 text-white"
    >
      <!-- Navigation -->
      <div class="flex items-center gap-4">
        <button
          @click="prevMonth"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <ChevronLeftIcon class="w-5 h-5" />
        </button>

        <div class="relative">
          <button
            @click="showMonthPicker = !showMonthPicker"
            class="text-xl font-bold min-w-40 text-center px-3 py-1 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          >
            {{ currentMonthText }}
          </button>
          <!-- Month/Year Picker Popup -->
          <div
            v-if="showMonthPicker"
            class="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-64"
            @click.stop
          >
            <!-- Year Selection -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">年份</label>
              <div class="flex items-center gap-2">
                <button
                  @click="selectYear(currentYear - 1)"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon class="w-4 h-4" />
                </button>
                <select
                  v-model="selectedYear"
                  @change="onYearMonthChange"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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
                  <ChevronRightIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
            <!-- Month Selection -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">月份</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="month in 12"
                  :key="month"
                  @click="selectMonth(month)"
                  :class="[
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
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
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
        >
          <ChevronRightIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Analysis Button -->
      <button
        @click="showAnalysis"
        class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200 font-medium"
      >
        <ChartBarIcon class="w-5 h-5" />
        当月分析
      </button>
    </div>

    <!-- Weekday Headers -->
    <div
      class="grid grid-cols-7 bg-green-50 dark:bg-transparent border-b border-green-200 dark:border-green-900/30"
    >
      <div
        v-for="day in weekdays"
        :key="day"
        class="py-4 text-center text-sm font-semibold text-green-700 dark:text-green-500/50 uppercase tracking-wide"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-px bg-green-100 dark:bg-black">
      <div
        v-for="date in calendarDates"
        :key="date.key"
        class="min-h-36 p-4 flex flex-col relative transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-800/20 hover:-translate-y-0.5 hover:shadow-lg border border-green-50 dark:border-green-900"
        :class="{
          'bg-green-50 dark:bg-transparent text-gray-400 dark:text-green-700':
            !date.isCurrentMonth,
          'bg-green-100 dark:bg-green-950/50':
            date.isCurrentMonth && !date.isWeekend && !date.isToday,
          'bg-green-200 dark:bg-green-800/50 border-2 border-green-400 dark:border-green-700':
            date.isToday,
          'bg-green-50/50 dark:bg-green-950/30':
            date.isWeekend && date.isCurrentMonth,
        }"
      >
        <!-- Date and Add Button -->
        <div class="flex justify-between items-start mb-3">
          <span
            v-if="!date.isToday"
            class="text-lg font-medium"
            :class="{
              'text-gray-900 dark:text-gray-100': date.isCurrentMonth,
              'text-gray-400 dark:text-green-700/30': !date.isCurrentMonth,
            }"
          >
            {{ date.day }}
          </span>
          <span
            v-else
            class="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center text-lg font-bold shadow-md"
          >
            {{ date.day }}
          </span>
          <button
            v-if="date.isCurrentMonth"
            @click="addFlow(date)"
            class="w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Flow Data -->
        <div v-if="date.isCurrentMonth" class="flex flex-col gap-2 flex-1">
          <!-- Expense -->
          <div
            v-if="getDateExpense(date.dateString)"
            @click="clickDay(date.dateString, '支出')"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="getExpenseClass(getDateExpense(date.dateString))"
          >
            <span class="text-lg font-bold">-</span>
            <span>{{ getDateExpense(date.dateString).toFixed(2) }}</span>
          </div>
          <!-- Income -->
          <div
            v-if="getDateIncome(date.dateString)"
            @click="clickDay(date.dateString, '收入')"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-blue-300/70 dark:bg-blue-500/50 text-blue-900 dark:text-blue-100 hover:bg-blue-400/80 dark:hover:bg-blue-500/60"
          >
            <span class="text-lg font-bold">+</span>
            <span>{{ getDateIncome(date.dateString).toFixed(2) }}</span>
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

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

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

const getDateIncome = (dateString: string): number => {
  return props.incomeData[dateString] || 0;
};

const getDateExpense = (dateString: string): number => {
  return props.expenseData[dateString] || 0;
};

const getExpenseClass = (amount: number): string => {
  if (!amount || amount === 0) {
    return "bg-green-100/50 dark:bg-transparent dark:border dark:border-green-800/30 text-gray-600 dark:text-green-500/50 hover:bg-green-100 dark:hover:bg-green-950/15";
  } else if (amount >= 1000) {
    return "bg-red-300/70 dark:bg-red-500/50 text-red-900 dark:text-red-100 hover:bg-red-400/80 dark:hover:bg-red-500/60";
  } else {
    return "bg-orange-300/70 dark:bg-orange-500/50 text-orange-900 dark:text-orange-100 hover:bg-orange-400/80 dark:hover:bg-orange-500/60";
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
  }
);

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
