<template>
  <!-- 自定义流水导入对话框 -->
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] overflow-y-auto"
  >
    <!-- 标题栏 -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        自定义流水导入
      </h3>
      <button
        @click="closeDialog"
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- 步骤导航 -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex justify-center space-x-8 px-4" aria-label="步骤">
        <button
          v-for="step in steps"
          :key="step.id"
          @click="tab = step.id"
          :class="[
            'py-4 px-2 border-b-2 font-medium text-sm transition-colors',
            tab === step.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
          ]"
        >
          <span class="flex items-center gap-2">
            <span
              :class="[
                'flex items-center justify-center w-6 h-6 rounded-full text-xs',
                tab === step.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400',
              ]"
            >
              {{ step.id }}
            </span>
            {{ step.title }}
          </span>
        </button>
      </nav>
    </div>

    <!-- 步骤内容 -->
    <div class="p-6">
      <!-- 步骤 1: 文件信息 -->
      <div v-if="tab === 1" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 文件格式 -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              文件格式
            </label>
            <select
              v-model="fileType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="type in fileTypes" :key="type" :value="type">
                {{ type.toUpperCase() }}
              </option>
            </select>
          </div>

          <!-- 文件编码 -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              文件编码
            </label>
            <select
              v-model="fileEncoding"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option
                v-for="encoding in fileEncodings"
                :key="encoding"
                :value="encoding"
              >
                {{ encoding }}
              </option>
            </select>
          </div>

          <!-- 标题行行数 -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              标题行行数
            </label>
            <input
              v-model.number="titleRowLine"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div class="text-center pt-4">
          <button
            @click="toSecondTab"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            下一步
          </button>
        </div>
      </div>

      <!-- 步骤 2: 映射配置 -->
      <div v-if="tab === 2" class="space-y-4">
        <!-- 文件选择 -->
        <div class="text-center">
          <input
            ref="csvFileInput"
            type="file"
            :accept="`.${fileType}`"
            @change="onFileChange"
            class="hidden"
          />
          <button
            @click="importCsvTemplate"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <DocumentArrowUpIcon class="h-5 w-5" />
            选择文件
          </button>
        </div>

        <!-- 字段映射配置 -->
        <div v-if="csvHeaders.length === 0" class="text-center py-8">
          <div class="text-red-500 dark:text-red-400">
            <ExclamationTriangleIcon class="h-8 w-8 mx-auto mb-2" />
            请先选择文件
          </div>
        </div>
        <!-- 智能识别提示 -->
        <div
          v-if="csvHeaders.length > 0 && !isClassifying"
          class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
        >
          <p class="text-sm text-blue-700 dark:text-blue-300">
            💡 提示：导入后系统会自动识别缺失的交易类型。您可以在预览中修改识别结果。
          </p>
        </div>
        <!-- 识别中提示 -->
        <div
          v-if="isClassifying"
          class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
        >
          <div class="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
            <span>正在智能识别交易类型...</span>
          </div>
        </div>
        <div
          v-if="csvHeaders.length > 0"
          class="max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border"
        >
          <div
            v-for="field in csvHeaders"
            :key="field"
            class="mb-4 p-3 bg-white dark:bg-gray-800 rounded border"
          >
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ field }}
            </h4>
            <select
              v-model="targetFieldMapping[field]"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择目标字段</option>
              <option
                v-for="targetField in targetFields"
                :key="targetField.value"
                :value="targetField.value"
              >
                {{ targetField.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-center gap-4 pt-4">
          <button
            @click="toFirstTab"
            class="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            上一步
          </button>
          <button
            @click="toLastTab"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            下一步
          </button>
        </div>
      </div>

      <!-- 步骤 3: 数据预览 -->
      <div v-if="tab === 3" class="space-y-4">
        <div class="text-center">
          <button
            @click="readCsvInfo"
            :disabled="!csvFile || Object.keys(targetFieldMapping).length === 0"
            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
          >
            <MagnifyingGlassIcon class="h-5 w-5" />
            解析数据
          </button>
        </div>

        <!-- 数据预览表格 -->
        <div v-if="csvHeaders.length === 0" class="text-center py-8">
          <div class="text-red-500 dark:text-red-400">
            <ExclamationTriangleIcon class="h-8 w-8 mx-auto mb-2" />
            请先选择文件
          </div>
        </div>
        <div
          v-else-if="showCsvTable"
          class="max-h-96 overflow-auto border rounded-lg"
        >
          <div class="excel-table">
            <table ref="excelTable" class="min-w-full">
              <thead
                ref="excelTableHead"
                class="bg-gray-50 dark:bg-gray-700 sticky top-0"
              ></thead>
              <tbody
                ref="excelTableBody"
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              ></tbody>
            </table>
          </div>
        </div>

        <div class="text-center pt-4">
          <button
            @click="toSecondTab"
            class="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            上一步
          </button>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div
      class="flex flex-col sm:flex-row gap-3 p-4 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        @click="closeDialog"
        class="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        关闭
      </button>
      <button
        @click="submitUpload"
        :disabled="csvFlows.length === 0 || uploading"
        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <div
          v-if="uploading"
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
        ></div>
        {{ uploading ? "导入中..." : "导入数据" }}
      </button>
    </div>
  </div>

  <!-- 全屏CSV表格对话框 -->
  <div
    v-if="showFlowExcelImportDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeCsvTableDialog"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl mx-auto max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- 标题栏 -->
      <div
        class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          CSV 流水导入
        </h3>
        <button
          @click="closeCsvTableDialog"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 表格内容 -->
      <div class="p-4">
        <DatasCsvFlowTable
          :items="csvFlows"
          :table-head="csvHeaders"
          :table-body="csvDatas"
          :success-callback="importSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as XLSX from "xlsx";
import { showFlowExcelImportDialog } from "~/utils/flag";
import { ref, onMounted } from "vue";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";
import { classifyTransactionsBatch } from "~/utils/typeClassifier";

// ESC键监听
useEscapeKey(() => {
  if (showFlowExcelImportDialog.value) {
    showFlowExcelImportDialog.value = false;
  }
}, showFlowExcelImportDialog);

// Define Flow interface
interface Flow {
  day?: string;
  flowType?: string;
  industryType?: string;
  payType?: string;
  money?: number;
  attribution?: string;
  name?: string;
  description?: string;
}

const emits = defineEmits(["success-callback", "close"]);

// 步骤配置
const steps = [
  { id: 1, title: "文件信息" },
  { id: 2, title: "映射配置" },
  { id: 3, title: "数据预览" },
];

const fileType = ref("csv");
const fileTypes = ["csv", "xlsx", "xls"];
const fileEncoding = ref("UTF8");
const fileEncodings = ["UTF8", "GB2312"];
const titleRowLine = ref(1);
const tab = ref(1);
const csvFileInput = ref<HTMLInputElement>();
const csvFile = ref<File | null>(null);

const csvFlows = ref<Flow[]>([]);
const csvHeaders = ref<string[]>([]);
const csvDatas = ref<any[]>([]);

const targetFields = ref<any[]>([
  { title: "日期", value: "day" },
  { title: "流水类型", value: "flowType" },
  { title: "支出/收入类型", value: "industryType" },
  { title: "支付/收款方式", value: "payType" },
  { title: "金额", value: "money" },
  { title: "流水归属", value: "attribution" },
  { title: "名称", value: "name" },
  { title: "备注", value: "description" },
]);

const targetFieldMapping = ref<Record<string, string>>({});
const headerIndexMap = ref<Record<string, number>>({});

const importCsvTemplate = () => {
  csvFileInput.value?.click();
};

// 文件选择处理
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    csvFile.value = file;
    readCsvHeader();
  }
};

