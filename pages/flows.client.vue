<template>
  <div class="p-2 md:p-4 bg-gray-50 dark:bg-green-950/20 min-h-full space-y-2">
    <!-- 统计信息 -->
    <FlowsStatistics :statistics="flowPageRef" />

    <!-- 操作栏 -->
    <FlowsToolbar
      :selected-count="selectedFlows.length"
      :is-selection-mode="isSelectionMode"
      :has-filters="hasFilters"
      :is-importing="isClassifying"
      :selected-items-info="selectedItemsInfo"
      @open-import-export="importDrawer = true"
      @create-new="openCreateDialog"
      @enter-selection-mode="enterSelectionMode"
      @exit-selection-mode="exitSelectionMode"
      @delete-selected="deleteItems"
      @batch-change-type="toChangeTypeBatch"
      @merge-selected="mergeSelected"
      @unmerge-selected="unmergeSelected"
      @open-search="searchDrawer = true"
      @reset-query="resetQuery"
    />


    <!-- 流水表格 -->
    <FlowsTable
      :flows="flowPageRef.data || []"
      :selected-items="selectedFlows"
      :is-all-selected="isAllSelected"
      :is-selection-mode="isSelectionMode"
      :current-page="flowQuery.pageNum || 1"
      :page-size="flowQuery.pageSize || 20"
      :total="flowPageRef.total || 0"
      :total-pages="totalPages"
      :page-numbers="pageNumbers"
      :loading="loading"
      :money-sort="flowQuery.moneySort"
      :day-sort="flowQuery.daySort"
      @toggle-select-all="toggleSelectAll"
      @toggle-select-item="toggleSelectItem"
      @edit-item="editItem"
      @delete-item="deleteItem"
      @change-page="changePage"
      @change-page-size="changePageSize"
      @toggle-sort="toggleSort"
      @unmerge-group="unmergeGroup"
    />

    <!-- 筛选抽屉 -->
    <FlowsSearchDrawer
      :show="searchDrawer"
      :query="flowQuery"
      :name-list="nameList"
      :attribution-list="attributionList"
      @close="searchDrawer = false"
      @apply="handleSearchApply"
    />

    <!-- 导入导出抽屉 -->
    <FlowsImportDrawer
      :show="importDrawer"
      :is-importing="isClassifying"
      @close="importDrawer = false"
      @import-alipay="openCsvImport('alipay')"
      @import-wechat="openCsvImport('wxpay')"
      @import-jd="openCsvImport('jdFinance')"
      @custom-import="showFlowCustomImport"
      @import-json="openJsonImport"
      @export-json="exportJson"
      @export-csv="exportCsv"
      @download-template="downloadCsvTemplate"
      @import-template="importCsvTemplate"
    />

    <!-- AI识别确认对话框 -->
    <div
      v-if="showClassifyConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeClassifyConfirmDialog"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col"
        @click.stop
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center"
        >
          <h3 class="text-lg font-semibold text-green-950 dark:text-white">
            AI智能识别
          </h3>
          <button
            @click="closeClassifyConfirmDialog"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 py-4 space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            检测到您导入的是{{ getFileTypeName() }}账单，是否使用AI自动识别交易类型？
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-xs text-blue-700 dark:text-blue-300">
              💡 使用AI识别可以自动将"商户消费"等类型识别为"饮食"、"交通"等更准确的分类，您可以在预览中修改识别结果。
            </p>
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 flex gap-3"
        >
          <button
            @click="confirmWithoutClassify"
            class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition-colors"
          >
            不使用识别
          </button>
          <button
            @click="confirmWithClassify"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            使用AI识别
          </button>
        </div>
      </div>
    </div>

    <!-- 右下角识别进度通知窗口 -->
    <div
      v-if="showClassifyProgressDialog"
      class="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
    >
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-green-950 dark:text-white">
            AI智能识别中
          </h3>
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">识别进度</span>
            <span class="font-bold text-blue-600 dark:text-blue-400">{{ classifyProgress }}%</span>
          </div>
          
          <!-- 进度条 -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: classifyProgress + '%' }"
            ></div>
          </div>
          
          <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
            已识别 {{ classifyCompleted }} / {{ classifyTotal }} 条流水
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="cancelClassify"
            class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-medium transition-colors"
          >
            取消识别
          </button>
        </div>
      </div>
    </div>

    <!-- CSV流水导入对话框 -->
    <div
      v-if="showFlowExcelImportDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4"
      @click="closeCsvTableDialog"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        @click.stop
      >
        <div
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center"
        >
          <h3 class="text-lg font-semibold text-green-950 dark:text-white">
            CSV流水导入
          </h3>
          <button
            @click="closeCsvTableDialog"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-hidden p-4">
          <CsvFlowTable
            :key="csvFlows.length + classifyCompleted"
            :items="csvFlows"
            :table-head="csvHeaders"
            :table-body="csvDatas"
            :success-callback="importSuccess"
          />
        </div>
      </div>
    </div>

    <!-- 自定义导入对话框 -->
    <div
      v-if="showFlowCustomImportDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closeCustomImport"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col"
        @click.stop
      >
        <FlowCustomImportDialog
          @success-callback="doQuery"
          @close="closeCustomImport"
        />
      </div>
    </div>

    <!-- JSON导入对话框 -->
    <FlowJsonImportDialog
      v-if="showFlowJsonImportDialog"
      :success-callback="doQuery"
    />

    <!-- 批量修改类型对话框 -->
    <div
      v-if="showBatchChangeDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closeBatchChangeDialog"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col"
        @click.stop
      >
        <div
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center"
        >
          <h3 class="text-lg font-semibold text-green-950 dark:text-white">
            批量修改类型
          </h3>
          <button
            @click="closeBatchChangeDialog"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              流水类型
            </label>
            <select
              v-model="batchChange.flowType"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-green-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">不修改</option>
              <option value="支出">支出</option>
              <option value="收入">收入</option>
              <option value="不计收支">不计收支</option>
            </select>
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              支出/收入类型
            </label>
            <input
              v-model="batchChange.industryType"
              type="text"
              placeholder="不修改"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-green-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              支付/收款方式
            </label>
            <input
              v-model="batchChange.payType"
              type="text"
              placeholder="不修改"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-green-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              流水归属
            </label>
            <input
              v-model="batchChange.attribution"
              type="text"
              placeholder="不修改"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-green-950 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div
          class="px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30"
        >
          <div class="flex gap-2">
            <button
              @click="closeBatchChangeDialog"
              class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmBatchChange"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            >
              确认修改
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="csvFileInput"
      type="file"
      accept=".csv,.xlsx"
      style="display: none"
      @change="readCsvInfo"
    />


    <!-- 编辑对话框 -->
    <FlowEditDialog
      v-if="showFlowEditDialog"
      :title="dialogFormTitle"
      :flow="selectedFlow"
      :success-callback="doQuery"
    />

  </div>
