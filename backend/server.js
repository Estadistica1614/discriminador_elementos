import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiService } from './services/geminiService.js';
import { elementosTodos } from '../frontend/src/data/elementos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const geminiService = new GeminiService();

// Extraer taxonomía en memoria dinámicamente
function getTaxonomiaData() {
  const tree = {};
  elementosTodos.forEach(e => {
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
  return {
    totalElementos: elementosTodos.length,
    incautaciones: Object.keys(res),
    taxonomia: res
  };
}

// Endpoint de salud
app.get('/api/health', (req, res) => {
  const tax = getTaxonomiaData();
  res.json({
    status: 'ok',
    message: 'Backend Discriminador PFA Activo (Dinámico en Memoria)',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    totalElementos: tax.totalElementos,
    totalIncautaciones: tax.incautaciones.length
  });
});

// Endpoint para obtener la taxonomía oficial
app.get('/api/taxonomia', (req, res) => {
  res.json(getTaxonomiaData());
});

// Endpoint para clasificar elemento con IA
app.post('/api/clasificar', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'El campo "query" es requerido y no puede estar vacío.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'API Key de Gemini no configurada en el servidor backend.',
        code: 'MISSING_API_KEY'
      });
    }

    const resultado = await geminiService.clasificarElemento(query);
    res.json(resultado);
  } catch (error) {
    console.error('Error en /api/clasificar:', error);
    res.status(500).json({
      error: error.message || 'Error interno al consultar la IA',
      detalles: error.toString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Servidor Discriminador PFA escuchando en: http://localhost:${PORT}`);
  console.log(` Fuente única de datos: frontend/src/data/elementos.js (${elementosTodos.length} elementos)`);
  console.log(` Estado API Key Gemini: ${process.env.GEMINI_API_KEY ? 'CONFIGURADA ✅' : 'PENDIENTE ⚠️'}`);
  console.log(`=================================================`);
});
