<template>
  <!-- 流水编辑对话框 -->
  <div
    v-if="showFlowEditDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    style="z-index: 999"
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
          {{ title }}
        </h3>
        <button
          @click="closeDialog"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="p-2 md:p-4 space-y-2 max-h-[80vh] overflow-y-auto">
        <!-- 日期选择 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            日期
          </label>
          <UiDatePicker v-model="flowEdit.day" class="w-full" />
        </div>

        <!-- 流水类型 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            <span class="text-red-500">*</span> 流水类型
          </label>
          <select
            v-model="flowEdit.flowType"
            @change="() => { changeFlowTypes(); validateField('flowType'); }"
            :class="[
              'w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.flowType
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            ]"
          >
            <option value="">请选择流水类型</option>
            <option
              v-for="type in flowTypeDialogOptions"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
          <p v-if="errors.flowType" class="mt-1 text-sm text-red-500">
            {{ errors.flowType }}
          </p>
        </div>

        <!-- 支出类型/收入类型 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            <span class="text-red-500">*</span> {{ industryTypeLabel }}
          </label>
          <div class="relative">
            <input
              v-model="flowEdit.industryType"
              @input="
                (industryTypeSearchText = flowEdit.industryType),
                  (showIndustryTypeDropdown = true),
                  (industryActiveIndex = 0),
                  validateField('industryType')
              "
              @focus="
                (showIndustryTypeDropdown = true), (industryActiveIndex = 0)
              "
              @blur="() => { hideIndustryTypeDropdown(); validateField('industryType'); }"
              @keydown="onIndustryKeydown($event)"
              placeholder="输入或选择类型"
              :class="[
                'w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.industryType
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <!-- 下拉选项 -->
            <div
              v-if="
                showIndustryTypeDropdown &&
                (filteredIndustryTypeOptions.length > 0 || industryTypeSearchText)
              "
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <!-- 如果输入的内容不在列表中，显示"创建新类型"选项 -->
              <div
                v-if="
                  industryTypeSearchText &&
                  !filteredIndustryTypeOptions.some(
                    (item) => item === industryTypeSearchText
                  )
                "
                @mousedown="selectIndustryType(industryTypeSearchText)"
                class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600"
              >
                <span class="text-blue-500">+ 创建新类型: "{{ industryTypeSearchText }}"</span>
              </div>
              <!-- 显示匹配的选项 -->
              <div
                v-for="(item, index) in filteredIndustryTypeOptions"
                :key="item"
                @mousedown="selectIndustryType(item)"
                :class="[
                  'px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white',
                  index === industryActiveIndex
                    ? 'bg-gray-100 dark:bg-gray-600'
                    : '',
                ]"
              >
                {{ item }}
              </div>
            </div>
          </div>
          <p v-if="errors.industryType" class="mt-1 text-sm text-red-500">
            {{ errors.industryType }}
          </p>
        </div>

        <!-- 支付方式/收款方式 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ payTypeLabel }}
          </label>
          <div class="relative">
            <input
              v-model="flowEdit.payType"
              @input="
                (payTypeSearchText = flowEdit.payType),
                  (showPayTypeDropdown = true),
                  (payTypeActiveIndex = 0)
              "
              @focus="(showPayTypeDropdown = true), (payTypeActiveIndex = 0)"
              @blur="hidePayTypeDropdown"
              @keydown="onPayTypeKeydown($event)"
              placeholder="输入或选择支付方式"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <!-- 下拉选项 -->
            <div
              v-if="showPayTypeDropdown && filteredPayTypeOptions.length > 0"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <div
                v-for="(item, index) in filteredPayTypeOptions"
                :key="item"
                @mousedown="selectPayType(item)"
                :class="[
                  'px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-900 dark:text-white',
                  index === payTypeActiveIndex
                    ? 'bg-gray-100 dark:bg-gray-600'
                    : '',
                ]"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <!-- 金额 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            <span class="text-red-500">*</span> 金额
          </label>
          <input
            v-model="flowEdit.money"
            type="text"
            inputmode="decimal"
            placeholder="请输入金额"
            @input="(e) => { validateMoneyInput(e); validateField('money'); }"
            @blur="validateField('money')"
            :class="[
              'w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.money
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            ]"
          />
          <p v-if="errors.money" class="mt-1 text-sm text-red-500">
            {{ errors.money }}
          </p>
        </div>


        <!-- 备注 -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            备注
          </label>
          <textarea
            v-model="flowEdit.description"
            rows="3"
            placeholder="请输入备注"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
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
          @click="confirmForm"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showFlowEditDialog } from "~/utils/flag";
