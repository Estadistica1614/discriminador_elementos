<template>
  <div class="bg-white rounded-2xl shadow-lg border-2 border-emerald-500/30 overflow-hidden transition-all duration-300 animate-fadeIn">
    <!-- Header de la tarjeta -->
    <div class="bg-emerald-600 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-bold text-xs sm:text-sm tracking-wide uppercase">Elemento Encontrado en Catálogo</span>
      </div>
      <span 
        v-if="resultado.esAgregadoPorUsuario" 
        class="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-semibold"
      >
        Incorporado localmente
      </span>
      <span 
        v-else 
        class="bg-emerald-700/80 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-medium"
      >
        Oficial PFA
      </span>
    </div>

    <!-- Cuerpo -->
    <div class="p-4 sm:p-5 space-y-4">
      <!-- Nombre del Elemento -->
      <div>
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
          Elemento / Subtipo
        </label>
        <div class="text-xl sm:text-2xl font-extrabold text-[#003366]">
          {{ resultado.subtipo }}
        </div>
      </div>

      <!-- Cuadrícula de Incautación y Tipo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Incautación -->
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div class="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#17365D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Incautación
          </div>
          <div class="text-base sm:text-lg font-bold text-[#17365D]">
            {{ resultado.incautacion }}
          </div>
        </div>

        <!-- Tipo -->
        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div class="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#17365D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tipo de Elemento
          </div>
          <div class="text-base sm:text-lg font-bold text-slate-800">
            {{ resultado.tipo }}
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
        <button
          @click="copiarAlPortapapeles"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <svg v-if="copiado" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>{{ copiado ? '¡Copiado!' : 'Copiar Clasificación' }}</span>
        </button>

        <span class="text-[11px] text-slate-400 font-medium">
          Ruta: {{ resultado.incautacion }} › {{ resultado.tipo }} › {{ resultado.subtipo }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  resultado: {
    type: Object,
    required: true
  }
});

const copiado = ref(false);

const copiarAlPortapapeles = () => {
  const texto = `INCAUTACIÓN: ${props.resultado.incautacion}\nTIPO: ${props.resultado.tipo}\nSUBTIPO: ${props.resultado.subtipo}`;
  navigator.clipboard.writeText(texto).then(() => {
    copiado.value = true;
    setTimeout(() => {
      copiado.value = false;
    }, 2000);
  });
};
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
