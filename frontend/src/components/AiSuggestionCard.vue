<template>
  <div class="bg-white rounded-2xl shadow-lg border-2 border-[#E6C027] overflow-hidden transition-all duration-300 animate-fadeIn">
    <!-- Header Delgado y Compacto -->
    <div class="bg-gradient-to-r from-[#17365D] to-[#003366] text-white px-4 py-2.5 flex items-center justify-between gap-2 border-b border-[#E6C027]">
      <div class="flex items-center gap-2">
        <span class="p-1 bg-[#E6C027] text-slate-900 rounded-lg text-xs font-black">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <div>
          <h3 class="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
            Clasificación sugerida por IA
          </h3>
        </div>
      </div>

      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E6C027]/20 text-[#E6C027] border border-[#E6C027]/40 uppercase tracking-wider shrink-0">
        {{ opciones.length === 1 ? '1 Opción' : `${opciones.length} Opciones` }}
      </span>
    </div>

    <!-- Banner Sinónimo Compacto (si aplica) -->
    <div 
      v-if="tieneSinonimo" 
      class="bg-blue-50/80 border-b border-blue-200 px-4 py-1.5 flex items-center gap-2 text-blue-900 text-xs font-medium"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      <span class="truncate">
        <strong>"{{ queryOriginal }}"</strong> equivale al elemento oficial: 
        <strong class="text-[#003366] bg-blue-100 px-1.5 py-0.5 rounded ml-1">{{ primerSinonimo }}</strong>
      </span>
    </div>

    <!-- Cuerpo Compacto con Opciones -->
    <div class="p-3 sm:p-4 space-y-3">
      <!-- Grid de Opciones (1 o 2 columnas según cantidad) -->
      <div class="grid grid-cols-1 gap-2.5" :class="{ 'sm:grid-cols-2': opciones.length > 1 }">
        <label
          v-for="(opcion, index) in opciones"
          :key="index"
          class="relative flex flex-col justify-between p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer text-xs"
          :class="{
            'border-[#17365D] bg-indigo-50/50 shadow-sm ring-1 ring-[#17365D]/30': modelValue === index,
            'border-slate-200 hover:border-slate-300 bg-slate-50/50': modelValue !== index
          }"
          @click="$emit('update:modelValue', index)"
        >
          <!-- Fila Superior: Radio + Nombre Sugerido + Badge -->
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <input
                type="radio"
                :name="'opcion-ia'"
                :value="index"
                :checked="modelValue === index"
                class="h-4 w-4 text-[#17365D] border-slate-300 focus:ring-[#17365D] cursor-pointer shrink-0"
                @change="$emit('update:modelValue', index)"
              />
              <span class="font-extrabold text-sm text-[#003366] truncate">
                {{ opcion.subtipo_sugerido || queryOriginal }}
              </span>
            </div>

            <span 
              v-if="index === 0" 
              class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#E6C027]/20 text-[#8c6b00] border border-[#E6C027]/40 shrink-0"
            >
              Recomendada
            </span>
          </div>

          <!-- Taxonomía en Fila Horizontal Compacta -->
          <div class="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 mb-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Incautación:</span>
            <span class="font-bold text-[#17365D] text-xs">{{ opcion.incautacion }}</span>
            <span class="text-slate-300">›</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase">Tipo:</span>
            <span class="font-bold text-slate-800 text-xs">{{ opcion.tipo }}</span>
          </div>

          <!-- Razón breve en 1 línea -->
          <p v-if="opcion.razon" class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
            <strong class="text-slate-700">Justificación:</strong> {{ opcion.razon }}
          </p>
        </label>
      </div>

      <!-- Barra de Acción Inferior Compacta -->
      <div class="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <span class="text-[11px] text-slate-500 text-center sm:text-left">
          Se incorporará con la opción seleccionada a tu catálogo local.
        </span>

        <button
          @click="$emit('agregar')"
          type="button"
          class="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
          </svg>
          <span>Agregar elemento a la lista</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  opciones: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Number,
    default: 0
  },
  queryOriginal: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue', 'agregar']);

const tieneSinonimo = computed(() => {
  return props.opciones.some(op => op.es_sinonimo && op.sinonimo_de);
});

const primerSinonimo = computed(() => {
  const sin = props.opciones.find(op => op.es_sinonimo && op.sinonimo_de);
  return sin ? sin.sinonimo_de : '';
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