import { onMounted, ref, computed, watch } from "vue";
import { getIndustryType, getPayType } from "~/utils/apis";
import { XMarkIcon } from "@heroicons/vue/24/outline";

// ESC键监听
useEscapeKey(() => {
  if (showFlowEditDialog.value) {
    closeDialog();
  }
}, showFlowEditDialog);

const { title, flow, successCallback } = defineProps([
  "title",
  "flow",
  "successCallback",
]);

// 表单弹窗标题选项
const formTitle = ["新增流水", "修改流水"];
const industryTypeLabel = ref("支出类型/收入类型");
const payTypeLabel = ref("支付方式/收款方式");
const flowTypeDialogOptions = ref(["支出", "收入", "不计收支"]);

// 表单验证错误信息
const errors = ref<{
  flowType?: string;
  industryType?: string;
  money?: string;
}>({});

// 下拉框显示状态
const showIndustryTypeDropdown = ref(false);
const showPayTypeDropdown = ref(false);

// 默认固定支出类型
const defaultExpenseTypes = ["饮食", "交通", "娱乐", "购物", "医疗", "教育", "住房", "其他"];
// 默认固定收入类型
const defaultIncomeTypes = ["工资", "奖金", "投资收益", "兼职", "其他"];

// 支出类型/收入类型（固定种类 + 用户自定义）
const industryTypeOptions = ref<string[]>([]);
// 用户自定义的类型（从数据库获取）
const customIndustryTypes = ref<string[]>([]);
// 支付类型
const payTypeOptions = ref<any[]>([]);
const flowEdit = ref<Flow | any>({
  flowType: "",
});


onMounted(() => {
  // console.log("flow", flow);
  if (flow) {
    flowEdit.value = { ...flow };
    if (flowEdit.value.day) {
      flowEdit.value.day = flowEdit.value.day;
    }
  }
  if (formTitle[0] === title) {
    const day =
      (flow && (flow as any).day) || new Date().toISOString().split("T")[0];
    flowEdit.value = { flowType: "", day } as any;
  } else if (flow) {
    flowEdit.value = { ...flow } as any;
  }
  // 强制清除 id，确保新增不会走更新逻辑
  if (formTitle[0] === title && (flowEdit.value as any).id) {
    delete (flowEdit.value as any).id;
  }
  // 根据当前 flowType 联动标签与选项
  changeFlowTypes();
});

// 每次打开弹窗时，根据标题判定并重置表单，避免误把新增识别为修改

