const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // sirve index.html desde raíz

// Estructura de ejemplo (se reemplaza al cargar CSV)
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

// Función para parsear CSV a módulos y temas
function parseCSVToCourse(csvText) {
    // Eliminar BOM si existe
    if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);
    
    // Parser manual que respeta comillas y saltos de línea internos
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
                // Comilla doble escapada
                currentField += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (ch === ',' && !inQuote) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((ch === '\n' || (ch === '\r' && csvText[i+1] === '\n')) && !inQuote) {
            // Fin de fila
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
    
    if (rows.length === 0) return { trayectos: [] };
    
    // Detectar cabecera (si la primera fila contiene 'Modulo' y 'Tema')
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

// Endpoints
app.get('/api/contenido', (req, res) => {
  res.json({ contenido: contenidoCurso });
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
  // Por ahora solo simula éxito (puedes ampliarlo después)
  res.json({ success: true });
});

app.post('/api/progreso', (req, res) => {
  // Simula guardado de progreso
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

app.get('/api/glosario', (req, res) => {
  res.json([]);
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor local en http://localhost:${PORT}`));
}

module.exports = app;