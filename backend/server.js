import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiService } from './services/geminiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Cargar catálogo de taxonomía
const taxonomiaPath = path.resolve(__dirname, './data/taxonomia.json');
let taxonomiaData = null;
if (fs.existsSync(taxonomiaPath)) {
  taxonomiaData = JSON.parse(fs.readFileSync(taxonomiaPath, 'utf-8'));
}

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend Discriminador PFA Activo',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    totalIncautaciones: taxonomiaData ? taxonomiaData.incautaciones.length : 0
  });
});

// Endpoint para obtener la taxonomía oficial
app.get('/api/taxonomia', (req, res) => {
  if (!taxonomiaData) {
    return res.status(500).json({ error: 'Taxonomía no disponible' });
  }
  res.json(taxonomiaData);
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
  console.log(` Estado API Key Gemini: ${process.env.GEMINI_API_KEY ? 'CONFIGURADA ✅' : 'PENDIENTE ⚠️ (Definir en backend/.env)'}`);
  console.log(`=================================================`);
});