// 修改FlowType后联动
const changeFlowTypes = () => {
  if (flowEdit.value.flowType === "支出") {
    industryTypeLabel.value = "支出类型";
    payTypeLabel.value = "支付方式";
    // 合并固定支出类型和用户自定义类型
    getIndustryType(flowEdit.value.flowType || "").then((data) => {
      customIndustryTypes.value = data
        .map((d) => d.industryType)
        .filter((type) => type && !defaultExpenseTypes.includes(type));
      // 合并固定类型和自定义类型，去重并排序
      const allTypes = [
        ...defaultExpenseTypes,
        ...customIndustryTypes.value,
      ];
      industryTypeOptions.value = Array.from(new Set(allTypes)).filter(
        (type) => type
      );
    });
  } else if (flowEdit.value.flowType === "收入") {
    industryTypeLabel.value = "收入类型";
    payTypeLabel.value = "收款方式";
    // 合并固定收入类型和用户自定义类型
    getIndustryType(flowEdit.value.flowType || "").then((data) => {
      customIndustryTypes.value = data
        .map((d) => d.industryType)
        .filter((type) => type && !defaultIncomeTypes.includes(type));
      // 合并固定类型和自定义类型，去重并排序
      const allTypes = [
        ...defaultIncomeTypes,
        ...customIndustryTypes.value,
      ];
      industryTypeOptions.value = Array.from(new Set(allTypes)).filter(
        (type) => type
      );
    });
  } else {
    industryTypeLabel.value = "支出类型/收入类型";
    payTypeLabel.value = "支付方式/收款方式";
    // 未选择流水类型时，显示所有类型
    getIndustryType(flowEdit.value.flowType || "").then((data) => {
      const allCustomTypes = data.map((d) => d.industryType).filter((type) => type);
      const allTypes = [
        ...defaultExpenseTypes,
        ...defaultIncomeTypes,
        ...allCustomTypes,
      ];
      industryTypeOptions.value = Array.from(new Set(allTypes)).filter(
        (type) => type
      );
    });
  }

  getPayType(flowEdit.value.flowType || "").then((data) => {
    payTypeOptions.value = data.map((d) => {
      return d.payType;
    });
  });
};
changeFlowTypes();

// 添加筛选相关的响应式变量
const industryTypeSearchText = ref("");
const payTypeSearchText = ref("");

// 计算属性：筛选后的选项
const filteredIndustryTypeOptions = computed(() => {
  if (!industryTypeSearchText.value) {
    return industryTypeOptions.value;
  }
  const searchLower = industryTypeSearchText.value.toLowerCase();
  return industryTypeOptions.value.filter((item) =>
    item && item.toLowerCase().includes(searchLower)
  );
});

const filteredPayTypeOptions = computed(() => {
  if (!payTypeSearchText.value) {
    return payTypeOptions.value;
  }
  return payTypeOptions.value.filter((item) =>
    item.toLowerCase().includes(payTypeSearchText.value.toLowerCase())
  );
});


// 键盘导航：活动索引（响应式）
const industryActiveIndex = ref(0);
const payTypeActiveIndex = ref(0);

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return -1;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
};