const readCsvHeader = () => {
  const file = csvFile.value;
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const titleRowIndex = titleRowLine.value - 1;
    // 文件数据ArrayBuffer
    const buffer = event.target?.result;
    if (!buffer) {
      Alert.error("文件读取失败");
      return;
    }

    // 待保存excel实体
    let workbook: XLSX.WorkBook;

    try {
      /**************************************/
      // 不同编码格式读取
      /**************************************/
      if (fileEncoding.value === "GB2312") {
        // 阿里csv账单为GB2312编码，需要特殊处理
        // @ts-ignore
        const context = new TextDecoder("gb2312").decode(buffer);
        workbook = XLSX.read(context, { type: "string", codepage: 936 });
      } else {
        workbook = XLSX.read(buffer, { raw: true });
      }

      // 清理历史数据，准备解析组装新数据
      removeFile();

      /**************************************/
      // 将 xlsx 数据结构转换为 node-xlsx 数据结构
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
      if (!sheetData || sheetData.length <= titleRowIndex) {
        Alert.error("文件格式错误或标题行设置有误");
        return;
      }

      /**************************************/
      // 表头数据
      /**************************************/
      const headerData = sheetData[titleRowIndex];
      csvHeaders.value = [];
      headerIndexMap.value = {};

      for (let i = 0; i < headerData.length; i++) {
        if (!headerData[i] || headerData[i].trim() === "") {
          // 表头为空，跳过该列
          continue;
        }
        csvHeaders.value.push(headerData[i]);
        headerIndexMap.value[headerData[i]] = i;
      }

      // 自动切换到映射配置标签页
      tab.value = 2;
      Alert.success("文件解析成功，请配置字段映射");
    } catch (error) {
      console.error(error);
      Alert.error("文件解析失败，请检查文件格式和编码设置");
    }
  };
  reader.readAsArrayBuffer(file);
};

