<template>
  <!-- 导入导出抽屉 -->
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-start z-50"
    @click="$emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 w-full max-w-md h-full flex flex-col shadow-xl transform transition-transform"
      @click.stop
    >
      <!-- 标题栏 -->
      <div
        class="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center"
      >
        <h3 class="text-lg font-semibold text-green-950 dark:text-white">
          导入导出
        </h3>
        <button
          @click="$emit('close')"
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

      <!-- 功能列表 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <!-- 账单导入 -->
        <div
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <h4
            class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            三方账单导入
            <button
              @click.stop="showThirdPartyHelp"
              class="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-blue-600 dark:text-blue-400"
              title="帮助"
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
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </button>
          </h4>
          <div class="space-y-2">
            <button
              @click="$emit('importAlipay')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              ]"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              支付宝账单
            </button>
            <button
              @click="$emit('importWechat')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              ]"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              微信账单
            </button>
            <button
              @click="$emit('importJd')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
              ]"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              京东金融账单
            </button>
          </div>
        </div>

        <!-- 自定义导入 -->
        <div
          class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
        >
          <h4
            class="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            数据导入
          </h4>
          <div class="space-y-2">
            <button
              @click="$emit('customImport')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
              ]"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              导入CSV
            </button>
            <button
              @click="$emit('importJson')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer'
              ]"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              导入JSON
            </button>
          </div>
        </div>

        <!-- 数据导出 -->
        <div
          class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <h4
            class="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            数据导出
          </h4>
          <div class="space-y-2">
            <button
              @click="$emit('exportCsv')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
              ]"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3M4 7h16"
                />
              </svg>
              导出CSV
            </button>
            <button
              @click="$emit('exportJson')"
              :disabled="isImporting"
              :class="[
                'w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2',
                isImporting
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer'
              ]"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3M4 7h16"
                />
              </svg>
              导出JSON
            </button>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div
        class="px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p class="flex items-center gap-1">
            <svg
              class="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            支持CSV、JSON格式导入导出
          </p>
          <p class="flex items-center gap-1">
            <svg
              class="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            可配置类型映射实现自动转换
          </p>
        </div>
      </div>
    </div>

    <!-- 三方账单导入帮助对话框 -->
    <ThirdPartyImportHelpDialog
      :show="showHelpDialog"
      @close="closeHelpDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ThirdPartyImportHelpDialog from "~/components/dialog/ThirdPartyImportHelpDialog.vue";

interface Props {
  show: boolean;
  isImporting?: boolean;
}

const props = defineProps<Props>();

const showHelpDialog = ref(false);

// 显示三方账单导入帮助
const showThirdPartyHelp = () => {
  showHelpDialog.value = true;
};

const closeHelpDialog = () => {
  showHelpDialog.value = false;
};

defineEmits<{
  close: [];
  importAlipay: [];
  importWechat: [];
  importJd: [];
  customImport: [];
  importJson: [];
  exportJson: [];
  exportCsv: [];
}>();
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
