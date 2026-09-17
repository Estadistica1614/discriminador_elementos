<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-[#17365D] text-white px-5 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#E6C027]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 class="font-extrabold text-base">Elementos Incorporados Localmente ({{ elementos.length }})</h3>
        </div>
        <button 
          @click="$emit('close')" 
          class="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Contenido / Lista -->
      <div class="p-5 flex-1 overflow-y-auto space-y-2.5">
        <div v-if="elementos.length === 0" class="text-center py-8 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="font-medium text-slate-600 text-sm">Aún no has agregado ningún elemento nuevo</p>
          <p class="text-xs text-slate-400 mt-1">Cuando la IA te sugiera una clasificación y presiones "Agregar elemento a la lista", aparecerá aquí.</p>
        </div>

        <div 
          v-for="item in elementos" 
          :key="item.subtipo"
          class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div>
            <div class="font-bold text-slate-900 text-sm">{{ item.subtipo }}</div>
            <div class="text-xs text-slate-500 mt-0.5">
              <span class="font-semibold text-[#17365D]">{{ item.incautacion }}</span> › <span>{{ item.tipo }}</span>
            </div>
          </div>

          <button
            @click="$emit('eliminar', item.subtipo)"
            class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar de la lista local"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
        <button
          v-if="elementos.length > 0"
          @click="exportarJSON"
          class="px-3.5 py-1.5 bg-[#17365D] text-white text-xs font-bold rounded-xl hover:bg-[#002244] transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar JSON
        </button>
        <span v-else></span>

        <button
          @click="$emit('close')"
          class="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  elementos: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close', 'eliminar']);

const exportarJSON = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(props.elementos, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `elementos_agregados_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
</script>
