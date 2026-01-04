<script setup lang="ts">
definePageMeta({
  layout: "public",
  middleware: ["auth"],
});

import { ref } from "vue";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline";
import ThirdPartyImportHelpDialog from "~/components/dialog/ThirdPartyImportHelpDialog.vue";

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: string[];
  keywords: string[];
}

const sections: HelpSection[] = [
  {
    id: "calendar",
    title: "账本日历",
    icon: CalendarDaysIcon,
    keywords: ["日历", "日期", "记账", "添加", "预算"],
    content: [
      "账本日历是您记录日常收支的主要入口。",
      "点击日期可以查看当天的流水记录。",
      "点击日期右上方的加号按钮可以快速添加收入或支出。",
      "在编辑对话框中，带*号的字段为必填项。",
      "收入使用绿色显示，支出使用红色显示。",
      "在当月分析按钮旁边，可以查看本月预算剩余百分比，点击预算提示可以查看和修改本月预算。",
    ],
  },
  {
    id: "analysis",
    title: "数据分析",
    icon: ChartBarIcon,
    keywords: ["分析", "统计", "图表", "数据", "趋势"],
    content: [
      "数据分析页面提供多种图表来帮助您了解收支情况。",
      "每月流水统计以柱状图形式展示，每次最多显示6个月的数据，使用左右箭头可以翻页查看其他月份的数据。",
      "每日流水曲线以折线图形式展示，可以拖动查看不同时间段。",
      "收支类型分析以饼图和柱状图展示，帮助您了解各类收支的占比。"
    ],
  },
  {
    id: "flows",
    title: "流水管理",
    icon: CurrencyDollarIcon,
    keywords: ["流水", "记录", "导入", "导出", "筛选", "排序", "合并", "AI", "智能识别"],
    content: [
      "流水管理页面可以查看、编辑、删除所有流水记录。",
      "点击筛选按钮可以按类型、日期、金额等条件筛选流水。",
      "点击选择按钮可以进入选择模式，进行批量操作。",
      "在选择模式下，可以批量删除、修改类型或合并多条记录。",
      "支持按日期或金额排序，点击表头的日期或金额列即可切换排序。",
      "多条相关记录可以合并为一条，合并后的记录可以展开查看详情。",
      "合并记录的主记录有独立的字段，可以单独编辑，时间字段由子记录自动计算。在统计时，合并记录只统计主记录，子记录不计入总统计。",
      "支持导入支付宝、微信、京东平台的账单。",
      "AI识别可以自动将\"商户消费\"等类型识别为\"饮食\"、\"交通\"等更准确的分类。",
    ],
  },
];

const searchQuery = ref("");
const expandedSections = ref<Set<string>>(new Set(sections.map((s) => s.id)));
const showThirdPartyHelp = ref(false);

// 过滤后的章节
const filteredSections = computed(() => {
  if (!searchQuery.value.trim()) {
    return sections;
  }

  const query = searchQuery.value.toLowerCase();
  return sections.filter((section) => {
    // 搜索标题
    if (section.title.toLowerCase().includes(query)) {
      return true;
    }
    // 搜索关键词
    if (section.keywords.some((kw) => kw.toLowerCase().includes(query))) {
      return true;
    }
    // 搜索内容
    if (section.content.some((c) => c.toLowerCase().includes(query))) {
      return true;
    }
    return false;
  });
});

// 高亮搜索关键词
const highlightText = (text: string) => {
  if (!searchQuery.value.trim()) {
    return text;
  }

  const query = searchQuery.value.trim();
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
};

// 切换展开/折叠
const toggleSection = (sectionId: string) => {
  if (expandedSections.value.has(sectionId)) {
    expandedSections.value.delete(sectionId);
  } else {
    expandedSections.value.add(sectionId);
  }
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = "";
};
</script>

<template>
  <div class="min-h-screen bg-green-50 dark:bg-black p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
      <!-- 标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          帮助中心
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          了解如何使用 青葱记账 的各项功能
        </p>
      </div>

      <!-- 搜索框 -->
      <div class="mb-6">
        <div class="relative">
          <MagnifyingGlassIcon
            class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索帮助内容..."
            class="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- 搜索结果提示 -->
      <div
        v-if="searchQuery && filteredSections.length === 0"
        class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
      >
        <p class="text-yellow-800 dark:text-yellow-200">
          未找到相关帮助内容，请尝试其他关键词。
        </p>
      </div>

      <!-- 帮助章节 -->
      <div class="space-y-4">
        <div
          v-for="section in filteredSections"
          :key="section.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <!-- 章节标题 -->
          <button
            @click="toggleSection(section.id)"
            class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <component
                :is="section.icon"
                class="h-6 w-6 text-green-600 dark:text-green-400"
              />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ section.title }}
              </h2>
            </div>
            <ChevronDownIcon
              :class="[
                'h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform',
                expandedSections.has(section.id) ? 'rotate-180' : '',
              ]"
            />
          </button>

          <!-- 章节内容 -->
          <div
            v-show="expandedSections.has(section.id)"
            class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700"
          >
            <ul class="mt-4 space-y-3">
              <li
                v-for="(item, index) in section.content"
                :key="index"
                class="flex items-start gap-3 text-gray-700 dark:text-gray-300"
              >
                <span
                  class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-semibold mt-0.5"
                >
                  {{ index + 1 }}
                </span>
                <span
                  class="flex-1 leading-relaxed"
                  v-html="highlightText(item)"
                ></span>
              </li>
            </ul>
            
            <!-- 流水管理部分添加AI识别说明和三方账单导入帮助按钮 -->
            <div
              v-if="section.id === 'flows'"
              class="mt-4 space-y-3"
            >
              <!-- AI识别功能说明卡片 -->
              <div class="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">
                      AI智能识别功能
                    </h3>
                    <p class="text-xs text-purple-600 dark:text-purple-400 mb-2">
                      导入三方账单时，系统会自动识别交易类型，将"商户消费"等转换为"饮食"、"交通"等准确分类。
                    </p>
                    <div class="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-purple-100 dark:border-purple-800">
                      <img
                        src="/help_imgs/ai_reco.png"
                        alt="AI智能识别对话框"
                        class="w-full max-w-md mx-auto rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 三方账单导入教程按钮 -->
              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                      三方账单导入教程
                    </h3>
                    <p class="text-xs text-blue-600 dark:text-blue-400">
                      查看微信、支付宝、京东金融账单导入详细步骤
                    </p>
                  </div>
                  <button
                    @click="showThirdPartyHelp = true"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <QuestionMarkCircleIcon class="w-4 h-4" />
                    查看教程
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!searchQuery && sections.length === 0"
        class="text-center py-12 text-gray-500 dark:text-gray-400"
      >
        <p>暂无帮助内容</p>
      </div>
    </div>

    <!-- 三方账单导入帮助对话框 -->
    <ThirdPartyImportHelpDialog
      :show="showThirdPartyHelp"
      @close="showThirdPartyHelp = false"
    />
  </div>
</template>


<style scoped>
mark {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>

