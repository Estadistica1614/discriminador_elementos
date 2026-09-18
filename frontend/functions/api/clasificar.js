// Cloudflare Pages Function: POST /api/clasificar
import { elementosTodos } from '../../src/data/elementos.js';

// Generar la taxonomía dinámica en memoria a partir de la fuente única (elementos.js)
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

const TAXONOMIA_OFICIAL = generarTaxonomiaEnMemoria(elementosTodos);

// Sanitizador dinámico que garantiza que nunca se devuelvan categorías no existentes
function sanitizarClasificacion(incautacionRecibida, tipoRecibido) {
  const incKeys = Object.keys(TAXONOMIA_OFICIAL);
  
  let incFinal = incKeys.find(k => k.toLowerCase() === (incautacionRecibida || '').toLowerCase());
  if (!incFinal) {
    incFinal = incKeys.find(k => k.toLowerCase().includes((incautacionRecibida || '').toLowerCase())) || "MERCADERIA";
  }

  const tiposValidos = TAXONOMIA_OFICIAL[incFinal] || TAXONOMIA_OFICIAL["MERCADERIA"] || [];
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

const AVAILABLE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY no configurada en Cloudflare Pages.',
        code: 'MISSING_API_KEY'
      }), { status: 500, headers });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({
        error: 'El campo "query" es requerido.'
      }), { status: 400, headers });
    }

    const systemInstruction = `Sos un clasificador oficial de la Policía Federal Argentina (PFA).
Tu tarea es clasificar el elemento estrictamente dentro de la taxonomía oficial de la PFA:

TAXONOMÍA OFICIAL ESTRICTA:
${JSON.stringify(TAXONOMIA_OFICIAL, null, 2)}

REGLAS:
1. NO INVENTAR CATEGORÍAS: "incautacion" y "tipo" DEBEN coincidir literalmente con la taxonomía oficial.
2. SINÓNIMOS: Si el elemento equivale a uno existente (ej: "Aparato celular" -> "Celular"), marcá es_sinonimo: true, sinonimo_de: "Celular", subtipo_sugerido: "Celular".
3. ELEMENTO NUEVO: Si es un elemento no registrado (ej: "Placa de video"), colocá su nombre en subtipo_sugerido y encuadralo en la incautacion y tipo existente más adecuado.
4. FORMATO: JSON estricto: {"opciones":[{"subtipo_sugerido":"...","incautacion":"NOMBRE","tipo":"NOMBRE","es_sinonimo":false,"sinonimo_de":null,"razon":"...","confianza":"alta"}]}`;

    const userPrompt = `Clasificá: "${query.trim()}".`;
    let ultimoError = null;

    for (const modelName of AVAILABLE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const payload = {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 250,
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.text();
          throw new Error(`API Gemini Error (${res.status}): ${errData}`);
        }

        const apiData = await res.json();
        const rawText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error('Respuesta vacía de Gemini');
        }

        const parsed = JSON.parse(rawText);

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

        return new Response(JSON.stringify(parsed), { status: 200, headers });
      } catch (err) {
        ultimoError = err;
      }
    }

    return new Response(JSON.stringify({
      error: ultimoError?.message || 'Error al comunicarse con Gemini'
    }), { status: 500, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || 'Error interno en Cloudflare Function'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
