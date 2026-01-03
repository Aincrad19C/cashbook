<script setup lang="ts">
import {
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline";

interface Menu {
  title: string;
  icon?: any;
  color?: string;
  path?: string;
  children?: Menu[];
}

interface Props {
  isOpen: boolean;
  isMobile: boolean;
  currentPath: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  navigate: [path: string];
}>();

// 直接使用主题管理
const { isDark, toggleTheme } = useAppTheme();

const items: Menu[] = [
  {
    title: "账本日历",
    path: "calendar",
    icon: CalendarDaysIcon,
    color: "text-green-500",
  },
  {
    title: "数据分析",
    path: "analysis",
    icon: ChartBarIcon,
    color: "text-purple-500",
  },
  {
    title: "流水管理",
    path: "flows",
    icon: CurrencyDollarIcon,
    color: "text-green-500",
  },
  {
    title: "帮助中心",
    path: "help",
    icon: QuestionMarkCircleIcon,
    color: "text-blue-500",
  },
];

const handleNavigate = (menu: Menu) => {
  emit("navigate", menu.path || "calendar");
  // navigateTo({ path: `/${menu.path}` });
  if (props.isMobile) {
    emit("close");
  }
};
</script>

<template>
  <!-- Mobile backdrop -->
  <div
    v-if="isMobile && isOpen"
    @click="emit('close')"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r-2 border-green-400 dark:border-green-500 transform transition-transform duration-200 ease-in-out',
      isMobile
        ? isOpen
          ? 'translate-x-0'
          : '-translate-x-full'
        : 'translate-x-0',
      !isMobile && 'lg:relative lg:translate-x-0 h-full',
    ]"
  >
    <div class="flex flex-col h-full bg-green-100 dark:bg-green-950/30">
      <!-- Mobile header -->
      <div
        v-if="isMobile"
        class="flex items-center justify-between p-4 border-b border-green-100 dark:border-green-900"
      >
        <div class="flex items-center">
          <img src="/logo.png" alt="Cashbook" class="h-8 w-8" />
          <span class="ml-2 text-lg font-bold text-green-500">Cashbook</span>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-green-200 dark:hover:bg-green-800"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <button
          v-for="item in items"
          :key="item.path"
          :data-guide="`sidebar-${item.path}`"
          @click="handleNavigate(item)"
          :class="[
            'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ease-out',
            'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
            currentPath === item.path
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 shadow-sm'
              : 'text-gray-700 dark:text-gray-200 hover:bg-green-200 dark:hover:bg-green-800 active:scale-[0.98]',
          ]"
        >
          <!-- 激活态左侧竖条 -->
          <div
            v-if="currentPath === item.path"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-600 dark:bg-green-500 rounded-r-full"
          ></div>
          <!-- 图标容器 -->
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
              currentPath === item.path
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-transparent group-hover:bg-green-100/50 dark:group-hover:bg-green-800/50',
            ]"
          >
            <component
              v-if="item.icon !== 'string'"
              :is="item.icon"
              :class="[
                'h-4 w-4 flex-shrink-0 transition-colors duration-200',
                currentPath === item.path
                  ? 'text-green-600 dark:text-green-400'
                  : item.color + ' dark:opacity-80',
              ]"
            >
            </component>
            <i
              v-else
              :class="[
                item.icon,
                'text-base flex-shrink-0',
                currentPath === item.path
                  ? 'text-green-600 dark:text-green-400'
                  : item.color + ' dark:opacity-80',
              ]"
            ></i>
          </div>
          <span class="text-sm font-medium flex-1">{{ item.title }}</span>
        </button>
      </nav>

      <!-- Theme toggle -->
      <div class="px-4 py-3 border-t border-green-100 dark:border-green-900 bg-white dark:bg-black">
        <button
          @click="toggleTheme"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-green-200 dark:hover:bg-green-800 active:scale-95 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <SunIcon v-if="!isDark" class="h-4 w-4 text-amber-500" />
          <MoonIcon v-else class="h-4 w-4 text-green-400" />
          <span class="text-xs">{{ isDark ? "深色模式" : "浅色模式" }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