</template>

<script setup lang="ts">
import { exportJson as exportJsonFile, exportCsv as exportCsvFile } from "~/utils/fileUtils";
import type { Page } from "~/utils/model";
import { Alert } from "~/utils/alert";
import { Confirm } from "~/utils/confirm";
import FlowsToolbar from "@/components/flows/FlowsToolbar.vue";
import FlowsStatistics from "@/components/flows/FlowsStatistics.vue";
import FlowsTable from "@/components/flows/FlowsTable.vue";
import FlowsSearchDrawer from "@/components/flows/FlowsSearchDrawer.vue";
import FlowsImportDrawer from "@/components/flows/FlowsImportDrawer.vue";
import FlowEditDialog from "~/components/dialog/FlowEditDialog.vue";
import {
  showFlowEditDialog,
  showFlowExcelImportDialog,
  showFlowJsonImportDialog,
} from "~/utils/flag";
import CsvFlowTable from "@/components/datas/CsvFlowTable.vue";
import FlowCustomImportDialog from "@/components/dialog/FlowCustomImport.vue";
import FlowJsonImportDialog from "@/components/dialog/FlowJsonImportDialog.vue";
import * as XLSX from "xlsx";
import {
  alipayConvert,
  jdFinanceConvert,
  wxpayConvert,
  templateConvert,
} from "@/utils/flowConvert";
import { classifyTransaction } from "~/utils/typeClassifier";
import type { ClassificationResult } from "~/utils/typeClassifier";

definePageMeta({
  layout: "public",
  middleware: ["auth"],
});

// 数据定义
const flowPageRef = ref<any>({
  data: [],
  total: 0,
  totalIn: 0,
  totalOut: 0,
  notInOut: 0,
});
const selectedFlows = ref<any[]>([]);
const isSelectionMode = ref(false);
const searchDrawer = ref(false);
const importDrawer = ref(false);
const showFlowCustomImportDialog = ref(false);
const showBatchChangeDialog = ref(false);
const loading = ref(false);

// 编辑相关
const selectedFlow = ref<Flow | any>({});
const dialogFormTitle = ref("新增流水");
const formTitle = ["新增流水", "修改流水"];

// CSV导入相关
const csvFileInput = ref();
const csvFile = ref();
const csvFlows = ref<Flow[] | any>([]);
const csvHeaders = ref<Record<string, number>>({});
const csvDatas = ref<Record<number, any>[]>([]);
const fileType = ref("none");
const titleRowIndex = ref(0);
const isClassifying = ref(false);
const isClassifyCancelled = ref(false);
const useAutoClassify = ref(true); // 是否使用自动识别
const classifyProgress = ref(0); // 识别进度 0-100
const classifyTotal = ref(0); // 需要识别的总数
const classifyCompleted = ref(0); // 已完成的数量
const showClassifyConfirmDialog = ref(false); // 显示确认窗口
const showClassifyProgressDialog = ref(false); // 显示识别进度窗口

const flowQuery = ref<any>({
  pageNum: 1,
  pageSize: 20,
  startDay: "",
  endDay: "",
  attribution: "",
  name: "",
  description: "",
  flowType: "",
  industryType: "",
  payType: "",
  minMoney: undefined,
  maxMoney: undefined,
  moneySort: "",
  daySort: "",
});

const batchChange = ref<any>({
  flowType: "",
  industryType: "",
  payType: "",
  attribution: "",
});

// 获取数据列表
const nameList = ref<string[]>([]);
const getNames = async () => {
  try {
    const res = await doApi.post<string[]>("api/entry/flow/getNames", {
      bookId: localStorage.getItem("bookId"),
    });
    nameList.value = res;
  } catch (error) {
    console.error("获取名称列表失败:", error);
  }
};

const attributionList = ref<string[]>([]);
const getAttributions = async () => {
  try {
    const res = await doApi.post<string[]>("api/entry/flow/getAttributions", {
      bookId: localStorage.getItem("bookId"),
    });
    attributionList.value = res;
  } catch (error) {
    console.error("获取归属列表失败:", error);
  }
};

