<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "primary" | "secondary" | "tertiary" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
  iconPosition: "left",
  fullWidth: false,
  type: "button",
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const baseClasses = computed(() => {
  return [
    "inline-flex items-center justify-center gap-2 font-medium rounded-button",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none",
    props.fullWidth ? "w-full" : "",
  ];
});

const variantClasses = computed(() => {
  const variants = {
    primary: [
      "bg-primary-600 text-white shadow-button",
      "hover:bg-primary-700 hover:shadow-button-hover hover:-translate-y-0.5",
      "active:bg-primary-800 active:translate-y-0",
      "focus:ring-primary-500",
      "dark:bg-primary-600 dark:hover:bg-primary-700 dark:active:bg-primary-800",
    ],
    secondary: [
      "bg-white text-primary-600 border border-primary-600",
      "hover:bg-primary-50 active:bg-primary-100",
      "focus:ring-primary-500",
      "dark:bg-gray-800 dark:text-primary-400 dark:border-primary-500 dark:hover:bg-primary-900/20 dark:active:bg-primary-900/30",
    ],
    tertiary: [
      "text-gray-600",
      "hover:bg-gray-50 active:bg-gray-100",
      "focus:ring-gray-500",
      "dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700",
    ],
    destructive: [
      "text-expense-500",
      "hover:bg-expense-50 active:bg-expense-100",
      "focus:ring-expense-500",
      "dark:text-expense-400 dark:hover:bg-expense-900/20 dark:active:bg-expense-900/30",
    ],
  };
  return variants[props.variant];
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };
  return sizes[props.size];
});

const buttonClasses = computed(() => {
  return [
    ...baseClasses.value,
    ...variantClasses.value,
    ...sizeClasses.value,
  ].join(" ");
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit("click", event);
  }
};
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <!-- Icon (left) -->
    <component
      v-else-if="icon && iconPosition === 'left'"
      :is="icon"
      class="h-4 w-4"
    />
    <!-- Slot content -->
    <span v-if="loading">处理中...</span>
    <slot v-else />
    <!-- Icon (right) -->
    <component
      v-if="icon && iconPosition === 'right' && !loading"
      :is="icon"
      class="h-4 w-4"
    />
  </button>
</template>

