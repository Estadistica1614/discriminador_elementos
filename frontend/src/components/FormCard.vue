<template>
  <div 
    class="bg-white rounded-2xl shadow-md border border-slate-200/80 p-4 sm:p-6 transition-all duration-200"
    :class="customClass"
  >
    <div v-if="title || $slots.header" class="mb-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
      <div v-if="title" class="flex items-center gap-2">
        <slot name="icon"></slot>
        <h2 class="text-base sm:text-lg font-bold text-[#003366]">{{ title }}</h2>
      </div>
      <slot name="header"></slot>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  customClass: {
    type: String,
    default: ''
  }
});
</script>