// 执行分页数据查询
const doQuery = () => {
  // 清空选中状态
  selectedFlows.value = [];
  loading.value = true;
  searchDrawer.value = false;
  doApi
    .post<Page<Flow>>("api/entry/flow/page", {
      ...flowQuery.value,
      bookId: localStorage.getItem("bookId"),
    })
    .then((res) => {
      if (res) {
        flowPageRef.value = res;
      }
    })
    .catch((error) => {
      console.error("查询流水失败:", error);
      Alert.error("查询流水失败");
    })
    .finally(() => {
      loading.value = false;
    });
};

// 计算属性
const isAllSelected = computed(() => {
  // 需要计算显示记录数（合并组只算1条）
  const flows = flowPageRef.value?.data || [];
  
  // 按groupId分组，计算显示记录数
  const groupMap = new Map<string, any[]>();
  flows.forEach((flow: any) => {
    if (flow.groupId) {
      if (!groupMap.has(flow.groupId)) {
        groupMap.set(flow.groupId, []);
      }
      groupMap.get(flow.groupId)!.push(flow);
    }
  });
  
  // 计算显示记录数：每个合并组算1条 + 独立记录数
  const displayCount = groupMap.size + flows.filter((f: any) => !f.groupId).length;
  
  if (displayCount === 0) return false;
  
  // 检查选中的记录数是否等于显示记录数
  // 选中的记录中，主记录使用 main-${groupId}，独立记录使用实际id
  const selectedMainCount = selectedFlows.value.filter((id: any) => String(id).startsWith('main-')).length;
  const selectedNormalCount = selectedFlows.value.filter((id: any) => !String(id).startsWith('main-')).length;
  const expectedMainCount = groupMap.size;
  const expectedNormalCount = flows.filter((f: any) => !f.groupId).length;
  
  return selectedMainCount === expectedMainCount && selectedNormalCount === expectedNormalCount;
});

// 计算选中项的信息（用于判断合并/取消合并按钮状态）
const selectedItemsInfo = computed(() => {
  if (!isSelectionMode.value || selectedFlows.value.length === 0) {
    return {
      hasMerged: false,
      hasUnmerged: false,
      isSingleMerged: false,
      groupId: null,
      canMerge: false,
      canUnmerge: false,
    };
  }
  
  const flows = flowPageRef.value.data || [];
  let hasMerged = false; // 是否有合并记录（主记录）
  let hasUnmerged = false; // 是否有未合并记录
  let mergedGroupIds = new Set<string>(); // 选中的合并记录的groupId集合
  
  // 按groupId分组，找出每个组的第一条记录（主记录）
  const groupMap = new Map<string, any[]>();
  flows.forEach((flow: any) => {
    if (flow.groupId) {
      if (!groupMap.has(flow.groupId)) {
        groupMap.set(flow.groupId, []);
      }
      groupMap.get(flow.groupId)!.push(flow);
    }
  });
  
  // 找出每个组的主记录（id最小的记录）
  const mainRecords = new Map<string, number>(); // groupId -> 主记录id
  groupMap.forEach((groupFlows, groupId) => {
    const sortedFlows = [...groupFlows].sort((a, b) => a.id - b.id);
    if (sortedFlows.length > 0) {
      mainRecords.set(groupId, sortedFlows[0].id);
    }
  });
  
  selectedFlows.value.forEach((selectedId) => {
    const idStr = String(selectedId);
    // 检查是否是主记录（使用特殊标识符 main-${groupId}）
    if (idStr.startsWith('main-')) {
      const groupId = idStr.replace('main-', '');
      hasMerged = true;
      mergedGroupIds.add(groupId);
    } else {
      // 普通记录或子记录
      const flow = flows.find((f: any) => f.id === selectedId);
      if (flow) {
        if (flow.groupId) {
          // 这是子记录，不算作合并记录（因为子记录不能单独操作）
          // 但需要检查是否是主记录对应的第一条子记录
          const mainRecordId = mainRecords.get(flow.groupId);
          if (mainRecordId === flow.id) {
            // 这是主记录对应的第一条子记录，但主记录没有被选中（否则会使用 main-${groupId}）
            // 这种情况不应该发生，但为了安全起见，我们将其视为子记录
          }
        } else {
          // 独立记录
          hasUnmerged = true;
        }
      }
    }
  });
  
  // 判断是否可以取消合并：当且仅当选中一条记录且该条记录是主记录
  const canUnmerge = hasMerged && !hasUnmerged && mergedGroupIds.size === 1 && selectedFlows.value.length === 1;
  
  // 判断是否可以合并：
  // 1. 不能包含合并记录（如果包含合并记录，禁用合并按钮）
  // 2. 必须选中至少2条未合并记录
  const canMerge = !hasMerged && selectedFlows.value.length >= 2;
  
  return {
    hasMerged,
    hasUnmerged,
    isSingleMerged: canUnmerge,
    groupId: mergedGroupIds.size === 1 ? Array.from(mergedGroupIds)[0] : null,
    canMerge,
    canUnmerge,
  };
});

const totalPages = computed(() =>
  Math.ceil((flowPageRef.value?.total || 0) / (flowQuery.value.pageSize || 20))
);

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = flowQuery.value.pageNum || 1;
  const delta = 2;
  const range = [];

  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  if (current - delta > 2) {
    range.unshift("...");
  }
  if (current + delta < total - 1) {
    range.push("...");
  }

  range.unshift(1);
  if (total > 1) {
    range.push(total);
  }

  return range;
});