const readCsvInfo = () => {
  const file = csvFile.value;
  if (!file) {
    Alert.warning("请先选择文件");
    return;
  }

  // 检查映射配置是否完整
  const mappingKeys = Object.keys(targetFieldMapping.value);
  if (mappingKeys.length === 0) {
    Alert.warning("请先完成字段映射配置");
    tab.value = 2;
    return;
  }

  // 创建FileReader对象
  const reader = new FileReader();

  // 设置文件读取完成后的回调函数
  reader.onload = (event) => {
    try {
      const titleRowIndex = titleRowLine.value - 1;
      // 文件数据ArrayBuffer
      const buffer = event.target?.result;
      if (!buffer) {
        Alert.error("文件读取失败");
        return;
      }

      // 待保存excel实体
      let workbook: XLSX.WorkBook;

      /**************************************/
      // 不同编码格式读取
      /**************************************/
      if (fileEncoding.value === "GB2312") {
        // @ts-ignore
        const context = new TextDecoder("gb2312").decode(buffer);
        workbook = XLSX.read(context, { type: "string", codepage: 936 });
      } else {
        workbook = XLSX.read(buffer, { raw: true });
      }

      // 清理历史数据
      csvFlows.value = [];
      csvDatas.value = [];

      /**************************************/
      // 将 xlsx 数据结构转换为 node-xlsx 数据结构
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
      const headerData = sheetData[titleRowIndex];
      headerIndexMap.value = {};

      for (let i = 0; i < headerData.length; i++) {
        if (!headerData[i] || headerData[i].trim() === "") {
          // 表头为空，跳过该列
          continue;
        }
        headerIndexMap.value[headerData[i]] = i;
      }

      // 删除表头及以上行数据，只保留流水数据
      sheetData.splice(0, titleRowIndex + 1);

      /**************************************/
      // 数据主体处理
      /**************************************/
      // 查找日期字段对应的列索引
      const dateFieldName = Object.keys(targetFieldMapping.value).find(
        (key) => targetFieldMapping.value[key] === "day"
      );
      const dateIndex = dateFieldName
        ? headerIndexMap.value[dateFieldName]
        : -1;

      sheetData.forEach((row) => {
        // 处理日期格式
        if (dateIndex >= 0 && dateIndex < row.length) {
          let cellValue = row[dateIndex];
          if (typeof cellValue === "number" && cellValue > 0) {
            // Excel 中日期从1899年12月30日开始
            const excelStartDate = new Date(1899, 11, 30);
            const resultDate = new Date(excelStartDate);
            resultDate.setDate(resultDate.getDate() + cellValue);
            // 添加时区偏移（假设是+8小时）
            resultDate.setHours(resultDate.getHours() + 8);
            // 简单的日期转字符串
            cellValue = resultDate.toISOString().split("T")[0];
            // 将格式化后的字符串重新赋值
            row[dateIndex] = cellValue;
          } else if (cellValue && typeof cellValue === "string") {
            try {
              // 尝试解析日期字符串
              const resultDate = new Date(cellValue);
              if (!isNaN(resultDate.getTime())) {
                // 添加时区偏移（假设是+8小时）
                resultDate.setHours(resultDate.getHours() + 8);
                cellValue = resultDate.toISOString().split("T")[0];
                // 将格式化后的字符串重新赋值
                row[dateIndex] = cellValue;
              }
            } catch (e) {
              console.error("日期解析错误", e);
            }
          }
        }

        // 保存原始数据行
        csvDatas.value.push(row);

        // 解析数据到实体集合
        let flow = customConvert(
          row,
          headerIndexMap.value,
          targetFieldMapping.value
        );
        if (flow) {
          csvFlows.value.push(flow);
        }
      });

      // 切换到数据预览标签页
      tab.value = 3;

      // 渲染表格
      renderTable();

      // 智能识别类型（仅对缺失类型的流水）
      // 在后台异步执行，不阻塞UI
      autoClassifyFlows().catch((error) => {
        console.error("自动识别类型失败:", error);
        // 失败时静默处理，保持原样（当前策略）
      });

      Alert.success("数据解析完成，请预览并点击【导入数据】保存数据");
      showCsvTable.value = true;
    } catch (error) {
      console.error(error);
      Alert.error("数据解析出错了，请确认文件是否存在问题");
    }
  };
  showCsvTable.value = false;
  // 读取文件内容
  reader.readAsArrayBuffer(file);
};
const showCsvTable = ref(false);
const isClassifying = ref(false);

