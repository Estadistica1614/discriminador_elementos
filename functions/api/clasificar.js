// Cloudflare Pages Function: POST /api/clasificar

// Modelos estables y ultra rápidos (respuesta < 1 segundo)
const AVAILABLE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash'
];

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

    const systemInstruction = `Sos un clasificador de bienes secuestrados para la Policía Federal Argentina (PFA).
Clasificá el elemento dentro de la taxonomía oficial obligatoria:
- DIVISAS (Dinero)
- DOCUMENTACION (Anotaciones, Cedula de Identidad, Cedula Verde/Azul Automotor, Chapa Patente, Cheque, Chequera, Cuaderno, Documentacion de Interes para La Causa, Documento Nacional de Identidad, Historia Clinica, Libro Contable, Licencia de Conducir, Pasaporte, Talonario, Tarjeta de Credito, Tarjeta de Debito)
- DOCUMENTACION FALSA (Billete Apocrifo/Falso, Documento de Identidad Falso, Documento Publico Falso, Licencia de Conducir Falsa, Pasaporte Falso, Patente Falsa, Tarjeta de Credito Falsa, Tarjeta de Debito Falsa)
- ELEMENTOS PARA ELABORACION DE DROGAS (Elementos de Fraccionamiento, Papeles para Armado de Cigarrillos, Picador de Marihuana, Pipa para Fumar, Pipa de Agua)
- FLORA Y FAUNA (Codigo Alimentario, Comercio Internacional de Especies, Hoja Ruta Transporte Yerba, Ley de Carnes, Ley de Caza, Ley de Fauna, Ley de Pesca, Ley de Senasa, Monumentos Naturales, Programa Nacional para La Prevencion de La Enfermedad Hlb de Los Citrus, Registro Federal de Pesca, Riqueza Forestal)
- GRANOS (Afrecho, Cebada, Centeno, Colza, Lino, Maiz, Semillas de Sorgo, Soja, Sorgo, Trigo)
- MERCADERIA (Alimentos, Animales, Articulo de Tienda, Articulo Del Hogar, Autopartes, Bazar y Menaje, Bebidas, Cigarrillos, Combustibles y Lubricantes, Electricidad-Electronica, Electrodomesticos, Elementos de Limpieza, Equipo Militar y de Seguridad, Equipos, Herramientas y Repuestos, Indumentaria Textil y Confecciones, Jardineria, Joyeria, Madera, Maquina, Nautica, Productos Medicos o Farmaceuticos o Laboratorio, Veterinaria)
- PATRIMONIO CULTURAL, ARQUEOLOGICO Y PALEONTOLOGICO (Circulacion de Obras de Arte, Hallazgos, Proteccion Del Patrimonio Arqueologico y Paleontologico, Registro Nacional Del Patrimonio Arqueologico)
- PRECURSORES QUIMICOS (Acetato Isopropilico, Acido Fenilacetico, Acido Formico, Acido Lisergico, Acido Metilglicidico, Acido N Acetilantranilico, Acido O Aminobenzoico, Acido Yodhidrico, Alcohol Isobutilico)
- RESIDUOS PELIGROSOS (Desechos de Aceite y Agua o de Hidrocarburos y Agua, Desechos de La Industria de La Energia, Desechos de La Industria Quimica, Desechos de Medicamentos y Productos Farmaceuticos para La Salud Humana y Animal, Desechos de Productos Fitosanitarios, Desechos Derivados de Resinas, Latex, Plastificantes o Colas y Adhesivos, Desechos Derivados de Tintas, Colorantes, Pigmentos, Pinturas, Lacas o Barnices, Desechos que Tienen Cianuro, Residuos Con Alquitran)

REGLAS:
1. Si el elemento es sinónimo de uno existente (ej: "Aparato celular" -> "Celular"), marcá es_sinonimo: true y sinonimo_de: "Celular".
2. Si es nuevo (ej: "Placa de video"), clasificalo en su Incautación y Tipo exacto.
3. Respondé estrictamente JSON: {"opciones":[{"subtipo_sugerido":"...","incautacion":"...","tipo":"...","es_sinonimo":false,"sinonimo_de":null,"razon":"...","confianza":"alta"}]}`;

    const userPrompt = `Clasificá: "${query.trim()}".`;
    let ultimoError = null;

    for (const modelName of AVAILABLE_MODELS) {
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
