<template>
  <div class="w-full relative" ref="containerRef">
    <!-- Barra de Búsqueda Principal -->
    <div class="flex flex-col sm:flex-row gap-2.5 items-stretch">
      <div class="relative flex-1">
        <!-- Icono de Búsqueda -->
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Input de Texto -->
        <input
          ref="inputRef"
          type="text"
          :value="modelValue"
          @input="onInput($event.target.value)"
          @keydown="onKeyDown"
          @focus="isOpen = true"
          placeholder="Ej: Dolares, Celular, Placa de video, DNI Falso..."
          class="w-full pl-11 pr-10 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-[#17365D]/20 focus:border-[#17365D] outline-none transition-all duration-200 shadow-sm font-medium"
          autocomplete="off"
          spellcheck="false"
        />

        <!-- Botón Limpiar (X) -->
        <button
          v-if="modelValue"
          @click="clearInput"
          type="button"
          class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          title="Borrar búsqueda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Botón Consultar -->
      <button
        @click="triggerSearch"
        :disabled="!modelValue || !modelValue.trim() || loading"
        class="px-5 py-2.5 sm:py-3 bg-[#17365D] hover:bg-[#002244] active:bg-[#001730] text-white font-bold text-sm rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
      >
        <svg 
          v-if="loading" 
          class="animate-spin h-4 w-4 text-white" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span>Consultar</span>
      </button>
    </div>

    <!-- Dropdown flotante de Sugerencias Difusas -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen && suggestions.length > 0"
        class="absolute z-50 left-0 right-0 sm:right-28 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100"
      >
        <div class="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
          <span>Coincidencias en catálogo</span>
          <span class="text-[9px] lowercase text-slate-400">↑ ↓ Enter</span>
        </div>

        <ul class="py-1">
          <li
            v-for="(item, index) in suggestions"
            :key="item.subtipo + index"
            @click="selectSuggestion(item)"
            @mouseenter="highlightedIndex = index"
            class="px-3.5 py-2 cursor-pointer flex items-center justify-between transition-colors text-xs"
            :class="{
              'bg-[#17365D]/10 text-[#003366] font-semibold': highlightedIndex === index,
              'hover:bg-slate-50 text-slate-700': highlightedIndex !== index
            }"
          >
            <div class="flex items-center gap-2 min-w-0 pr-2">
              <span class="truncate text-xs font-medium text-slate-900">{{ item.subtipo }}</span>
              <span 
                v-if="item.esAgregadoPorUsuario" 
                class="px-1 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-100 text-emerald-800"
              >
                Nuevo
              </span>
            </div>

            <div class="flex items-center gap-1 shrink-0 text-[10px]">
              <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[120px]">
                {{ item.incautacion }}
              </span>
              <span class="text-slate-300">›</span>
              <span class="text-slate-500 font-medium truncate max-w-[120px]">
                {{ item.tipo }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fuzzySearchFn: {
    type: Function,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'select']);

const inputRef = ref(null);
const containerRef = ref(null);
const isOpen = ref(false);
const suggestions = ref([]);
const highlightedIndex = ref(-1);

const onInput = (val) => {
  emit('update:modelValue', val);
  if (val && val.trim().length >= 1) {
    const results = props.fuzzySearchFn(val, 8);
    suggestions.value = results.map(r => r.item);
    isOpen.value = suggestions.value.length > 0;
    highlightedIndex.value = -1;
  } else {
    suggestions.value = [];
    isOpen.value = false;
  }
};

const selectSuggestion = (item) => {
  emit('update:modelValue', item.subtipo);
  isOpen.value = false;
  emit('select', item);
};

const triggerSearch = () => {
  if (highlightedIndex.value >= 0 && suggestions.value[highlightedIndex.value]) {
    selectSuggestion(suggestions.value[highlightedIndex.value]);
  } else {
    isOpen.value = false;
    emit('submit', props.modelValue);
  }
};

const clearInput = () => {
  emit('update:modelValue', '');
  suggestions.value = [];
  isOpen.value = false;
  inputRef.value?.focus();
};

const onKeyDown = (e) => {
  if (!isOpen.value || suggestions.value.length === 0) {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value = highlightedIndex.value <= 0 ? suggestions.value.length - 1 : highlightedIndex.value - 1;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    triggerSearch();
  } else if (e.key === 'Escape') {
    isOpen.value = false;
  }
};

const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
