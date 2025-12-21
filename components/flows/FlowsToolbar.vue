<template>
  <div
    class="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-2 md:mb-4"
  >
    <!-- 第一行：主要操作按钮 - 桌面端水平排列，手机端垂直堆叠 -->
    <div class="flex flex-col md:flex-row md:justify-between gap-2">
      <div class="flex flex-wrap gap-2">
        <button
          @click="$emit('openImportExport')"
          class="flex-1 md:flex-none px-2 py-1 md:px-3 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <CloudArrowDownIcon class="w-4 h-4" />
          <span class="hidden sm:inline">导入导出</span>
          <span class="sm:hidden">导入</span>
        </button>
        <button
          @click="$emit('createNew')"
          class="flex-1 md:flex-none px-2 py-1 md:px-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <PlusIcon class="w-4 h-4" />
          新增
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-2">
        <!-- 选择模式按钮 -->
        <div v-if="!isSelectionMode" class="flex gap-2">
          <button
            @click="$emit('enterSelectionMode')"
            class="flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <CheckIcon class="w-4 h-4" />
            选择
          </button>
        </div>

        <!-- 批量操作 - 选择模式下显示 -->
        <div v-if="isSelectionMode" class="flex gap-2">
          <button
            @click="$emit('exitSelectionMode')"
            class="flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <XMarkIcon class="w-4 h-4" />
            取消
          </button>
          <button
            @click="$emit('deleteSelected')"
            :disabled="selectedCount === 0"
            :class="[
              'flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium',
              selectedCount > 0
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-60'
            ]"
          >
            <TrashIcon class="w-4 h-4" />
            <span class="hidden sm:inline">删除选中{{ selectedCount > 0 ? `(${selectedCount})` : '' }}</span>
            <span class="sm:hidden">删除{{ selectedCount > 0 ? `(${selectedCount})` : '' }}</span>
          </button>
          <button
            @click="$emit('batchChangeType')"
            :disabled="selectedCount === 0"
            :class="[
              'flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium',
              selectedCount > 0
                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-60'
            ]"
          >
            <PencilSquareIcon class="w-4 h-4" />
            <span class="hidden sm:inline">类型修改{{ selectedCount > 0 ? `(${selectedCount})` : '' }}</span>
            <span class="sm:hidden">修改{{ selectedCount > 0 ? `(${selectedCount})` : '' }}</span>
          </button>
          <button
            @click="$emit('mergeSelected')"
            :disabled="selectedCount < 2"
            :class="[
              'flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium',
              selectedCount >= 2
                ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-60'
            ]"
          >
            <ArrowsPointingInIcon class="w-4 h-4" />
            <span class="hidden sm:inline">合并{{ selectedCount >= 2 ? `(${selectedCount})` : '' }}</span>
            <span class="sm:hidden">合并{{ selectedCount >= 2 ? `(${selectedCount})` : '' }}</span>
          </button>
        </div>

        <!-- 筛选操作 -->
        <div class="flex gap-2">
          <button
            @click="$emit('openSearch')"
            :class="[
              'flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium',
              hasFilters
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            ]"
          >
            <FunnelIcon class="w-4 h-4" />
            筛选
          </button>
          <button
            @click="$emit('resetQuery')"
            class="flex-1 sm:flex-none px-2 py-1 md:px-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <ArrowPathIcon class="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CloudArrowDownIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsPointingInIcon,
} from "@heroicons/vue/24/outline";

interface Props {
  selectedCount: number;
  isSelectionMode: boolean;
  hasFilters?: boolean;
}

defineProps<Props>();

defineEmits<{
  openImportExport: [];
  createNew: [];
  enterSelectionMode: [];
  exitSelectionMode: [];
  deleteSelected: [];
  batchChangeType: [];
  mergeSelected: [];
  openSearch: [];
  resetQuery: [];
}>();
</script>