/**
 * 自动识别缺失类型的流水
 */
const autoClassifyFlows = async () => {
  // 找出需要识别的流水（flowType或industryType为空）
  const flowsToClassify = csvFlows.value.filter(
    (flow) => !flow.flowType || !flow.industryType
  );

  if (flowsToClassify.length === 0) {
    return; // 所有流水都有类型，无需识别
  }

  isClassifying.value = true;

  try {
    // 构建识别请求
    const transactions = flowsToClassify.map((flow) => ({
      merchantName: flow.name || "",
      description: flow.description || "",
      amount: flow.money || 0,
    }));

    // 批量识别
    const results = await classifyTransactionsBatch(transactions, {
      batchSize: 5,
      delay: 300,
    });

    // 应用识别结果（仅填充空字段）
    results.forEach((result, index) => {
      if (result) {
        const flow = flowsToClassify[index];
        // 只填充空字段，不覆盖已有值
        if (!flow.flowType) {
          flow.flowType = result.flowType;
        }
        if (!flow.industryType) {
          flow.industryType = result.industryType;
        }
      }
      // 如果result为null，保持原样（当前策略）
    });

    const successCount = results.filter((r) => r !== null).length;
    if (successCount > 0) {
      Alert.success(`已为 ${successCount} 条流水自动识别类型，您可以在预览中修改`);
    } else if (flowsToClassify.length > 0) {
      // 如果所有识别都失败，可能是API未配置，静默处理
      console.log("智能识别未成功，使用当前策略（保持原样）");
    } else if (flowsToClassify.length > 0) {
      // 如果所有识别都失败，可能是API未配置，静默处理
      console.log("智能识别未成功，使用当前策略（保持原样）");
    }
  } catch (error) {
    console.error("自动识别类型失败:", error);
    // 失败时静默处理，保持原样（当前策略）
  } finally {
    isClassifying.value = false;
  }
};

/**
 * 根据映射配置转换数据
 */
const customConvert = (
  row: any[],
  indexMap: Record<string, number>,
  fieldMapping: Record<string, string>
): Flow | null => {
  const flow: Flow = {};

  // 创建一个临时对象来存储相同目标字段的多个值
  const fieldValues: Record<string, string[]> = {};

  // 遍历映射配置，收集所有映射到相同目标字段的值
  for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
    if (
      indexMap[sourceField] !== undefined &&
      row[indexMap[sourceField]] !== undefined
    ) {
      const value = row[indexMap[sourceField]];

      // 初始化数组（如果不存在）
      if (!fieldValues[targetField]) {
        fieldValues[targetField] = [];
      }

      // 添加值到对应目标字段的数组
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      ) {
        fieldValues[targetField].push(String(value).trim());
      }
    }
  }

  // 处理收集到的值
  let hasValidData = false;

  // 处理金额字段（特殊处理）
  if (fieldValues["money"] && fieldValues["money"].length > 0) {
    // 如果有多个金额字段，尝试解析第一个非零值
    for (const moneyStr of fieldValues["money"]) {
      const moneyValue =
        typeof moneyStr === "number" ? moneyStr : parseFloat(moneyStr);
      if (!isNaN(moneyValue) && moneyValue !== 0) {
        flow.money = moneyValue;
        hasValidData = true;
        break;
      }
    }
    // 如果所有值都是0，使用第一个值
    if (flow.money === undefined) {
      flow.money =
        typeof fieldValues["money"][0] === "number"
          ? fieldValues["money"][0]
          : parseFloat(fieldValues["money"][0]) || 0;
    }
  }

  // 处理其他字段（字符串拼接）
  for (const [targetField, values] of Object.entries(fieldValues)) {
    if (targetField === "money") continue; // 金额已处理

    if (values.length > 0) {
      // 将多个值用连字符连接
      const joinedValue = values.join("-");

      // 根据目标字段类型进行赋值
      if (targetField === "day") {
        flow.day = joinedValue;
      } else if (targetField === "flowType") {
        flow.flowType = joinedValue;
      } else if (targetField === "industryType") {
        flow.industryType = joinedValue;
      } else if (targetField === "payType") {
        flow.payType = joinedValue;
      } else if (targetField === "attribution") {
        flow.attribution = joinedValue;
      } else if (targetField === "name") {
        flow.name = joinedValue;
      } else if (targetField === "description") {
        flow.description = joinedValue;
      }

      hasValidData = true;
    }
  }

  // 如果没有有效数据，返回null
  return hasValidData ? flow : null;
};

