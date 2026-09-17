import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const elementosJsPath = path.resolve(__dirname, '../../elementos.js');
const rawContent = fs.readFileSync(elementosJsPath, 'utf-8');

// Parsear el array elementosTodos de elementos.js
const arrayMatch = rawContent.match(/export\s+const\s+elementosTodos\s*=\s*(\[[\s\S]*\]);?/);

if (!arrayMatch) {
  console.error('No se pudo encontrar el array elementosTodos en elementos.js');
  process.exit(1);
}

let elementosTodos;
try {
  const jsCode = arrayMatch[1];
  elementosTodos = new Function(`return ${jsCode}`)();
} catch (e) {
  console.error('Error al evaluar elementosTodos:', e.message);
  process.exit(1);
}

console.log(`Leídos ${elementosTodos.length} elementos de elementos.js`);

const taxonomia = {};
const incautacionesSet = new Set();
const tiposPorIncautacion = {};
const listaCompletaSubtipos = [];

elementosTodos.forEach(item => {
  const inc = item.incautacion?.trim();
  const tip = item.tipo?.trim();
  const sub = item.subtipo?.trim();

  if (inc && tip) {
    incautacionesSet.add(inc);
    if (!tiposPorIncautacion[inc]) {
      tiposPorIncautacion[inc] = new Set();
    }
    tiposPorIncautacion[inc].add(tip);
  }
  if (sub && tip && inc) {
    listaCompletaSubtipos.push({
      subtipo: sub,
      tipo: tip,
      incautacion: inc
    });
  }
});

Object.keys(tiposPorIncautacion).sort().forEach(inc => {
  taxonomia[inc] = Array.from(tiposPorIncautacion[inc]).sort();
});

const outputData = {
  totalElementos: elementosTodos.length,
  incautaciones: Object.keys(taxonomia),
  taxonomia: taxonomia,
};

const outputDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Guardar taxonomia.json
const outputPath = path.join(outputDir, 'taxonomia.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

// 2. Guardar todos_elementos.json
const outputAllPath = path.join(outputDir, 'todos_elementos.json');
fs.writeFileSync(outputAllPath, JSON.stringify(listaCompletaSubtipos, null, 2), 'utf-8');

console.log(`Taxonomía generada con éxito en ${outputPath}`);
console.log(`Lista completa de ${listaCompletaSubtipos.length} elementos guardada en ${outputAllPath}`);