// 方法定义
const toggleSelectAll = () => {
  // 需要从processedFlows中获取显示记录（合并组只算1条）
  // 但由于processedFlows在FlowsTable中，我们需要自己计算
  const flows = flowPageRef.value?.data || [];
  
  if (isAllSelected.value) {
    selectedFlows.value = [];
  } else {
    // 只选择显示记录（合并组只选主记录，不选子记录）
    const groupMap = new Map<string, any[]>();
    flows.forEach((flow: any) => {
      if (flow.groupId) {
        if (!groupMap.has(flow.groupId)) {
          groupMap.set(flow.groupId, []);
        }
        groupMap.get(flow.groupId)!.push(flow);
      }
    });
    
    // 选择所有显示记录：主记录使用 main-${groupId}，独立记录使用实际id
    selectedFlows.value = [];
    groupMap.forEach((groupFlows, groupId) => {
      // 每个合并组只选择主记录（使用特殊标识符）
      selectedFlows.value.push(`main-${groupId}`);
    });
    // 添加所有独立记录
    flows
      .filter((flow: any) => !flow.groupId)
      .forEach((flow: any) => {
        selectedFlows.value.push(flow.id);
      });
  }
};

const toggleSelectItem = (id: string | number) => {
  // 如果选择的是主记录（使用特殊标识符 main-${groupId}），需要特殊处理
  const idStr = String(id);
  if (idStr.startsWith('main-')) {
    // 这是主记录，直接使用 main-${groupId} 作为标识符
    const index = selectedFlows.value.indexOf(idStr);
    if (index > -1) {
      selectedFlows.value.splice(index, 1);
    } else {
      // 选择主记录时，先移除该合并组的所有子记录（如果有）
      const groupId = idStr.replace('main-', '');
      const flows = flowPageRef.value.data || [];
      selectedFlows.value = selectedFlows.value.filter((selectedId: any) => {
        const selectedFlow = flows.find((f: any) => f.id === selectedId);
        return !(selectedFlow && selectedFlow.groupId === groupId);
      });
      // 添加主记录的标识符
      selectedFlows.value.push(idStr);
    }
  } else {
    // 普通记录或子记录的选择
    // 如果选择的是子记录，需要检查是否与主记录冲突
    const flows = flowPageRef.value.data || [];
    const selectedFlow = flows.find((f: any) => f.id === id);
    if (selectedFlow && selectedFlow.groupId) {
      // 这是子记录，检查主记录是否已选中
      const mainId = `main-${selectedFlow.groupId}`;
      const mainIndex = selectedFlows.value.indexOf(mainId);
      if (mainIndex > -1) {
        // 主记录已选中，取消选择主记录
        selectedFlows.value.splice(mainIndex, 1);
      }
    }
    
    const index = selectedFlows.value.indexOf(id);
    if (index > -1) {
      selectedFlows.value.splice(index, 1);
    } else {
      selectedFlows.value.push(id);
    }
  }
};

const changePageSize = (size: string) => {
  flowQuery.value.pageSize = Number(size);
  flowQuery.value.pageNum = 1;
  doQuery();
};

const changePage = (page: number | string) => {
  if (typeof page === "number") {
    flowQuery.value.pageNum = page;
    doQuery();
  }
};

const handleSearchApply = (query: any) => {
  Object.assign(flowQuery.value, query);
  flowQuery.value.pageNum = 1;
  doQuery();
};

const resetQuery = () => {
  flowQuery.value = {
    pageNum: 1,
    pageSize: 20,
    startDay: "",
    endDay: "",
    attribution: "",
    name: "",
    description: "",
    flowType: "",
    industryType: "",
    payType: "",
    minMoney: undefined,
    maxMoney: undefined,
    moneySort: "",
    daySort: "",
  };
  selectedFlows.value = [];
  doQuery();
};

// 排序切换
const toggleSort = (field: 'money' | 'day') => {
  if (field === 'money') {
    if (!flowQuery.value.moneySort) {
      flowQuery.value.moneySort = "asc";
      flowQuery.value.daySort = ""; // 清除其他排序
    } else if (flowQuery.value.moneySort === "asc") {
      flowQuery.value.moneySort = "desc";
    } else {
      flowQuery.value.moneySort = "";
    }
  } else if (field === 'day') {
    if (!flowQuery.value.daySort) {
      flowQuery.value.daySort = "asc";
      flowQuery.value.moneySort = ""; // 清除其他排序
    } else if (flowQuery.value.daySort === "asc") {
      flowQuery.value.daySort = "desc";
    } else {
      flowQuery.value.daySort = "";
    }
  }
  flowQuery.value.pageNum = 1;
  doQuery();
};

// 检测是否有筛选条件
const hasFilters = computed(() => {
  return !!(
    flowQuery.value.startDay ||
    flowQuery.value.endDay ||
    flowQuery.value.attribution ||
    flowQuery.value.name ||
    flowQuery.value.description ||
    flowQuery.value.flowType ||
    flowQuery.value.industryType ||
    flowQuery.value.payType ||
    flowQuery.value.minMoney !== undefined ||
    flowQuery.value.maxMoney !== undefined
  );
});

// 操作方法
const enterSelectionMode = () => {
  isSelectionMode.value = true;
  selectedFlows.value = [];
};

const exitSelectionMode = () => {
  isSelectionMode.value = false;
  selectedFlows.value = [];
};

const openCreateDialog = () => {
  dialogFormTitle.value = formTitle[0];
  showFlowEditDialog.value = true;
  selectedFlow.value = {};
};