const onIndustryKeydown = (e: KeyboardEvent) => {
  const list = filteredIndustryTypeOptions.value;
  if (
    !showIndustryTypeDropdown.value &&
    (e.key === "ArrowDown" || e.key === "ArrowUp")
  ) {
    showIndustryTypeDropdown.value = true;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    industryActiveIndex.value = clampIndex(
      industryActiveIndex.value + 1,
      list.length
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    industryActiveIndex.value = clampIndex(
      industryActiveIndex.value - 1,
      list.length
    );
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (
      industryActiveIndex.value >= 0 &&
      industryActiveIndex.value < list.length
    ) {
      selectIndustryType(list[industryActiveIndex.value]);
    }
  } else if (e.key === "Escape") {
    showIndustryTypeDropdown.value = false;
  }
};

const onPayTypeKeydown = (e: KeyboardEvent) => {
  const list = filteredPayTypeOptions.value;
  if (
    !showPayTypeDropdown.value &&
    (e.key === "ArrowDown" || e.key === "ArrowUp")
  ) {
    showPayTypeDropdown.value = true;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    payTypeActiveIndex.value = clampIndex(
      payTypeActiveIndex.value + 1,
      list.length
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    payTypeActiveIndex.value = clampIndex(
      payTypeActiveIndex.value - 1,
      list.length
    );
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (
      payTypeActiveIndex.value >= 0 &&
      payTypeActiveIndex.value < list.length
    ) {
      selectPayType(list[payTypeActiveIndex.value]);
    }
  } else if (e.key === "Escape") {
    showPayTypeDropdown.value = false;
  }
};


// 下拉框处理方法
const hideIndustryTypeDropdown = () => {
  setTimeout(() => {
    showIndustryTypeDropdown.value = false;
  }, 200);
};

const hidePayTypeDropdown = () => {
  setTimeout(() => {
    showPayTypeDropdown.value = false;
  }, 200);
};


const selectIndustryType = (item: string) => {
  flowEdit.value.industryType = item;
  showIndustryTypeDropdown.value = false;
  // 如果选择的是新类型，将其添加到选项列表中（仅当前会话）
  if (item && !industryTypeOptions.value.includes(item)) {
    industryTypeOptions.value.push(item);
  }
};

const selectPayType = (item: string) => {
  flowEdit.value.payType = item;
  showPayTypeDropdown.value = false;
};

// 验证金额输入，只允许数字和小数点
const validateMoneyInput = (event: Event) => {
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
  flowEdit.value.money = value;
};

// 验证单个字段
const validateField = (fieldName: 'flowType' | 'industryType' | 'money') => {
  if (fieldName === 'flowType') {
    if (!flowEdit.value.flowType) {
      errors.value.flowType = '请选择流水类型';
    } else {
      delete errors.value.flowType;
    }
  } else if (fieldName === 'industryType') {
    if (!flowEdit.value.industryType) {
      errors.value.industryType = '请填写' + industryTypeLabel.value;
    } else {
      delete errors.value.industryType;
    }
  } else if (fieldName === 'money') {
    if (!flowEdit.value.money || Number(flowEdit.value.money) <= 0) {
      errors.value.money = '请输入有效的金额';
    } else {
      delete errors.value.money;
    }
  }
};

// 验证所有必填字段
const validateAllFields = (): boolean => {
  errors.value = {};
  validateField('flowType');
  validateField('industryType');
  validateField('money');
  return Object.keys(errors.value).length === 0;
};

// 提交表单（新增或修改）
const confirmForm = async () => {
  if (!validateAllFields()) {
    return;
  }
  if (flowEdit.value.id) {
    // 修改
    updateOne();
  } else {
    // 新增
    createOne();
  }
};

// 创建
const createOne = () => {
  doApi
    .post<Flow>("api/entry/flow/add", {
      bookId: localStorage.getItem("bookId") || "",
      day: flowEdit.value.day || new Date().toISOString().split("T")[0],
      flowType: flowEdit.value.flowType,
      industryType: flowEdit.value.industryType,
      payType: flowEdit.value.payType,
      money: Number(flowEdit.value.money),
      description: flowEdit.value.description,
    })
    .then((res) => {
      if (res.id) {
        successCallback(res);
        Alert.success("新增成功!");
        showFlowEditDialog.value = false;
      }
    })
    .catch(() => {
      Alert.error("新增出现异常");
    });
};

// 更新
const updateOne = () => {
  if (!flowEdit.value.id) {
    Alert.error("请选择要修改的数据");
    return;
  }
  doApi
    .post<Flow>("api/entry/flow/update", {
      id: flowEdit.value.id,
      day: flowEdit.value.day || new Date().toISOString().split("T")[0],
      bookId: localStorage.getItem("bookId") || "",
      flowType: flowEdit.value.flowType,
      industryType: flowEdit.value.industryType,
      money: Number(flowEdit.value.money),
      payType: flowEdit.value.payType,
      description: flowEdit.value.description,
    })
    .then((res) => {
      if (res.id) {
        successCallback(res);
        Alert.success("更新成功!");
        showFlowEditDialog.value = false;
      }
    })
    .catch((err) => {
      console.log(err);
      Alert.error("更新出现异常" + err.message);
    });
};

const closeDialog = () => {
  showFlowEditDialog.value = false;
};
</script>
