const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // sirve index.html desde raíz

// Estructura del curso en memoria (se reemplaza al cargar CSV/PDF)
let contenidoCurso = {
  trayectos: [{
    titulo: "Curso principal",
    semestres: [{
      titulo: "Único semestre",
      modulos: [
        {
          titulo: "Módulo 1: Fundamentos de los promedios",
          temas: [
            { id: "t1", titulo: "¿Qué es un promedio?", contenido: "Contenido de ejemplo...", arbol: "", consideraciones: "", biografia: "", evaluacion: "" }
          ]
        }
      ]
    }]
  }]
};

// Glosario en memoria
let glosarioData = [];

// ================= FUNCIÓN DE PARSEO CSV ROBUSTO =================
function parseCSVGeneral(csvText, expectedCols) {
  // Eliminar BOM si existe
  if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);
  
  const rows = [];
  let inQuote = false;
  let currentRow = [];
  let currentField = '';
  let i = 0;
  const n = csvText.length;
  
  while (i < n) {
    const ch = csvText[i];
    if (ch === '"') {
      if (inQuote && csvText[i+1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((ch === '\n' || (ch === '\r' && csvText[i+1] === '\n')) && !inQuote) {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      if (ch === '\r') i++; // saltar \r
    } else {
      currentField += ch;
    }
    i++;
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
}

function parseCSVToCourse(csvText) {
  const rows = parseCSVGeneral(csvText, 7);
  if (rows.length === 0) return { trayectos: [] };
  
  let startIndex = 0;
  const firstRow = rows[0];
  if (firstRow.some(cell => cell.toLowerCase().includes('modulo')) && 
      firstRow.some(cell => cell.toLowerCase().includes('tema'))) {
    startIndex = 1;
  }
  
  const modulosMap = new Map();
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 7) continue;
    const [modulo, tema, contenido, arbol, consideraciones, biografia, evaluacion] = row;
    if (!modulo || modulo.trim() === '') continue;
    if (!modulosMap.has(modulo)) {
      modulosMap.set(modulo, { titulo: modulo, temas: [] });
    }
    const moduloObj = modulosMap.get(modulo);
    const idTema = `tema_${Date.now()}_${i}_${Math.random()}`;
    moduloObj.temas.push({
      id: idTema,
      titulo: tema || '(sin título)',
      contenido: contenido || '',
      arbol: arbol || '',
      consideraciones: consideraciones || '',
      biografia: biografia || '',
      evaluacion: evaluacion || ''
    });
  }
  
  const modulos = Array.from(modulosMap.values());
  return {
    trayectos: [{
      titulo: "Curso principal",
      semestres: [{
        titulo: "Único semestre",
        modulos: modulos
      }]
    }]
  };
}

// ================= ENDPOINTS =================
app.get('/api/contenido', (req, res) => {
  res.json({ contenido: contenidoCurso });
});

app.get('/api/glosario', (req, res) => {
  res.json(glosarioData);
});

app.post('/api/login', (req, res) => {
  const { cedula } = req.body;
  if (cedula === 'admin' || cedula === '10849867') {
    res.json({ cedula, nombre: 'Administrador', rol: 'admin' });
  } else {
    res.json({ cedula, nombre: 'Estudiante', rol: 'estudiante' });
  }
});

app.post('/api/registro', (req, res) => {
  res.json({ success: true });
});

app.post('/api/progreso', (req, res) => {
  res.json({ success: true });
});

app.post('/api/carga-masiva', (req, res) => {
  const { adminCedula, csvContent } = req.body;
  if (adminCedula !== 'admin' && adminCedula !== '10849867') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const nuevoCurso = parseCSVToCourse(csvContent);
    contenidoCurso = nuevoCurso;
    const totalTemas = nuevoCurso.trayectos[0].semestres[0].modulos.reduce((acc, m) => acc + m.temas.length, 0);
    res.json({ success: true, filasAgregadas: totalTemas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar CSV: ' + err.message });
  }
});

app.post('/api/cargar-glosario', (req, res) => {
  const { adminCedula, csvContent } = req.body;
  if (adminCedula !== 'admin' && adminCedula !== '10849867') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    const rows = parseCSVGeneral(csvContent, 8);
    if (rows.length === 0) throw new Error('CSV vacío');
    
    let startIndex = 0;
    const firstRow = rows[0];
    if (firstRow.some(cell => cell.toLowerCase().includes('termino')) && 
        firstRow.some(cell => cell.toLowerCase().includes('definicion'))) {
      startIndex = 1;
    }
    
    const nuevoGlosario = [];
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 8) continue;
      const [termino, categoria, definicion, solucion, fuente, ejemplo, cita, url] = row;
      nuevoGlosario.push({
        termino, categoria, definicion, solucion, fuente, ejemplo, cita, url
      });
    }
    glosarioData = nuevoGlosario;
    res.json({ success: true, items: nuevoGlosario.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar CSV de glosario: ' + err.message });
  }
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor local en http://localhost:${PORT}`));
}

module.exports = app;