// 将主记录的特殊id转换为实际的id列表
const convertMainIdsToActualIds = (ids: any[]): number[] => {
  const flows = flowPageRef.value.data || [];
  const result: number[] = [];
  
  ids.forEach((id) => {
    const idStr = String(id);
    if (idStr.startsWith('main-')) {
      // 主记录：获取该合并组的所有子记录的id
      const groupId = idStr.replace('main-', '');
      const groupFlows = flows.filter((f: any) => f.groupId === groupId);
      groupFlows.forEach((flow: any) => {
        result.push(flow.id);
      });
    } else {
      // 普通记录或子记录：直接使用id
      result.push(Number(id));
    }
  });
  
  return result;
};

const deleteItems = () => {
  if (!isSelectionMode.value || selectedFlows.value.length <= 0) {
    Alert.error("请至少选择一条要删除的流水");
    return;
  }
  Confirm.open({
    title: "删除确认",
    content: `确定删除流水 【${selectedFlows.value.length} 条】吗?`,
    confirm: () => {
      // 将主记录的特殊id转换为实际的id列表
      const actualIds = convertMainIdsToActualIds(selectedFlows.value);
      doApi
        .post("api/entry/flow/dels", {
          ids: actualIds,
          bookId: localStorage.getItem("bookId"),
        })
        .then(() => {
          Alert.success("删除成功");
          selectedFlows.value = [];
          doQuery();
          // 删除后退出选择模式
          exitSelectionMode();
        })
        .catch(() => {
          Alert.error("删除失败");
        });
    },
  });
};

const toChangeTypeBatch = () => {
  if (!isSelectionMode.value || selectedFlows.value.length <= 0) {
    Alert.error("请至少选择一条要修改的流水");
    return;
  }
  showBatchChangeDialog.value = true;
};

// 合并选中的记录
const mergeSelected = () => {
  if (!isSelectionMode.value || selectedFlows.value.length < 2) {
    Alert.error("至少需要选择2条记录才能合并");
    return;
  }
  
  // 检查是否包含合并记录
  if (selectedItemsInfo.value.hasMerged) {
    Alert.error("不能同时选择合并记录和未合并记录进行合并");
    return;
  }
  
  Confirm.open({
    title: "合并确认",
    content: `确定将选中的 ${selectedFlows.value.length} 条记录合并为一条吗？`,
    confirm: () => {
      // 将主记录的特殊id转换为实际的id列表（合并操作只接受未合并的记录）
      const actualIds = convertMainIdsToActualIds(selectedFlows.value);
      doApi
        .post("api/entry/flow/merge", {
          ids: actualIds,
          bookId: localStorage.getItem("bookId"),
        })
        .then(() => {
          Alert.success("合并成功");
          selectedFlows.value = [];
          doQuery();
          // 合并后退出选择模式
          exitSelectionMode();
        })
        .catch((error: any) => {
          Alert.error(error?.message || "合并失败");
        });
    },
  });
};

// 取消合并选中的记录
const unmergeSelected = () => {
  if (!isSelectionMode.value || !selectedItemsInfo.value.groupId) {
    Alert.error("请选择要取消合并的记录");
    return;
  }
  
  Confirm.open({
    title: "取消合并确认",
    content: `确定要取消这个合并组吗？合并的记录将恢复为独立记录。`,
    confirm: () => {
      doApi
        .post("api/entry/flow/unmerge", {
          groupId: selectedItemsInfo.value.groupId,
          bookId: localStorage.getItem("bookId"),
        })
        .then(() => {
          Alert.success("取消合并成功");
          selectedFlows.value = [];
          doQuery();
          // 取消合并后退出选择模式
          exitSelectionMode();
        })
        .catch((error: any) => {
          Alert.error(error?.message || "取消合并失败");
        });
    },
  });
};

// 取消合并
const unmergeGroup = (groupId: string) => {
  Confirm.open({
    title: "取消合并确认",
    content: `确定要取消这个合并组吗？合并的记录将恢复为独立记录。`,
    confirm: () => {
      doApi
        .post("api/entry/flow/unmerge", {
          groupId,
          bookId: localStorage.getItem("bookId"),
        })
        .then(() => {
          Alert.success("取消合并成功");
          doQuery();
        })
        .catch((error: any) => {
          Alert.error(error?.message || "取消合并失败");
        });
    },
  });
};

// 编辑单个流水
const editItem = (item: any) => {
  dialogFormTitle.value = formTitle[1];
  selectedFlow.value = item;
  showFlowEditDialog.value = true;
};

// 删除单个流水
const deleteItem = (item: any) => {
  if (!item.id) {
    Alert.error("请选择要删除的数据");
    return;
  }
  
  // 如果是主记录，提示删除整个合并组
  const isGroupMain = item.isGroupMain === true;
  const confirmContent = isGroupMain 
    ? `确定删除合并记录及其所有子记录吗？此操作不可撤销！`
    : `确定删除流水 【${item.name}:${item.money}】吗?`;
  
  Confirm.open({
    title: "删除确认",
    content: confirmContent,
    confirm: () => {
      const deleteData: any = {
        id: item.id,
        bookId: localStorage.getItem("bookId"),
      };
      
      // 如果是主记录，传递标记
      if (isGroupMain && item.groupId) {
        deleteData.isGroupMain = true;
        deleteData.groupId = item.groupId;
      }
      
      doApi
        .post("api/entry/flow/del", deleteData)
        .then(() => {
          Alert.success("删除成功");
          doQuery();
        })
        .catch(() => {
          Alert.error("删除失败");
        });
    },
  });
};

