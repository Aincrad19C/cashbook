<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div
      v-if="currentStep >= 0 && currentStep < steps.length"
      class="fixed inset-0 z-[9998] bg-black/50 transition-opacity"
      @click="nextStep"
    ></div>

    <!-- 引导气泡 -->
    <div
      v-if="currentStep >= 0 && currentStep < steps.length"
      :style="tooltipStyle"
      class="fixed z-[9999] transition-all duration-300"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm border-2 border-green-500"
      >
        <!-- 标题和步骤指示 -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {{ steps[currentStep].title }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              步骤 {{ currentStep + 1 }} / {{ steps.length }}
            </p>
          </div>
          <button
            @click="skipGuide"
            class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="跳过引导"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>

        <!-- 内容 -->
        <p class="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
          {{ steps[currentStep].content }}
        </p>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-between gap-2">
          <button
            v-if="currentStep > 0"
            @click="prevStep"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            上一步
          </button>
          <div class="flex-1"></div>
          <button
            v-if="currentStep < steps.length - 1"
            @click="nextStep"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            下一步
          </button>
          <button
            v-else
            @click="finishGuide"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>

      <!-- 箭头指示 -->
      <div
        v-if="steps[currentStep].arrow"
        :class="[
          'absolute w-0 h-0 border-8 border-transparent',
          steps[currentStep].arrow === 'top' && 'bottom-full left-1/2 -translate-x-1/2 border-b-green-500',
          steps[currentStep].arrow === 'bottom' && 'top-full left-1/2 -translate-x-1/2 border-t-green-500',
          steps[currentStep].arrow === 'left' && 'right-full top-1/2 -translate-y-1/2 border-r-green-500',
          steps[currentStep].arrow === 'right' && 'left-full top-1/2 -translate-y-1/2 border-l-green-500',
        ]"
      ></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";

interface GuideStep {
  target: string; // CSS 选择器
  title: string;
  content: string;
  arrow?: "top" | "bottom" | "left" | "right";
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const props = defineProps<{
  steps: GuideStep[];
  visible: boolean;
}>();

const emit = defineEmits<{
  finish: [];
  skip: [];
}>();

const currentStep = ref(-1);
const tooltipStyle = ref<Record<string, string>>({});

// 计算气泡位置
const calculatePosition = (step: GuideStep) => {
  const targetElement = document.querySelector(step.target);
  if (!targetElement) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const rect = targetElement.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  const position = step.position || "bottom";
  const spacing = 20;

  let top = 0;
  let left = 0;
  let transform = "";

  switch (position) {
    case "top":
      top = rect.top + scrollY - spacing;
      left = rect.left + scrollX + rect.width / 2;
      transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      top = rect.bottom + scrollY + spacing;
      left = rect.left + scrollX + rect.width / 2;
      transform = "translate(-50%, 0)";
      break;
    case "left":
      top = rect.top + scrollY + rect.height / 2;
      left = rect.left + scrollX - spacing;
      transform = "translate(-100%, -50%)";
      break;
    case "right":
      top = rect.top + scrollY + rect.height / 2;
      left = rect.right + scrollX + spacing;
      transform = "translate(0, -50%)";
      break;
    case "center":
      top = rect.top + scrollY + rect.height / 2;
      left = rect.left + scrollX + rect.width / 2;
      transform = "translate(-50%, -50%)";
      break;
  }

  // 确保气泡不超出视口
  const maxWidth = 384; // max-w-sm
  const maxHeight = 300;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < spacing) {
    left = spacing;
    transform = transform.replace(/translateX\([^)]+\)/, "translateX(0)");
  } else if (left + maxWidth > viewportWidth - spacing) {
    left = viewportWidth - maxWidth - spacing;
    transform = transform.replace(/translateX\([^)]+\)/, "translateX(0)");
  }

  if (top < spacing) {
    top = spacing;
    transform = transform.replace(/translateY\([^)]+\)/, "translateY(0)");
  } else if (top + maxHeight > viewportHeight - spacing) {
    top = viewportHeight - maxHeight - spacing;
    transform = transform.replace(/translateY\([^)]+\)/, "translateY(0)");
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform,
  };
};

// 高亮目标元素
const highlightTarget = (step: GuideStep) => {
  // 移除之前的高亮
  document.querySelectorAll(".guide-highlight").forEach((el) => {
    el.classList.remove("guide-highlight");
    (el as HTMLElement).style.zIndex = "";
  });

  const targetElement = document.querySelector(step.target);
  if (targetElement) {
    targetElement.classList.add("guide-highlight");
    (targetElement as HTMLElement).style.zIndex = "9997";
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }
};

// 下一步
const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++;
    updateStep();
  } else {
    finishGuide();
  }
};

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    updateStep();
  }
};

// 更新步骤
const updateStep = () => {
  if (currentStep.value >= 0 && currentStep.value < props.steps.length) {
    const step = props.steps[currentStep.value];
    // 等待 DOM 更新
    nextTick(() => {
      highlightTarget(step);
      tooltipStyle.value = calculatePosition(step);
    });
  }
};

// 完成引导
const finishGuide = () => {
  currentStep.value = -1;
  // 移除高亮
  document.querySelectorAll(".guide-highlight").forEach((el) => {
    el.classList.remove("guide-highlight");
    (el as HTMLElement).style.zIndex = "";
  });
  emit("finish");
};

// 跳过引导
const skipGuide = () => {
  finishGuide();
  emit("skip");
};

// 监听 visible 变化
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.steps.length > 0) {
      currentStep.value = 0;
      updateStep();
    } else {
      currentStep.value = -1;
    }
  },
  { immediate: true }
);

// 监听窗口大小变化，重新计算位置
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    if (currentStep.value >= 0 && currentStep.value < props.steps.length) {
      const step = props.steps[currentStep.value];
      tooltipStyle.value = calculatePosition(step);
    }
  });

  window.addEventListener("scroll", () => {
    if (currentStep.value >= 0 && currentStep.value < props.steps.length) {
      const step = props.steps[currentStep.value];
      tooltipStyle.value = calculatePosition(step);
    }
  });
}
</script>

<style scoped>
:global(.guide-highlight) {
  position: relative;
  outline: 3px solid #10b981 !important;
  outline-offset: 2px;
  border-radius: 4px;
  background-color: rgba(16, 185, 129, 0.1) !important;
}
</style>

