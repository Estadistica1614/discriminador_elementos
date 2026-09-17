// Cloudflare Pages Function: POST /api/clasificar

const AVAILABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Headers CORS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY no configurada en las variables de entorno de Cloudflare Pages.',
        code: 'MISSING_API_KEY'
      }), { status: 500, headers });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({
        error: 'El campo "query" es requerido.'
      }), { status: 400, headers });
    }

    const systemInstruction = `Sos un clasificador experto de bienes y elementos secuestrados para la Policía Federal Argentina (PFA).
Tu tarea es clasificar el término ingresado por un usuario dentro del sistema oficial de secuestros e incautaciones.

=== REGLAS OBLIGATORIAS Y ESTRICTAS ===
1. TAXONOMÍA CERRADA: Únicamente podés utilizar los nombres de "incautacion" y "tipo" de la taxonomía oficial de la PFA:
- DIVISAS (Tipo: Dinero)
- DOCUMENTACION (Tipos: Anotaciones, Cedula de Identidad, Cedula Verde/Azul Automotor, Chapa Patente, Cheque, Chequera, Cuaderno, Documentacion de Interes para La Causa, Documento Nacional de Identidad, Historia Clinica, Libro Contable, Licencia de Conducir, Pasaporte, Talonario, Tarjeta de Credito, Tarjeta de Debito)
- DOCUMENTACION FALSA (Tipos: Billete Apocrifo/Falso, Documento de Identidad Falso, Documento Publico Falso, Licencia de Conducir Falsa, Pasaporte Falso, Patente Falsa, Tarjeta de Credito Falsa, Tarjeta de Debito Falsa)
- ELEMENTOS PARA ELABORACION DE DROGAS (Tipos: Elementos de Fraccionamiento, Papeles para Armado de Cigarrillos, Picador de Marihuana, Pipa para Fumar, Pipa de Agua)
- FLORA Y FAUNA (Tipos: Codigo Alimentario, Comercio Internacional de Especies, Hoja Ruta Transporte Yerba, Ley de Carnes, Ley de Caza, Ley de Fauna, Ley de Pesca, Ley de Senasa, Monumentos Naturales, Programa Nacional para La Prevencion de La Enfermedad Hlb de Los Citrus, Registro Federal de Pesca, Riqueza Forestal)
- GRANOS (Tipos: Afrecho, Cebada, Centeno, Colza, Lino, Maiz, Semillas de Sorgo, Soja, Sorgo, Trigo)
- MERCADERIA (Tipos: Alimentos, Animales, Articulo de Tienda, Articulo Del Hogar, Autopartes, Bazar y Menaje, Bebidas, Cigarrillos, Combustibles y Lubricantes, Electricidad-Electronica, Electrodomesticos, Elementos de Limpieza, Equipo Militar y de Seguridad, Equipos, Herramientas y Repuestos, Indumentaria Textil y Confecciones, Jardineria, Joyeria, Madera, Maquina, Nautica, Productos Medicos o Farmaceuticos o Laboratorio, Veterinaria)
- PATRIMONIO CULTURAL, ARQUEOLOGICO Y PALEONTOLOGICO (Tipos: Circulacion de Obras de Arte, Hallazgos, Proteccion Del Patrimonio Arqueologico y Paleontologico, Registro Nacional Del Patrimonio Arqueologico)
- PRECURSORES QUIMICOS (Tipos: Acetato Isopropilico, Acido Fenilacetico, Acido Formico, Acido Lisergico, Acido Metilglicidico, Acido N Acetilantranilico, Acido O Aminobenzoico, Acido Yodhidrico, Alcohol Isobutilico)
- RESIDUOS PELIGROSOS (Tipos: Desechos de Aceite y Agua o de Hidrocarburos y Agua, Desechos de La Industria de La Energia, Desechos de La Industria Quimica, Desechos de Medicamentos y Productos Farmaceuticos para La Salud Humana y Animal, Desechos de Productos Fitosanitarios, Desechos Derivados de Resinas, Latex, Plastificantes o Colas y Adhesivos, Desechos Derivados de Tintas, Colorantes, Pigmentos, Pinturas, Lacas o Barnices, Desechos que Tienen Cianuro, Residuos Con Alquitran)

2. SINÓNIMOS / EQUIVALENCIAS:
- Si el término ingresado equivale a un elemento existente (ej: "Aparato celular" -> "Celular", "Smartphone" -> "Celular", "Dolares" -> "Dolares Americanos", "Cuchillo de cocina" -> "Cuchillo"):
  * "es_sinonimo": true
  * "sinonimo_de": "Nombre exacto del elemento oficial"
  * "subtipo_sugerido": "Nombre exacto del elemento oficial"
  * "incautacion" y "tipo": Valores correspondientes a ese elemento.
  * "razon": Explicar la equivalencia.

3. ELEMENTOS NUEVOS:
- Si el elemento es real pero no existe equivalente en el catálogo (ej: "Placa de video", "Dron"):
  * "es_sinonimo": false
  * "sinonimo_de": null
  * "subtipo_sugerido": Nombre formal del nuevo elemento
  * Ubicarlo en la "incautacion" y "tipo" válida más adecuada.

4. CANTIDAD DE OPCIONES: 1 o máximo 2 opciones ordenadas de mayor a menor probabilidad.

5. FORMATO DE RESPUESTA OBLIGATORIO:
JSON estricto:
{
  "opciones": [
    {
      "subtipo_sugerido": "Nombre",
      "incautacion": "NOMBRE INCAUTACION OFICIAL",
      "tipo": "NOMBRE TIPO OFICIAL",
      "es_sinonimo": true / false,
      "sinonimo_de": "Elemento oficial o null",
      "razon": "Justificación concisa",
      "confianza": "alta" | "media"
    }
  ]
}`;

    const userPrompt = `Clasificá el siguiente elemento: "${query.trim()}".`;

    let ultimoError = null;

    for (const modelName of AVAILABLE_MODELS) {
      for (let intento = 1; intento <= 2; intento++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          
          const payload = {
            system_instruction: {
              parts: [{ text: systemInstruction }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
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
          return new Response(JSON.stringify(parsed), { status: 200, headers });
        } catch (err) {
          ultimoError = err;
          if (intento < 2) await sleep(300);
        }
      }
    }

    return new Response(JSON.stringify({
      error: ultimoError?.message || 'Error al comunicarse con Gemini en Cloudflare'
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
