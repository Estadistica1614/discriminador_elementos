<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-bold transition-all duration-150 rounded-xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
    :class="variantClasses"
    @click="$emit('click', $event)"
  >
    <svg 
      v-if="loading" 
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot name="icon-left"></slot>
    <span>{{ text }}</span>
    <slot></slot>
    <slot name="icon-right"></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'button'
  },
  variant: {
    type: String,
    default: 'primary',
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-[#17365D] hover:bg-[#002244] text-white focus:ring-[#17365D] shadow-indigo-900/10';
    case 'secondary':
      return 'bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400';
    case 'success':
      return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-emerald-900/10';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-900/10';
    case 'gold':
      return 'bg-[#E6C027] hover:bg-[#d4b020] text-slate-900 focus:ring-[#E6C027]';
    case 'ghost':
      return 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none';
    default:
      return 'bg-[#17365D] hover:bg-[#002244] text-white focus:ring-[#17365D]';
  }
});
</script>
