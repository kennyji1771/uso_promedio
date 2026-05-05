const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Servir index.html desde raíz

// Estructura inicial de ejemplo (se reemplazará al cargar CSV)
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
  const lines = csvText.split(/\r?\n/);
  let startIndex = 0;
  if (lines[0].toLowerCase().includes('modulo') && lines[0].toLowerCase().includes('tema')) startIndex = 1;
  
  const modulosMap = new Map(); // key: nombre módulo, value: { titulo, temas: [] }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    
    // Parseo simple respetando comillas
    let parts = [];
    let inQuote = false;
    let current = '';
    for (let ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current.trim());
    
    if (parts.length < 7) while (parts.length < 7) parts.push('');
    const [modulo, tema, contenido, arbol, consideraciones, biografia, evaluacion] = parts;
    
    if (!modulo) continue;
    
    if (!modulosMap.has(modulo)) {
      modulosMap.set(modulo, { titulo: modulo, temas: [] });
    }
    const moduloObj = modulosMap.get(modulo);
    const idTema = `tema_${Date.now()}_${i}`;
    moduloObj.temas.push({
      id: idTema,
      titulo: tema,
      contenido: contenido,
      arbol: arbol,
      consideraciones: consideraciones,
      biografia: biografia,
      evaluacion: evaluacion
    });
  }
  
  // Convertir mapa a array
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
  // Admin si es 'admin' o la cédula personal
  if (cedula === 'admin' || cedula === '10849867') {
    res.json({ cedula: cedula, nombre: 'Administrador', rol: 'admin' });
  } else {
    res.json({ cedula, nombre: 'Estudiante', rol: 'estudiante' });
  }
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
    res.status(500).json({ error: 'Error al procesar el CSV: ' + err.message });
  }
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor local en http://localhost:${PORT}`));
}

module.exports = app;