// 批量修改对话框
const closeBatchChangeDialog = () => {
  showBatchChangeDialog.value = false;
  batchChange.value = {
    flowType: "",
    industryType: "",
    payType: "",
    attribution: "",
  };
};

const confirmBatchChange = () => {
  let changeInfo = "";
  if (batchChange.value.flowType) {
    changeInfo += `  流水类型改为: "${batchChange.value.flowType}"\n`;
  }
  if (batchChange.value.industryType) {
    changeInfo += `  支出类型/收入类型改为: "${batchChange.value.industryType}"\n`;
  }
  if (batchChange.value.payType) {
    changeInfo += `  支付方式/收款方式改为: "${batchChange.value.payType}"`;
  }
  if (batchChange.value.attribution) {
    changeInfo += `  流水归属改为: "${batchChange.value.attribution}"`;
  }
  if (!changeInfo) {
    Alert.error("未发现任何变更信息");
    return;
  }
  Confirm.open({
    title: "修改确认",
    content: `确定对【${selectedFlows.value.length}】条流水进行如下修改吗? \n${changeInfo}`,
    confirm: () => {
      // 将主记录的特殊id转换为实际的id列表
      const actualIds = convertMainIdsToActualIds(selectedFlows.value);
      doApi
        .post("api/entry/flow/updates", {
          ids: actualIds,
          bookId: localStorage.getItem("bookId"),
          ...batchChange.value,
        })
        .then(() => {
          Alert.success("修改成功");
          closeBatchChangeDialog();
          selectedFlows.value = [];
          doQuery();
          // 批量修改后退出选择模式
          exitSelectionMode();
        })
        .catch(() => {
          Alert.error("修改失败");
        });
    },
  });
};

// CSV导入方法
const openCsvImport = (type: string) => {
  if (!csvFileInput.value) {
    return;
  }
  fileType.value = type;
  if (fileType.value === "alipay") {
    // 支付宝表头行是第25行，索引是24
    titleRowIndex.value = 24;
  } else if (fileType.value === "wxpay") {
    // 微信表头行是第17行，索引是16
    titleRowIndex.value = 16;
  } else if (fileType.value === "jdFinance") {
    // 京东金融表头行是第22行，索引是21
    titleRowIndex.value = 21;
  }
  importDrawer.value = false;
  csvFileInput.value.click();
};

const readCsvInfo = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target?.files?.[0];
  csvFile.value = file;

  if (!file) {
    csvFlows.value = [];
    return;
  }

  // 创建FileReader对象
  const reader = new FileReader();

  // 设置文件读取完成后的回调函数
  reader.onload = async (event) => {
    try {
      // 文件数据ArrayBuffer
      const buffer = event.target?.result;
      // 待保存excel实体
      let workbook: XLSX.WorkBook;

      /**************************************/
      // 不同编码格式读取
      /**************************************/
      if (fileType.value === "alipay") {
        // 阿里csv账单为GB2312编码，需要特殊处理
        // @ts-ignore
        const context = new TextDecoder("gb2312").decode(buffer);
        workbook = XLSX.read(context, { type: "string", codepage: 936 });
      } else {
        workbook = XLSX.read(buffer, { raw: true });
      }
      // 至此，初步说明文件没有什么问题，清理一下历史数据，准备解析组装新数据
      removeFile();

      /**************************************/
      // 将 xlsx 数据结构转换为 node-xlsx 数据结构，便于页面回显
      // sheets是sheet的数组，每个sheet有两个属性: name - sheet名称 data - sheet数据
      /**************************************/
      const sheets = workbook.SheetNames.map((sheetName) => {
        const xlsxSheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json<any[]>(xlsxSheet, {
          header: 1, // 表头行数
          defval: "",
          dateNF: "yyyy-mm-dd", // 日期格式
        });
        return {
          sheetName,
          sheetData,
        };
      });

      // 数据集合--csv默认只有一个sheet，所以只需要取第一个sheet
      const sheetData: any[] = sheets[0].sheetData;

      /**************************************/
      // 表头数据
      /**************************************/
      // 表头索引集合，key-表头值，value-表头索引
      const headerData = sheetData[titleRowIndex.value];
      for (let i = 0; i < headerData.length; i++) {
        if (!headerData[i] || headerData[i].trim() === "") {
          // 表头为空，跳过该列
          continue;
        }
        csvHeaders.value[headerData[i]] = i;
      }
      // 删除表头及以上行数据，只保留流水数据
      sheetData.splice(0, titleRowIndex.value + 1);

      /**************************************/
      // 数据主体（table-body）回显
      /**************************************/
      // 时间列的索引
      const timeIndex = csvHeaders.value["交易时间"];
      sheetData.forEach((row) => {
        // 部分数据字段格式化，并回显
        for (let i = 0; i < row.length; i++) {
          let cellValue = row[i];
          // 日期字段特殊处理，将日期数字转换为 JavaScript 日期对象
          // 目前京东/支付宝/微信可以统一处理
          if (i === timeIndex) {
            if (typeof cellValue === "number" && cellValue > 0) {
              // Excel 中日期从1899年12月30日开始
              const excelStartDate = new Date(1899, 11, 30);
              const resultDate = new Date(excelStartDate);
              resultDate.setDate(resultDate.getDate() + cellValue);
              // 添加时区偏移（假设是+8小时）
              resultDate.setHours(resultDate.getHours() + 8);
              // 简单的日期转字符串
              cellValue = resultDate.toISOString().split("T")[0];
              // 将格式化后的字符串重新赋值会sheetData，后续存储需要使用格式化后的的数据
              row[i] = cellValue;
            } else {
              // 每年1月1日解析后不是数字，因此不需要特殊处理，直接当作日期处理即可
              // 已知只有支付宝1月1日会报错。其他的还不知道
              const resultDate = new Date(cellValue);
              // 添加时区偏移（假设是+8小时）
              resultDate.setHours(resultDate.getHours() + 8);
              cellValue = resultDate.toISOString().split("T")[0];
              // 将格式化后的字符串重新赋值会sheetData，后续存储需要使用格式化后的的数据
              row[i] = cellValue;
            }
          }
        }
        // 一行数据作为一个记录，csvDatas中每一个记录代表一个流水
        csvDatas.value.push(row);

        /**************************************/
        // 解析数据到实体集合
        /**************************************/
        let flow;
        if (fileType.value === "alipay") {
          flow = alipayConvert(row, csvHeaders.value);
        } else if (fileType.value === "wxpay") {
          flow = wxpayConvert(row, csvHeaders.value);
        } else if (fileType.value === "jdFinance") {
          flow = jdFinanceConvert(row, csvHeaders.value);
        } else {
          // 其他数据，暂不处理
          flow = templateConvert(row, csvHeaders.value);
        }
        csvFlows.value.push(flow);
      });

      // 对于微信、支付宝、京东账单，显示确认窗口
      if (fileType.value === "wxpay" || fileType.value === "alipay" || fileType.value === "jdFinance") {
        // 显示确认窗口，让用户选择是否使用自动识别
        showClassifyConfirmDialog.value = true;
      } else {
        // 其他类型直接显示预览
        showFlowExcelImportDialog.value = true;
      }
      
      // 触发表格初始渲染
      const currentDatas = [...csvDatas.value];
      csvDatas.value = [];
      setTimeout(() => {
        csvDatas.value = currentDatas;
      }, 50);
    } catch (error) {
      console.error(error);
      Alert.error("数据解析出错了，请确认文件是否存在问题");
    }
  };

  // 读取文件的内容为文本
  reader.readAsArrayBuffer(file);
};

