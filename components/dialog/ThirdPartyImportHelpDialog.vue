<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeDialog"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- 标题栏 -->
      <div
        class="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          三方账单导入教程
        </h2>
        <button
          @click="closeDialog"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- 平台选择标签 -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex gap-2">
        <button
          v-for="platform in platforms"
          :key="platform.id"
          @click="currentPlatform = platform.id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentPlatform === platform.id
              ? platform.activeClass
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ platform.name }}
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <!-- 微信导入教程 -->
        <div v-if="currentPlatform === 'wechat'" class="space-y-6">
          <div class="text-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              微信账单导入教程
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              按照以下步骤导出微信账单CSV文件
            </p>
          </div>

          <!-- 步骤1 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                打开微信，进入"我" → "服务" → "钱包"，点击“账单”
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat1.jpg"
                alt="微信钱包入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤2 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                进入"账单"页面，点击右上角“. . .”
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat2.jpg"
                alt="微信账单入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤3 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择"下载账单"
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat3.jpg"
                alt="微信导出账单入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤4 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择“用于个人对账”
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat4.jpg"
                alt="微信选择导出时间"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤5 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择账单时间
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat5.jpg"
                alt="微信选择CSV格式"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤6 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                6
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                点击“查看详情”，下载并保存CSV文件
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/wechat6.jpg"
                alt="微信下载CSV文件"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        <!-- 支付宝导入教程 -->
        <div v-if="currentPlatform === 'alipay'" class="space-y-6">
          <div class="text-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              支付宝账单导入教程
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              按照以下步骤导出支付宝账单CSV文件
            </p>
          </div>

          <!-- 步骤1 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                打开支付宝，进入"我的" → "账单"
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay1.jpg"
                alt="支付宝账单入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤2 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                点击右上角”. . .“
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay2.jpg"
                alt="支付宝筛选入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤3 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择"开具交易流水证明"
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay3.jpg"
                alt="支付宝导出账单"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤4 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择“用于个人对账”
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay4.jpg"
                alt="支付宝选择时间范围"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤5 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择交易类型、时间范围
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay5.jpg"
                alt="支付宝确认CSV格式"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤6 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                6
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                填写邮箱，接受文件
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/alipay6.jpg"
                alt="支付宝下载CSV文件"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        <!-- 京东金融导入教程 -->
        <div v-if="currentPlatform === 'jingdong'" class="space-y-6">
          <div class="text-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              京东金融账单导入教程
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              按照以下步骤导出京东金融账单CSV文件
            </p>
          </div>

          <!-- 步骤1 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                进入"我的" → "我的账单"
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/jingdong1.jpg"
                alt="京东金融账单入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤2 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                点击右上角". . ."
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/jingdong2.jpg"
                alt="京东金融导出入口"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤3 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                选择账单导出
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/jingdong3.jpg"
                alt="京东金融选择导出设置"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>

          <!-- 步骤4 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <h4 class="text-base font-semibold text-gray-900 dark:text-white">
                填写邮箱，确认导出
              </h4>
            </div>
            <div class="ml-10">
              <img
                src="/help_imgs/jingdong4.jpg"
                alt="京东金融下载CSV文件"
                class="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
        <div class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg
            class="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500"
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
          <div>
            <p class="font-medium mb-1">温馨提示：</p>
            <ul class="list-disc list-inside space-y-1">
              <li>导出的CSV文件请妥善保管，包含个人财务信息</li>
              <li>导入前请确保CSV文件格式正确，未被修改</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";

interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const currentPlatform = ref<"wechat" | "alipay" | "jingdong">("wechat");

const platforms = [
  {
    id: "wechat" as const,
    name: "微信",
    activeClass: "bg-green-600 text-white",
  },
  {
    id: "alipay" as const,
    name: "支付宝",
    activeClass: "bg-blue-600 text-white",
  },
  {
    id: "jingdong" as const,
    name: "京东金融",
    activeClass: "bg-red-600 text-white",
  },
];

const closeDialog = () => {
  emit("close");
};
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
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

