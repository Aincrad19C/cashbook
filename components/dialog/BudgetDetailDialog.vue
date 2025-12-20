<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closeDialog"
    >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto"
      @click.stop
    >
      <!-- 标题栏 -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          预算详情 - {{ currentMonth }}
        </h3>
        <button
          @click="closeDialog"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="p-6 space-y-4">
        <!-- 预算金额 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            <span class="text-red-500">*</span> 本月预算（元）
          </label>
          <input
            v-model="budgetAmount"
            type="text"
            inputmode="decimal"
            placeholder="请输入预算金额"
            @input="validateBudgetInput"
            :class="[
              'w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.budget
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            ]"
          />
          <p v-if="errors.budget" class="mt-1 text-sm text-red-500">
            {{ errors.budget }}
          </p>
        </div>

        <!-- 已使用金额 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            已使用金额（元）
          </label>
          <div class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
            {{ usedAmount.toFixed(2) }}
          </div>
        </div>

        <!-- 剩余金额 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            剩余金额（元）
          </label>
          <div
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            :class="{
              'text-red-600 dark:text-red-400 font-bold': remainingAmount < 0,
              'text-green-600 dark:text-green-400 font-bold': remainingAmount >= 0
            }"
          >
            {{ remainingAmount.toFixed(2) }}
          </div>
        </div>

        <!-- 使用百分比 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            使用进度
          </label>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              class="h-4 rounded-full transition-all duration-300"
              :class="progressBarClass"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
            {{ progressPercent.toFixed(1) }}%
          </p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div
        class="flex justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <button
          @click="closeDialog"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
        <button
          @click="saveBudget"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import type { Budget } from "~/utils/table";
import { Alert } from "~/utils/alert";

interface Props {
  currentMonth: string;
  budgetData?: Budget | null;
  currentMonthExpense?: number; // 当前月份的实时支出总额
}

const props = withDefaults(defineProps<Props>(), {
  currentMonth: "",
  budgetData: null,
  currentMonthExpense: 0,
});

const emit = defineEmits<{
  close: [];
  update: [];
}>();

const show = ref(false);
const budgetAmount = ref<string>("");
const errors = ref<{ budget?: string }>({});

// 使用传入的实时支出数据，如果没有则使用 budgetData 中的 used
const usedAmount = computed(() => {
  return props.currentMonthExpense || props.budgetData?.used || 0;
});

// 计算剩余金额
const remainingAmount = computed(() => {
  const budget = Number(budgetAmount.value) || 0;
  return budget - usedAmount.value;
});

// 计算使用百分比
const progressPercent = computed(() => {
  const budget = Number(budgetAmount.value) || 0;
  if (budget <= 0) return 0;
  return Math.min((usedAmount.value / budget) * 100, 100);
});

// 进度条颜色
const progressBarClass = computed(() => {
  const percent = progressPercent.value;
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-orange-500";
  return "bg-green-500";
});

// 验证预算输入
const validateBudgetInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  let value = target.value;
  // 只保留数字和小数点
  value = value.replace(/[^\d.]/g, '');
  // 确保只有一个小数点
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  // 限制小数点后两位
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }
  budgetAmount.value = value;
  // 更新输入框的值（如果被过滤了）
  if (target.value !== value) {
    target.value = value;
  }
  // 清除错误
  if (errors.value.budget) {
    delete errors.value.budget;
  }
};

// 监听 props 变化，更新数据
watch(
  () => props.budgetData,
  (newData) => {
    if (newData) {
      budgetAmount.value = String(newData.budget || 0);
    } else {
      budgetAmount.value = "0";
    }
  },
  { immediate: true }
);

// 监听 show 变化，初始化数据
watch(show, (newShow) => {
  if (newShow) {
    if (props.budgetData) {
      budgetAmount.value = String(props.budgetData.budget || 0);
    } else {
      budgetAmount.value = "0";
    }
  }
});

// 暴露方法给父组件
defineExpose({
  open: () => {
    show.value = true;
  },
  close: () => {
    show.value = false;
  }
});

// 保存预算
const saveBudget = async () => {
  // 验证
  if (!budgetAmount.value || Number(budgetAmount.value) < 0) {
    errors.value.budget = "请输入有效的预算金额";
    return;
  }

  const bookId = localStorage.getItem("bookId");
  if (!bookId) {
    Alert.error("请先选择账本");
    return;
  }

  // 格式化月份：YYYY-MM
  const monthStr = props.currentMonth
    .replace("年", "-")
    .replace("月", "")
    .replaceAll(" ", "");
  const monthParts = monthStr.split("-");
  const formattedMonth = `${monthParts[0]}-${monthParts[1].padStart(2, "0")}`;

  try {
    if (props.budgetData && props.budgetData.id) {
      // 更新预算
      await doApi.post("api/entry/budget/update", {
        bookId,
        id: props.budgetData.id,
        month: formattedMonth,
        budget: Number(budgetAmount.value),
      });
    } else {
      // 创建预算
      await doApi.post("api/entry/budget/add", {
        bookId,
        month: formattedMonth,
        budget: Number(budgetAmount.value),
      });
    }
    Alert.success("预算保存成功");
    emit("update");
    closeDialog();
  } catch (error) {
    console.error("保存预算失败:", error);
    Alert.error("保存预算失败");
  }
};

const closeDialog = () => {
  emit("close");
};
</script>