/**
 * 开始自动识别（后台进行）
 */
const startAutoClassify = () => {
  // 在后台异步执行，不阻塞UI
  autoClassifyFlows().catch((error) => {
    console.error("自动识别类型失败:", error);
  });
};

/**
 * 手动触发识别
 */
const startManualClassify = () => {
  useAutoClassify.value = true;
  startAutoClassify();
};

/**
 * 自动识别开关切换
 */
const onAutoClassifyToggle = () => {
  if (!useAutoClassify.value) {
    // 如果关闭自动识别，清空类型字段
    csvFlows.value.forEach((flow) => {
      flow.flowType = "";
      flow.industryType = "";
    });
  }
};

/**
 * 获取文件类型名称
 */
const getFileTypeName = () => {
  if (fileType.value === 'wxpay') return '微信';
  if (fileType.value === 'alipay') return '支付宝';
  if (fileType.value === 'jdFinance') return '京东';
  return '未知';
};

/**
 * 关闭确认对话框
 */
const closeClassifyConfirmDialog = () => {
  showClassifyConfirmDialog.value = false;
  // 如果不使用识别，只清空交易类型（industryType），保留收入/支出（flowType）
  useAutoClassify.value = false;
  csvFlows.value.forEach((flow) => {
    flow.industryType = "";
  });
  // 触发表格重新渲染
  const currentDatas = [...csvDatas.value];
  csvDatas.value = [];
  setTimeout(() => {
    csvDatas.value = currentDatas;
    showFlowExcelImportDialog.value = true;
  }, 100);
};

/**
 * 确认不使用识别
 */
const confirmWithoutClassify = () => {
  console.log("确认不使用识别");
  useAutoClassify.value = false;
  // 只清空交易类型（industryType），保留收入/支出（flowType）
  csvFlows.value.forEach((flow) => {
    flow.industryType = "";
  });
  showClassifyConfirmDialog.value = false;
  // 触发表格重新渲染
  const currentDatas = [...csvDatas.value];
  csvDatas.value = [];
  setTimeout(() => {
    csvDatas.value = currentDatas;
    showFlowExcelImportDialog.value = true;
  }, 100);
};

/**
 * 确认使用识别
 */
const confirmWithClassify = () => {
  useAutoClassify.value = true;
  isClassifyCancelled.value = false;
  showClassifyConfirmDialog.value = false;
  showClassifyProgressDialog.value = true;
  // 开始识别
  autoClassifyFlows().catch((error) => {
    console.error("自动识别类型失败:", error);
    showClassifyProgressDialog.value = false;
    if (!isClassifyCancelled.value) {
      showFlowExcelImportDialog.value = true;
    }
  });
};

/**
 * 取消识别
 */
const cancelClassify = () => {
  isClassifyCancelled.value = true;
  isClassifying.value = false;
  showClassifyProgressDialog.value = false;
  // 取消后不显示预览，直接关闭所有窗口
  showFlowExcelImportDialog.value = false;
};

/**
 * 自动识别缺失类型的流水（仅用于微信、支付宝、京东账单导入）
 */
