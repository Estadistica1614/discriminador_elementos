<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-800">
    <!-- Header Institucional PFA -->
    <AppHeader />

    <!-- Contenido Principal con Layout de 2 Columnas -->
    <main class="flex-1 py-6 sm:py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">

        <!-- Barra Superior de Métricas y Estado -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 text-xs mb-6">
          <div class="flex items-center gap-2 text-slate-600 font-medium">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Catálogo Activo: <strong>{{ totalCatalogo }}</strong> elementos (10 incautaciones · 97 tipos)</span>
          </div>

          <button
            v-if="elementosAgregados.length > 0"
            @click="isModalOpen = true"
            class="inline-flex items-center gap-1.5 font-bold text-[#17365D] hover:text-[#002244] bg-[#17365D]/10 hover:bg-[#17365D]/20 px-3 py-1 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Ver incorporados ({{ elementosAgregados.length }})</span>
          </button>
        </div>

        <!-- Grid Principal: Discriminador (Izquierda) + Árbol Taxonómico (Derecha) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Columna Izquierda: Buscador, Resultados y Sugerencia IA -->
          <div class="lg:col-span-7 xl:col-span-8 space-y-5">
            
            <!-- Tarjeta de Búsqueda Principal -->
            <FormCard 
              title="Consulta y Clasificación de Bienes"
              customClass="border-t-4 border-t-[#17365D]"
            >
              <template #icon>
                <div class="p-2 bg-[#17365D]/10 text-[#17365D] rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </template>

              <p class="text-xs sm:text-sm text-slate-500 mb-3.5">
                Ingresá el nombre o descripción del bien secuestrado. Si existe en el catálogo se mostrará su clasificación oficial; si no existe, la <strong>IA</strong> sugerirá su encuadre taxonómico exacto.
              </p>

              <!-- Buscador con Autocompletado Difuso -->
              <SearchAutocomplete
                v-model="searchQuery"
                :fuzzy-search-fn="fuzzySearch"
                :loading="isLoadingAi"
                @submit="onSearchSubmit"
                @select="onSuggestionSelect"
              />

              <!-- Ejemplos rápidos de prueba -->
              <div class="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span class="font-semibold text-slate-600">Ejemplos:</span>
                <button
                  v-for="ejemplo in ejemplos"
                  :key="ejemplo.label"
                  @click="probarEjemplo(ejemplo.texto)"
                  class="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-[11px] font-medium cursor-pointer"
                >
                  {{ ejemplo.label }}
                </button>
              </div>
            </FormCard>

            <!-- Feedback de Éxito al Agregar -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform -translate-y-1 opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform -translate-y-1 opacity-0"
            >
              <div 
                v-if="feedbackMensaje" 
                class="bg-emerald-50 border border-emerald-500 text-emerald-900 px-4 py-2.5 rounded-xl flex items-center justify-between shadow-sm text-xs font-bold"
              >
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span>{{ feedbackMensaje }}</span>
                </div>
                <button @click="feedbackMensaje = null" class="text-emerald-700 hover:text-emerald-900 p-1">
                  ✕
                </button>
              </div>
            </transition>

            <!-- Loading State: Consultando a Gemini -->
            <div 
              v-if="isLoadingAi" 
              class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex items-center justify-center gap-4 animate-pulse"
            >
              <div class="w-10 h-10 rounded-full border-4 border-[#17365D]/20 border-t-[#17365D] animate-spin shrink-0"></div>
              <div>
                <h4 class="font-extrabold text-sm sm:text-base text-[#003366]">Analizando con Inteligencia Artificial...</h4>
                <p class="text-xs text-slate-500">
                  Evaluando taxonomía oficial de la PFA para determinar el encuadre exacto de Incautación y Tipo.
                </p>
              </div>
            </div>

            <!-- Error State de la IA -->
            <div 
              v-if="aiError" 
              class="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-red-900 space-y-1 shadow-sm text-xs"
            >
              <div class="flex items-center gap-2 font-bold text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Aviso de Configuración</span>
              </div>
              <p class="text-red-800">{{ aiError }}</p>
            </div>

            <!-- 1. Caso: Elemento Encontrado en Catálogo Oficial -->
            <ResultCard 
              v-if="resultadoOficial && !isLoadingAi" 
              :resultado="resultadoOficial" 
            />

            <!-- 2. Caso: Sugerencia por IA (Tarjeta Compacta) -->
            <AiSuggestionCard
              v-if="sugerenciasIA.length > 0 && !isLoadingAi"
              :opciones="sugerenciasIA"
              :query-original="currentQuery"
              v-model="opcionSeleccionadaIndex"
              @agregar="onAgregarElemento"
            />
          </div>

          <!-- Columna Derecha: Árbol Interactivo de Taxonomía -->
          <div class="lg:col-span-5 xl:col-span-4 sticky top-6">
            <TaxonomyTree 
              :elementos="todosLosElementos"
              @select-element="onTreeElementSelect"
            />
          </div>

        </div>

      </div>
    </main>

    <!-- Modal de Elementos Agregados -->
    <AddedElementsModal
      :is-open="isModalOpen"
      :elementos="elementosAgregados"
      @close="isModalOpen = false"
      @eliminar="onEliminarElemento"
    />

    <!-- Footer Institucional -->
    <footer class="bg-[#17365D] text-slate-300 py-3.5 border-t border-[#002244] text-xs text-center mt-auto">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Policía Federal Argentina · Sistema de Discriminación de Elementos Secuestrados</span>
        <span class="text-slate-400">Desarrollado con Vue 3 & Google Gemini</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import AppHeader from './components/AppHeader.vue';
import FormCard from './components/FormCard.vue';
import SearchAutocomplete from './components/SearchAutocomplete.vue';
import ResultCard from './components/ResultCard.vue';
import AiSuggestionCard from './components/AiSuggestionCard.vue';
import AddedElementsModal from './components/AddedElementsModal.vue';
import TaxonomyTree from './components/TaxonomyTree.vue';
import { useClassifier } from './composables/useClassifier';

const {
  todosLosElementos,
  elementosAgregados,
  currentQuery,
  isLoadingAi,
  aiError,
  resultadoOficial,
  sugerenciasIA,
  opcionSeleccionadaIndex,
  feedbackMensaje,
  fuzzySearch,
  consultar,
  agregarElementoSeleccionado,
  eliminarElementoAgregado,
} = useClassifier();

const searchQuery = ref('');
const isModalOpen = ref(false);

const totalCatalogo = computed(() => todosLosElementos.value.length);

const ejemplos = [
  { label: 'Existente: Dolares', texto: 'Dolares Americanos' },
  { label: 'Sinónimo: Aparato celular', texto: 'Aparato celular' },
  { label: 'Nuevo: Placa de video', texto: 'Placa de video' },
  { label: 'Nuevo: Dron cuadricóptero', texto: 'Dron cuadricóptero' }
];

const onSearchSubmit = (val) => {
  consultar(val);
};

const onSuggestionSelect = (item) => {
  searchQuery.value = item.subtipo;
  consultar(item.subtipo);
};

const onTreeElementSelect = (subtipo) => {
  searchQuery.value = subtipo;
  consultar(subtipo);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const probarEjemplo = (texto) => {
  searchQuery.value = texto;
  consultar(texto);
};

const onAgregarElemento = () => {
  agregarElementoSeleccionado();
};

const onEliminarElemento = (subtipo) => {
  eliminarElementoAgregado(subtipo);
};
</script>
