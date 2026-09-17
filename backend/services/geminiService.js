import { GoogleGenerativeAI } from '@google/generative-ai';
import Fuse from 'fuse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos
const taxonomiaPath = path.resolve(__dirname, '../data/taxonomia.json');
const taxonomiaData = JSON.parse(fs.readFileSync(taxonomiaPath, 'utf-8'));

const todosElementosPath = path.resolve(__dirname, '../data/todos_elementos.json');
const todosElementosData = JSON.parse(fs.readFileSync(todosElementosPath, 'utf-8'));

// Instancia de Fuse para encontrar candidatos relevantes rápidamente
const fuseBackend = new Fuse(todosElementosData, {
  keys: [
    { name: 'subtipo', weight: 0.8 },
    { name: 'tipo', weight: 0.15 },
    { name: 'incautacion', weight: 0.05 },
  ],
  threshold: 0.6,
  includeScore: true,
  shouldSort: true,
});

// Lista de modelos ordenados por estabilidad y velocidad
const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    const taxonomiaStr = JSON.stringify(taxonomiaData.taxonomia, null, 2);
    const candidatosStr = JSON.stringify(candidatos, null, 2);

    return `Sos un clasificador experto de bienes y elementos secuestrados para la Policía Federal Argentina (PFA).
Tu tarea es clasificar el término ingresado por un usuario dentro del sistema oficial de secuestros e incautaciones.

=== REGLAS OBLIGATORIAS Y ESTRICTAS ===
1. TAXONOMÍA CERRADA: Únicamente podés utilizar los nombres de "incautacion" y "tipo" que existen en el siguiente árbol taxonómico oficial. NO podés inventar nuevas incautaciones ni nuevos tipos bajo ninguna circunstancia.

ÁRBOL TAXONÓMICO OFICIAL PERMITIDO:
${taxonomiaStr}

2. EVALUACIÓN PRIORITARIA DE SINÓNIMOS / EQUIVALENCIAS EN EL CATÁLOGO:
A continuación tenés una lista de elementos oficiales que ya existen en el sistema y son los más cercanos semánticamente al término buscado:
${candidatosStr}

REGLA DE SINÓNIMOS:
- Si el término que ingresó el usuario es un sinónimo, término coloquial, variante o nombre alternativo de un elemento que YA EXISTE en la lista de arriba (por ejemplo: si ingresó "Aparato celular" y en la lista existe "Celular", o si ingresó "Smartphone" y existe "Celular", o "Dolares" y existe "Dolares Americanos", o "Cuchillo de cocina" y existe "Cuchillo"):
  * Debes marcar: "es_sinonimo": true
  * "sinonimo_de": "Nombre EXACTO del elemento en la lista oficial" (Ej: "Celular")
  * "subtipo_sugerido": "Nombre EXACTO del elemento en la lista oficial" (Ej: "Celular")
  * "incautacion" y "tipo": Los valores exactos de ese elemento oficial.
  * "razon": Explicar brevemente la equivalencia (Ej: "El término 'Aparato celular' equivale directamente a 'Celular' ya existente en el catálogo oficial.").

3. CLASIFICACIÓN DE ELEMENTOS NUEVOS:
- Si el elemento es un objeto real pero NO existe ningún equivalente o sinónimo en el catálogo oficial (por ejemplo: "Placa de video", "Dron", "Panel solar", "Impresora 3D"):
  * "es_sinonimo": false
  * "sinonimo_de": null
  * "subtipo_sugerido": Nombre claro y formal del nuevo elemento ingresado
  * Ubicarlo en la "incautacion" y "tipo" más adecuado dentro del árbol permitido.
  * "razon": Explicación concisa del encuadre legal/técnico.

4. CANTIDAD DE OPCIONES:
- Devolvé 1 o como máximo 2 opciones más probables/pertinentes, ordenadas de mayor a menor certeza.

5. FORMATO DE RESPUESTA JSON:
{
  "opciones": [
    {
      "subtipo_sugerido": "Nombre del elemento",
      "incautacion": "NOMBRE EXACTO DE LA INCAUTACION DE LA TAXONOMIA",
      "tipo": "NOMBRE EXACTO DEL TIPO DE LA TAXONOMIA",
      "es_sinonimo": true / false,
      "sinonimo_de": "Nombre exacto del elemento oficial o null",
      "razon": "Justificación concisa",
      "confianza": "alta" | "media"
    }
  ]
}`;
  }

  async clasificarElemento(query) {
    if (!this.apiKey && !process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada. Por favor define la variable de entorno GEMINI_API_KEY en backend/.env');
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey || process.env.GEMINI_API_KEY);
    }

    const candidatos = this.obtenerCandidatosCercanos(query, 30);
    const systemInstruction = this.getSystemInstruction(candidatos);

    const userPrompt = `Clasificá el siguiente elemento ingresado por el usuario: "${query.trim()}". Recordá verificar primero si equivale a algún elemento oficial existente en la lista de candidatos provista.`;

    let ultimoError = null;

    for (const modelName of AVAILABLE_MODELS) {
      for (let intento = 1; intento <= 2; intento++) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            }
          });

          const result = await model.generateContent(userPrompt);
          const text = result.response.text();

          const parsed = JSON.parse(text);
          if (parsed.opciones && Array.isArray(parsed.opciones)) {
            parsed.opciones = parsed.opciones.filter(op => {
              const tiposValidos = taxonomiaData.taxonomia[op.incautacion];
              if (!tiposValidos) return false;
              return tiposValidos.includes(op.tipo);
            });
          }
          return parsed;
        } catch (err) {
          ultimoError = err;
          if (intento < 2) {
            await sleep(300);
          }
        }
      }
    }

    throw new Error(ultimoError?.message || 'No se pudo clasificar el elemento con la IA.');
  }
}
