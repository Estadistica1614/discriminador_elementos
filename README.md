# Discriminador de Elementos Secuestrados - Policía Federal Argentina (PFA)

Sistema inteligente para la identificación, búsqueda y clasificación de bienes secuestrados e incautados, integrando un catálogo oficial de más de **2.500 elementos**, motor de **Búsqueda Difusa (Fuzzy Search)** y categorización asistida por **Inteligencia Artificial (Google Gemini API)** bajo una taxonomía institucional cerrada.

---

## 🚀 Características Principales

1. **Catálogo Oficial PFA:**
   - 10 Incautaciones oficiales.
   - 97 Tipos de elementos.
   - Más de 2.500 subtipos oficiales cargados.

2. **Búsqueda Difusa (Fuzzy Search con Fuse.js):**
   - Predictivo instantáneo mientras el usuario escribe (< 2 ms de respuesta).
   - Tolerancia a faltas ortográficas, omisión de tildes y errores de tipeo.
   - Soporte de navegación con teclado (flechas arriba/abajo y Enter).

3. **Inteligencia Artificial con Taxonomía Estricta (Google Gemini):**
   - **Mapeo de Sinónimos:** Asocia automáticamente variantes coloquiales (ej. *"Aparato celular"* $\rightarrow$ *"Celular"* en `MERCADERIA` $\rightarrow$ `Electricidad-Electronica`).
   - **Clasificación de Elementos Nuevos:** Si el bien no existe (ej. *"Placa de video"*), la IA sugiere hasta 2 encuadres válidos dentro del árbol oficial (`MERCADERIA` $\rightarrow$ `Electricidad-Electronica`) justificando la decisión.
   - **Garantía Taxonómica:** La IA tiene prohibido inventar categorías; siempre devuelve opciones validadas contra las 10 incautaciones y 97 tipos oficiales.

4. **Árbol Taxonómico Interactivo Lateral:**
   - Explorador de Incautaciones y Tipos con subniveles.
   - Buscador interno y selección con un solo clic para autocompletar.

---

## 🛠️ Estructura del Proyecto

```
6. Discriminador_elementos_secuestrados/
├── backend/                  # Servidor API Node.js + Express
│   ├── data/                 # Taxonomía compilada y catálogo completo
│   ├── services/             # Servicio de Gemini (geminiService.js)
│   ├── scripts/              # Extractor de taxonomía (extractTaxonomia.js)
│   ├── server.js             # Endpoints /api/health y /api/clasificar
│   └── .env                  # Variables de entorno (GEMINI_API_KEY)
├── frontend/                 # Aplicación Vue 3 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # AppHeader, SearchAutocomplete, ResultCard, AiSuggestionCard, TaxonomyTree...
│   │   ├── composables/      # useFuzzySearch.js, useClassifier.js
│   │   ├── constants/        # Paleta institucional PFA y estilos
│   │   ├── data/             # elementos.js y arbolTaxonomia.json
│   │   ├── App.vue           # Vista principal (Layout 2 columnas)
│   │   └── main.js
│   └── vite.config.js
├── elementos.js              # Archivo maestro original (2.530 registros)
└── package.json
```

---

## ⚙️ Puesta en Marcha

### 1. Configurar la API Key de Gemini
En el archivo [backend/.env](file:///c:/Users/gusta/OneDrive/Documentos/00proyectos--Web/PFA/6.%20Discriminador_elementos_secuestrados/backend/.env):
```env
PORT=3001
GEMINI_API_KEY=tu_api_key_aqui
```

### 2. Iniciar el Backend
```bash
npm run dev:backend
```

### 3. Iniciar el Frontend
```bash
npm run dev:frontend
```
