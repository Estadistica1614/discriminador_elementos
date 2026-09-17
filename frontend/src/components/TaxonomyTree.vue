<template>
  <div class="bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col h-full overflow-hidden transition-all duration-200">
    <!-- Header del Árbol -->
    <div class="bg-[#17365D] text-white p-3.5 border-b border-[#002244] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#E6C027]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <div>
          <h3 class="font-bold text-xs sm:text-sm leading-tight">Árbol Taxonómico Oficial</h3>
          <p class="text-[10px] text-slate-300">Incautaciones y Tipos con subniveles</p>
        </div>
      </div>
      
      <span class="text-[9px] font-bold uppercase tracking-wider bg-[#E6C027]/20 text-[#E6C027] px-1.5 py-0.5 rounded border border-[#E6C027]/30">
        Jerárquico
      </span>
    </div>

    <!-- Buscador interno de filtro -->
    <div class="p-2.5 bg-slate-50 border-b border-slate-200">
      <div class="relative">
        <input
          v-model="filtro"
          type="text"
          placeholder="Filtrar tipos o categorías..."
          class="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#17365D] focus:border-transparent outline-none transition-all"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button 
          v-if="filtro" 
          @click="filtro = ''" 
          class="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Lista de Nodos del Árbol -->
    <div class="p-2.5 flex-1 overflow-y-auto max-h-[550px] space-y-1.5 text-xs divide-y divide-slate-100">
      <div 
        v-for="inc in incautacionesFiltradas" 
        :key="inc.incautacion"
        class="pt-1.5 first:pt-0"
      >
        <!-- Nivel 1: Incautación -->
        <button
          @click="toggleIncautacion(inc.incautacion)"
          class="w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left font-bold"
          :class="openIncautaciones[inc.incautacion] ? 'bg-[#17365D]/10 text-[#003366]' : 'hover:bg-slate-100 text-slate-800'"
        >
          <div class="flex items-center gap-1.5 min-w-0 pr-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-[#17365D]"
              :class="{ 'rotate-90': openIncautaciones[inc.incautacion] }"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="truncate uppercase tracking-wide text-xs">{{ inc.incautacion }}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700">
              {{ inc.tipos.length }} tipos
            </span>
          </div>
        </button>

        <!-- Nivel 2: Tipos -->
        <div 
          v-if="openIncautaciones[inc.incautacion]" 
          class="ml-3 pl-2.5 border-l-2 border-[#17365D]/20 mt-1 space-y-1 py-1"
        >
          <div 
            v-for="tipo in inc.tipos" 
            :key="tipo.nombre"
            class="rounded-lg overflow-hidden"
          >
            <!-- Header del Tipo -->
            <button
              @click="toggleTipo(inc.incautacion + '__' + tipo.nombre)"
              class="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors text-xs font-semibold"
              :class="openTipos[inc.incautacion + '__' + tipo.nombre] ? 'bg-amber-50 text-amber-900' : 'hover:bg-slate-100 text-slate-700'"
            >
              <div class="flex items-center gap-1.5 min-w-0 pr-1">
                <span class="text-slate-400 text-[10px]">📁</span>
                <span class="truncate">{{ tipo.nombre }}</span>
              </div>
              <span 
                class="px-1.5 py-0.5 rounded text-[9px] shrink-0 font-medium"
                :class="tipo.cantidadSubtipos > 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'"
              >
                {{ tipo.cantidadSubtipos }} elem.
              </span>
            </button>

            <!-- Nivel 3: Subtipos -->
            <div 
              v-if="openTipos[inc.incautacion + '__' + tipo.nombre]"
              class="ml-3 pl-2 py-1.5 my-1 bg-slate-50 rounded-lg border border-slate-200/80 max-h-44 overflow-y-auto space-y-1"
            >
              <div class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex justify-between items-center">
                <span>Elementos (click para buscar):</span>
                <span>{{ tipo.subtipos.length }}</span>
              </div>
              <div class="flex flex-wrap gap-1 pr-1">
                <button
                  v-for="sub in tipo.subtipos"
                  :key="sub"
                  @click="$emit('select-element', sub)"
                  class="px-1.5 py-0.5 bg-white hover:bg-[#17365D] hover:text-white border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors truncate max-w-[180px] text-left cursor-pointer"
                  :title="sub"
                >
                  {{ sub }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="incautacionesFiltradas.length === 0" class="text-center py-5 text-slate-400">
        No se encontraron coincidencias para "{{ filtro }}"
      </div>
    </div>

    <!-- Footer informativo del árbol -->
    <div class="p-2 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
      <span>Categorías con subniveles</span>
      <button 
        @click="toggleExpandirTodo" 
        class="font-bold text-[#17365D] hover:underline"
      >
        {{ todosAbiertos ? 'Colapsar todo' : 'Expandir todo' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import arbolData from '@/data/arbolTaxonomia.json';

defineEmits(['select-element']);

const filtro = ref('');
const openIncautaciones = ref({});
const openTipos = ref({});
const todosAbiertos = ref(false);

const incautacionesConSubniveles = arbolData.filter(inc => inc.tieneSubniveles || inc.totalSubtipos > 1);

const incautacionesFiltradas = computed(() => {
  if (!filtro.value.trim()) {
    return incautacionesConSubniveles;
  }
  const q = filtro.value.toLowerCase().trim();
  return arbolData.map(inc => {
    const coincideInc = inc.incautacion.toLowerCase().includes(q);
    const tiposCoincidentes = inc.tipos.filter(t => 
      t.nombre.toLowerCase().includes(q) || 
      t.subtipos.some(s => s.toLowerCase().includes(q))
    );

    if (coincideInc || tiposCoincidentes.length > 0) {
      return {
        ...inc,
        tipos: coincideInc ? inc.tipos : tiposCoincidentes
      };
    }
    return null;
  }).filter(Boolean);
});

const toggleIncautacion = (nombre) => {
  openIncautaciones.value[nombre] = !openIncautaciones.value[nombre];
};

const toggleTipo = (key) => {
  openTipos.value[key] = !openTipos.value[key];
};

const toggleExpandirTodo = () => {
  todosAbiertos.value = !todosAbiertos.value;
  incautacionesConSubniveles.forEach(inc => {
    openIncautaciones.value[inc.incautacion] = todosAbiertos.value;
  });
};

onMounted(() => {
  openIncautaciones.value['MERCADERIA'] = true;
  openIncautaciones.value['DIVISAS'] = true;
});
</script>
