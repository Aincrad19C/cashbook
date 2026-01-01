<script setup lang="ts">
import {
  showSetConvertDialog,
  showChangePasswordDialog,
} from "~/utils/flag";
import { SystemConfig, GlobalUserInfo } from "~/utils/store";
import { getUserInfo, doApi } from "~/utils/api";
import type { Book } from "~/utils/table";
import UserGuide from "~/components/guide/UserGuide.vue";

// Responsive state
const isMobile = ref(false);

// Sidebar state
const sidebarOpen = ref(false);

// Loading state for page transitions
const pageLoading = ref(false);

// User state
const route = useRoute();
const openMenu = computed(() => route.path.slice(1) || "calendar");

// 新手引导
const showGuide = ref(false);
const guideSteps = [
  {
    target: '[data-guide="sidebar-calendar"]',
    title: "欢迎使用 Cashbook！",
    content: "这是账本日历，您可以在这里查看和记录每天的收支情况。点击日期可以查看当天的流水，点击加号可以快速添加记录。",
    position: "right" as const,
    arrow: "left" as const,
  },
  {
    target: '[data-guide="sidebar-analysis"]',
    title: "数据分析",
    content: "在数据分析页面，您可以查看各种图表来了解收支趋势和分类统计，帮助您更好地管理财务。",
    position: "right" as const,
    arrow: "left" as const,
  },
  {
    target: '[data-guide="sidebar-flows"]',
    title: "流水管理",
    content: "流水管理页面可以查看所有流水记录，支持筛选、排序、批量操作和导入导出功能。",
    position: "right" as const,
    arrow: "left" as const,
  },
  {
    target: '[data-guide="sidebar-help"]',
    title: "帮助中心",
    content: "遇到问题？点击帮助中心可以查看详细的使用说明和常见问题解答。",
    position: "right" as const,
    arrow: "left" as const,
  },
];

// Watch route changes to show loading
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      pageLoading.value = true;
      // Hide loading after a short delay to allow page to render
      setTimeout(() => {
        pageLoading.value = false;
      }, 500);
    }
  }
);

// Responsive functions
const updateResponsive = () => {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 1024;
    if (!isMobile.value) {
      sidebarOpen.value = false;
    }
  }
};

onMounted(async () => {
  // Initialize responsive
  if (typeof window !== "undefined") {
    updateResponsive();
    window.addEventListener("resize", updateResponsive);
  }

  // 只有当 GlobalUserInfo 不存在时才调用 getUserInfo
  if (!GlobalUserInfo.value) {
    getUserInfo();
  }

  // 自动获取用户的唯一账本并设置到 localStorage
  // 如果用户没有账本，API 会自动创建一个默认账本
  // 使用 await 确保在页面组件加载之前 bookId 已经设置好
  let bookId = localStorage.getItem("bookId");
  if (!bookId) {
    try {
      const books = await doApi.post<Book[]>("api/entry/book/list", {});
      if (books && books.length > 0) {
        // 用户只有一个账本（默认账本），直接使用第一个
        const book = books[0];
        bookId = book.bookId;
        localStorage.setItem("bookId", book.bookId);
        localStorage.setItem("bookName", book.bookName);
      }
    } catch (err) {
      console.error("获取账本失败:", err);
    }
  }

  // 检查是否是首次登录，如果是则显示新手引导
  if (bookId) {
    try {
      const isFirstTime = await doApi.get<boolean>(
        `api/entry/user/isFirstTime?bookId=${bookId}`
      );
      // 检查是否已经完成过引导（使用 localStorage 标记）
      const guideCompleted = localStorage.getItem("guide_completed");
      if (isFirstTime && !guideCompleted) {
        // 延迟显示引导，等待页面渲染完成
        setTimeout(() => {
          showGuide.value = true;
        }, 1000);
      }
    } catch (err) {
      console.error("检查首次登录状态失败:", err);
    }
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateResponsive);
  }
});

// Navigation methods
const logout = () => {
  pageLoading.value = true;
  localStorage.removeItem("bookId");
  localStorage.removeItem("bookName");
  doApi.get("api/logout").then(() => {
    Alert.success("退出登录");
    setTimeout(() => {
      navigateTo("/login");
    }, 100);
  });
};

const navigateToPath = (path: string) => {
  pageLoading.value = true;
  navigateTo({ path: `/${path}` });
};

const openConvertDialog = () => {
  showSetConvertDialog.value = true;
};

const openChangePasswordDialog = () => {
  showChangePasswordDialog.value = true;
};
</script>

<template>
  <Head>
    <Title>{{ SystemConfig?.title }}</Title>
    <Meta name="description" :content="SystemConfig?.description" />
    <Meta
      name="keywords"
      :content="`Cashbook,记账本,私人记账,开源账本,dingdangdog,月上老狗,${SystemConfig?.keywords}`"
    />
  </Head>

  <div class="h-screen p-0 m-0 overflow-hidden">
    <!-- Header -->
    <LayoutAppHeader
      :is-mobile="isMobile"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
      @logout="logout"
      @open-convert-dialog="openConvertDialog"
      @open-change-password-dialog="openChangePasswordDialog"
    />

    <div
      class="flex relative"
      style="height: calc(100vh - 64px)"
      :class="{ 'pb-12': isMobile }"
    >
      <!-- Sidebar - Desktop -->
      <div v-if="!isMobile" class="w-64 flex-shrink-0 h-full overflow-y-auto">
        <LayoutAppSidebar
          :is-open="true"
          :is-mobile="false"
          :current-path="openMenu"
          @navigate="navigateToPath"
        />
      </div>

      <!-- Sidebar - Mobile -->
      <LayoutAppSidebar
        v-if="isMobile"
        :is-open="sidebarOpen"
        :is-mobile="true"
        :current-path="openMenu"
        @close="sidebarOpen = false"
        @navigate="navigateToPath"
      />

      <!-- Main Content -->
      <main
        class="flex-1 h-full overflow-y-auto bg-green-50 dark:bg-black transition-colors duration-200 relative"
      >
        <!-- Loading Overlay -->
        <div
          v-if="pageLoading"
          class="absolute inset-0 bg-white/80 dark:bg-green-900/10 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div class="flex flex-col items-center space-y-4">
            <!-- Spinner -->
            <div class="relative">
              <div
                class="w-12 h-12 border-4 border-green-300 dark:border-green-600 rounded-full animate-spin"
              ></div>
              <div
                class="w-12 h-12 border-4 border-transparent border-t-green-500 rounded-full animate-spin absolute top-0 left-0"
              ></div>
            </div>
            <!-- Loading Text -->
            <div class="text-sm text-green-600 dark:text-green-300 font-medium">
              页面加载中...
            </div>
          </div>
        </div>

        <!-- Page Content -->
        <div :class="{ 'opacity-75': pageLoading }">
          <slot></slot>
        </div>
      </main>
    </div>

    <!-- Bottom Navigation - Mobile Only -->
    <LayoutAppBottomNav
      v-if="isMobile"
      :current-path="openMenu"
      @navigate="navigateToPath"
    />

    <!-- Global Components -->
    <GlobalConfirm />

    <!-- Dialogs -->
    <DialogSetConvertDialog v-if="showSetConvertDialog" />
    <DialogChangePasswordDialog v-if="showChangePasswordDialog" />

    <!-- 新手引导 -->
    <UserGuide
      :steps="guideSteps"
      :visible="showGuide"
      @finish="
        showGuide = false;
        localStorage.setItem('guide_completed', 'true');
      "
      @skip="
        showGuide = false;
        localStorage.setItem('guide_completed', 'true');
      "
    />
  </div>
</template>

