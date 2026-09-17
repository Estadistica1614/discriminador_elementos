import { ref, computed } from 'vue';
import { elementosTodos } from '@/data/elementos.js';
import { useFuzzySearch } from './useFuzzySearch';

const STORAGE_KEY = 'pfa_elementos_agregados_v1';

export function useClassifier() {
  const elementosAgregados = ref([]);

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      elementosAgregados.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error al cargar elementos de localStorage:', e);
  }

  const todosLosElementos = computed(() => {
    return [...elementosAgregados.value, ...elementosTodos];
  });

  const { search: fuzzySearch, findExactOrClose } = useFuzzySearch(todosLosElementos);

  const currentQuery = ref('');
  const isConsulting = ref(false);
  const isLoadingAi = ref(false);
  const aiError = ref(null);
  
  const resultadoOficial = ref(null);
  const sugerenciasIA = ref([]);
  const opcionSeleccionadaIndex = ref(0);
  const feedbackMensaje = ref(null);

  const persistirAgregados = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elementosAgregados.value));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  };

  const consultar = async (termino) => {
    const query = (termino || currentQuery.value || '').trim();
    if (!query) return;

    isConsulting.value = true;
    currentQuery.value = query;
    resultadoOficial.value = null;
    sugerenciasIA.value = [];
    opcionSeleccionadaIndex.value = 0;
    aiError.value = null;
    feedbackMensaje.value = null;

    // 1. Paso 1: Buscar en catálogo local
    const match = findExactOrClose(query);

    if (match && (match.exactMatch || (match.item.subtipo.toLowerCase() === query.toLowerCase()))) {
      resultadoOficial.value = {
        ...match.item,
        coincidenciaDirecta: true,
      };
      isConsulting.value = false;
      return;
    }

    // 2. Paso 2: Consultar con la IA
    isLoadingAi.value = true;

    try {
      const response = await fetch('/api/clasificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('El servidor backend no está iniciado o no responde en http://localhost:3001. Por favor abrí una terminal y ejecutá: npm run dev:backend');
      }

      if (!response.ok) {
        if (data.code === 'MISSING_API_KEY') {
          throw new Error('La API Key de Gemini no está configurada en el archivo backend/.env. Por favor añádela para habilitar las sugerencias con IA.');
        }
        throw new Error(data.error || 'Error al comunicarse con la IA');
      }

      if (data.opciones && data.opciones.length > 0) {
        sugerenciasIA.value = data.opciones;
        opcionSeleccionadaIndex.value = 0;
      } else {
        throw new Error('La IA no pudo clasificar este elemento dentro de la taxonomía.');
      }
    } catch (err) {
      console.error('Error al clasificar con IA:', err);
      aiError.value = err.message || 'No se pudo conectar con el servicio de IA.';
    } finally {
      isLoadingAi.value = false;
      isConsulting.value = false;
    }
  };

  const agregarElementoSeleccionado = () => {
    if (!sugerenciasIA.value || sugerenciasIA.value.length === 0) return;

    const seleccion = sugerenciasIA.value[opcionSeleccionadaIndex.value];
    if (!seleccion) return;

    const nombreElemento = seleccion.subtipo_sugerido || currentQuery.value;
    const terminoOriginal = currentQuery.value.trim();

    const yaExisteSugerido = todosLosElementos.value.some(
      el => el.subtipo.toLowerCase() === nombreElemento.toLowerCase()
    );

    if (!yaExisteSugerido) {
      const nuevoElemento = {
        subtipo: nombreElemento,
        tipo: seleccion.tipo,
        incautacion: seleccion.incautacion,
        esAgregadoPorUsuario: true,
        fechaCreacion: new Date().toISOString(),
      };
      elementosAgregados.value.unshift(nuevoElemento);
    }

    if (terminoOriginal.toLowerCase() !== nombreElemento.toLowerCase()) {
      const yaExisteOriginal = todosLosElementos.value.some(
        el => el.subtipo.toLowerCase() === terminoOriginal.toLowerCase()
      );
      if (!yaExisteOriginal) {
        elementosAgregados.value.unshift({
          subtipo: terminoOriginal,
          tipo: seleccion.tipo,
          incautacion: seleccion.incautacion,
          esAgregadoPorUsuario: true,
          esAliasDe: nombreElemento,
          fechaCreacion: new Date().toISOString(),
        });
      }
    }

    persistirAgregados();

    resultadoOficial.value = {
      subtipo: seleccion.es_sinonimo ? `${nombreElemento} (Sinónimo de: ${terminoOriginal})` : nombreElemento,
      tipo: seleccion.tipo,
      incautacion: seleccion.incautacion,
      esAgregadoPorUsuario: true,
      coincidenciaDirecta: true,
    };

    feedbackMensaje.value = `¡"${nombreElemento}" quedó vinculado e incorporado para futuras consultas!`;
    sugerenciasIA.value = [];
  };

  const eliminarElementoAgregado = (subtipo) => {
    elementosAgregados.value = elementosAgregados.value.filter(
      el => el.subtipo.toLowerCase() !== subtipo.toLowerCase()
    );
    persistirAgregados();
    if (resultadoOficial.value?.subtipo === subtipo) {
      resultadoOficial.value = null;
    }
  };

  const limpiar = () => {
    currentQuery.value = '';
    resultadoOficial.value = null;
    sugerenciasIA.value = [];
    aiError.value = null;
    feedbackMensaje.value = null;
  };

  return {
    todosLosElementos,
    elementosAgregados,
    currentQuery,
    isConsulting,
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
    limpiar,
  };
}
