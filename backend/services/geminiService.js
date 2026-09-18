import { GoogleGenerativeAI } from '@google/generative-ai';
import Fuse from 'fuse.js';
import { elementosTodos } from '../../frontend/src/data/elementos.js';

// Extraer taxonomía oficial dinámicamente en tiempo real desde la fuente única
function generarTaxonomiaEnMemoria(lista) {
  const tree = {};
  lista.forEach(e => {
    const inc = e.incautacion?.trim();
    const tip = e.tipo?.trim();
    if (!inc || !tip) return;
    if (!tree[inc]) tree[inc] = new Set();
    tree[inc].add(tip);
  });
  const res = {};
  Object.keys(tree).sort().forEach(k => {
    res[k] = Array.from(tree[k]).sort();
  });
  return res;
}

const taxonomiaData = generarTaxonomiaEnMemoria(elementosTodos);

// Instancia de Fuse para encontrar candidatos relevantes rápidamente
const fuseBackend = new Fuse(elementosTodos, {
  keys: [
    { name: 'subtipo', weight: 0.8 },
    { name: 'tipo', weight: 0.15 },
    { name: 'incautacion', weight: 0.05 },
  ],
  threshold: 0.6,
  includeScore: true,
  shouldSort: true,
});

// Sanitizador dinámico que garantiza que nunca se devuelvan categorías inventadas
function sanitizarClasificacion(incautacionRecibida, tipoRecibido) {
  const incKeys = Object.keys(taxonomiaData);
  
  let incFinal = incKeys.find(k => k.toLowerCase() === (incautacionRecibida || '').toLowerCase());
  if (!incFinal) {
    incFinal = incKeys.find(k => k.toLowerCase().includes((incautacionRecibida || '').toLowerCase())) || "MERCADERIA";
  }

  const tiposValidos = taxonomiaData[incFinal] || taxonomiaData["MERCADERIA"] || [];
  const tRecibido = (tipoRecibido || '').trim().toLowerCase();

  let tipoFinal = tiposValidos.find(t => t.toLowerCase() === tRecibido);
  if (!tipoFinal) {
    tipoFinal = tiposValidos.find(t => t.toLowerCase().includes(tRecibido) || tRecibido.includes(t.toLowerCase()));
  }
  if (!tipoFinal) {
    tipoFinal = tiposValidos[0];
  }

  return { incautacion: incFinal, tipo: tipoFinal };
}

const AVAILABLE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash'
];

export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  obtenerCandidatosCercanos(query, limit = 25) {
    if (!query) return [];
    const results = fuseBackend.search(query.trim());
    return results.slice(0, limit).map(r => r.item);
  }

  getSystemInstruction(candidatos = []) {
    const taxonomiaStr = JSON.stringify(taxonomiaData, null, 2);
    const candidatosStr = JSON.stringify(candidatos, null, 2);

    return `Sos un clasificador de bienes secuestrados para la Policía Federal Argentina (PFA).
Clasificá el elemento dentro de la taxonomía oficial:

TAXONOMÍA OFICIAL ESTRICTA:
${taxonomiaStr}

CANDIDATOS EXISTENTES EN EL CATÁLOGO:
${candidatosStr}

REGLAS:
1. TAXONOMÍA CERRADA: "incautacion" y "tipo" DEBEN coincidir literalmente con la taxonomía oficial.
2. SINÓNIMOS: Si el término ingresado equivale a un candidato existente en la lista, marcá es_sinonimo: true, sinonimo_de: "Nombre del elemento oficial", subtipo_sugerido: "Nombre del elemento oficial".
3. ELEMENTO NUEVO: Si es un elemento no registrado, colocá su nombre en subtipo_sugerido y encuadralo en su incautacion y tipo existente más adecuado.
4. FORMATO: JSON estricto: {"opciones":[{"subtipo_sugerido":"...","incautacion":"NOMBRE","tipo":"NOMBRE","es_sinonimo":false,"sinonimo_de":null,"razon":"...","confianza":"alta"}]}`;
  }

  async clasificarElemento(query) {
    if (!this.apiKey && !process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada en backend/.env');
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey || process.env.GEMINI_API_KEY);
    }

    const candidatos = this.obtenerCandidatosCercanos(query, 30);
    const systemInstruction = this.getSystemInstruction(candidatos);
    const userPrompt = `Clasificá: "${query.trim()}".`;

    let ultimoError = null;

    for (const modelName of AVAILABLE_MODELS) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 250,
          }
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        const parsed = JSON.parse(text);
        if (parsed.opciones && Array.isArray(parsed.opciones)) {
          parsed.opciones = parsed.opciones.map(op => {
            const sanitizado = sanitizarClasificacion(op.incautacion, op.tipo);
            return {
              ...op,
              incautacion: sanitizado.incautacion,
              tipo: sanitizado.tipo
            };
          });
        }
        return parsed;
      } catch (err) {
        ultimoError = err;
      }
    }

    throw new Error(ultimoError?.message || 'No se pudo clasificar el elemento con la IA.');
  }
}