const uploading = ref(false);
// 确定提交
const submitUpload = () => {
  // 待上传的流水数据
  const flows: Flow[] = [];
  flows.push(...csvFlows.value);

  if (flows.length === 0) {
    Alert.error("数据为空！");
    return;
  }

  // 存储配置
  const config = {
    fileType: fileType.value,
    fileEncoding: fileEncoding.value,
    titleRowLine: titleRowLine.value,
    targetFieldMapping: targetFieldMapping.value,
  };
  localStorage.setItem("importConfig", JSON.stringify(config));

  uploading.value = true;
  doApi
    .post("api/entry/flow/imports", {
      flows: flows,
      bookId: localStorage.getItem("bookId"),
    })
    .then((res: any) => {
      if (res && res.count > 0) {
        Alert.success("导入成功, 共导入" + res.count + "条流水");
        emits("success-callback");
        showFlowExcelImportDialog.value = false;
      } else {
        Alert.error("导入失败，请重试！");
      }
    })
    .catch(() => {
      Alert.error("导入失败，请重试！");
    })
    .finally(() => {
      uploading.value = false;
    });
};

const removeFile = () => {
  csvFlows.value = [];
  csvHeaders.value = [];
  csvDatas.value = [];
  headerIndexMap.value = {};
  return true;
};

const closeDialog = () => {
  removeFile();
  emits("close");
};

const closeCsvTableDialog = () => {
  showFlowExcelImportDialog.value = false;
};

const importSuccess = () => {
  closeCsvTableDialog();
  emits("success-callback");
};

const excelTable = ref<HTMLTableElement>();
const excelTableHead = ref<HTMLTableSectionElement>();
const excelTableBody = ref<HTMLTableSectionElement>();

// 渲染表格
const renderTable = () => {
  if (!excelTableHead.value || !excelTableBody.value) return;

  // 清空现有表格内容
  excelTableHead.value.innerHTML = "";
  excelTableBody.value.innerHTML = "";

  // 渲染表头
  const head = document.createElement("tr");
  for (let h of csvHeaders.value) {
    // 创建表头单元格元素
    const th = document.createElement("th");
    th.innerText = h;
    th.className =
      "px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600";
    th.title = h; // 添加title属性，方便鼠标悬停查看完整内容
    head.appendChild(th);
  }
  excelTableHead.value.appendChild(head);

  // 渲染表体
  for (let row of csvDatas.value) {
    // 创建行元素
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 dark:hover:bg-gray-700";

    // 部分数据字段格式化，并回显
    for (let i = 0; i < row.length; i++) {
      const cellValue = row[i];
      // 创建单元格元素
      const td = document.createElement("td");
      const displayValue = cellValue !== undefined ? String(cellValue) : "";
      td.innerText = displayValue;
      td.className =
        "px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 max-w-32 truncate";
      td.title = displayValue; // 添加title属性，方便鼠标悬停查看完整内容
      tr.appendChild(td);
    }
    excelTableBody.value.appendChild(tr);
  }

  // 确保表格可见
  showCsvTable.value = true;
};

// 恢复配置
onMounted(() => {
  const savedConfig = localStorage.getItem("importConfig");
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      fileType.value = config.fileType || fileType.value;
      fileEncoding.value = config.fileEncoding || fileEncoding.value;
      titleRowLine.value = config.titleRowLine || titleRowLine.value;
      targetFieldMapping.value = config.targetFieldMapping || {};
    } catch (e) {
      console.error("恢复配置失败", e);
    }
  }
});

const toFirstTab = () => {
  tab.value = 1;
};
const toSecondTab = () => {
  tab.value = 2;
};
const toLastTab = () => {
  tab.value = 3;
};
</script>

<style scoped>
.excel-table {
  border-collapse: collapse;
  width: 100%;
}

.excel-table th,
.excel-table td {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar,
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track,
.overflow-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.overflow-y-auto::-webkit-scrollbar-thumb,
.overflow-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover,
.overflow-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