const autoClassifyFlows = async () => {
  // 对于微信、支付宝、京东账单，即使有类型也可能不准确，所以对所有流水进行识别
  const flowsToClassify = csvFlows.value.filter((flow) => {
    // 只要有名称或描述，就可以尝试识别
    return (flow.name && flow.name.trim()) || (flow.description && flow.description.trim());
  });

  isClassifying.value = true;
  isClassifyCancelled.value = false;
  
  if (flowsToClassify.length === 0) {
    console.log("没有可识别的流水（缺少名称或描述）");
    // 即使没有可识别的流水，也要关闭进度窗口并显示预览
    isClassifying.value = false;
    classifyProgress.value = 100;
    showClassifyProgressDialog.value = false;
    showFlowExcelImportDialog.value = true;
    return;
  }

  classifyTotal.value = flowsToClassify.length;
  classifyCompleted.value = 0;
  classifyProgress.value = 0;

  console.log(`开始识别 ${flowsToClassify.length} 条流水的类型...`, flowsToClassify.slice(0, 3));

  try {
    // 构建识别请求
    const transactions = flowsToClassify.map((flow) => ({
      merchantName: flow.name || "",
      description: flow.description || "",
      amount: flow.money || 0,
    }));

    console.log("准备调用API识别，前3条数据:", transactions.slice(0, 3));

    // 批量识别（带进度更新）
    const batchSize = 5;
    const delay = 300;
    const results: Array<ClassificationResult | null> = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      // 检查是否取消
      if (isClassifyCancelled.value) {
        console.log("用户取消了识别");
        isClassifying.value = false;
        showClassifyProgressDialog.value = false;
        // 取消后不显示预览，直接关闭
        showFlowExcelImportDialog.value = false;
        return;
      }

      const batch = transactions.slice(i, i + batchSize);
      
      const batchPromises = batch.map((tx) => {
        return classifyTransaction(tx.merchantName, tx.description, tx.amount);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 更新进度
      classifyCompleted.value = results.length;
      classifyProgress.value = Math.round((classifyCompleted.value / classifyTotal.value) * 100);

      // 批次间延迟，避免API限流
      if (i + batchSize < transactions.length && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log("API识别结果:", results.slice(0, 3), `共${results.length}条`);

    // 应用识别结果
    // 只识别交易类型（industryType），不识别收入/支出（flowType），因为flowType从CSV中已经可以准确获取
    results.forEach((result, index) => {
      if (result && result.industryType) {
        const flow = flowsToClassify[index];
        const oldType = flow.industryType;
        flow.industryType = result.industryType;
        console.log(`识别 industryType: ${oldType || '空'} -> ${result.industryType}`, flow.name);
      }
      // 如果result为null，保持原样（当前策略）
    });
    
    // 触发表格重新渲染
    const currentDatas = [...csvDatas.value];
    csvDatas.value = [];
    setTimeout(() => {
      csvDatas.value = currentDatas;
    }, 100);

    const successCount = results.filter((r) => r !== null && r.industryType).length;
    if (successCount > 0) {
      Alert.success(`已为 ${successCount} 条流水自动识别类型，您可以在预览中修改`);
    }
  } catch (error) {
    console.error("自动识别类型失败:", error);
    // 失败时静默处理，保持原样（当前策略）
  } finally {
    // 如果已取消，不执行后续操作
    if (isClassifyCancelled.value) {
      return;
    }
    isClassifying.value = false;
    classifyProgress.value = 100;
    // 确保关闭进度窗口，显示预览窗口
    // 延迟300ms，让用户看到100%的进度
    setTimeout(() => {
      showClassifyProgressDialog.value = false;
      showFlowExcelImportDialog.value = true;
    }, 300);
  }
};

const importSuccess = () => {
  closeCsvTableDialog();
  doQuery();
};

const removeFile = () => {
  csvFlows.value = [];
  csvHeaders.value = {};
  csvDatas.value = [];
  csvFile.value = undefined; // 清楚选中的文件
  isClassifying.value = false;
  return true;
};

const closeCustomImport = () => {
  showFlowCustomImportDialog.value = false;
};

// CSV导入对话框
const closeCsvTableDialog = () => {
  showFlowExcelImportDialog.value = false;
  removeFile();
};

const showFlowCustomImport = () => {
  showFlowCustomImportDialog.value = true;
  importDrawer.value = false;
};

const openJsonImport = () => {
  showFlowJsonImportDialog.value = true;
  importDrawer.value = false;
};

const exportJson = () => {
  const bookName = localStorage.getItem("bookName");
  doApi
    .post("api/entry/flow/list", {
      ...flowQuery.value,
      bookId: localStorage.getItem("bookId"),
    })
    .then((data) => {
      const fileName = bookName + "-" + new Date().getTime() + ".json";
      exportJsonFile(fileName, JSON.stringify(data));
    })
    .catch(() => {
      Alert.error("数据获取出错，无法导出！");
    });
};

const exportCsv = () => {
  const bookName = localStorage.getItem("bookName");
  doApi
    .post<any[]>("api/entry/flow/list", {
      ...flowQuery.value,
      bookId: localStorage.getItem("bookId"),
    })
    .then((data) => {
      const fileName = bookName + "-" + new Date().getTime() + ".csv";
      exportCsvFile(fileName, data);
    })
    .catch(() => {
      Alert.error("数据获取出错，无法导出！");
    });
};

const downloadCsvTemplate = () => {
  const fileName = "青葱记账模板.csv";
  const url = "/csvtemplate.csv";
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
};

const importCsvTemplate = () => {
  if (!csvFileInput.value) {
    return;
  }
  fileType.value = "template";
  titleRowIndex.value = 0;
  importDrawer.value = false;
  csvFileInput.value.click();
};


// 初始化数据
onMounted(() => {
  getNames();
  getAttributions();
  doQuery();
});
</script>
