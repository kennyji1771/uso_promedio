const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // para parsear JSON
app.use(express.static(path.join(__dirname, '../frontend'))); // servir archivos estáticos

// Datos en memoria (luego conectaremos a Google Sheets vía API, pero empezamos así)
let contenidoCurso = {
  trayectos: [{
    titulo: "Curso principal",
    semestres: [{
      titulo: "Único semestre",
      modulos: [
        {
          titulo: "Módulo 1: Fundamentos de los promedios",
          temas: [
            { id: "t1", titulo: "¿Qué es un promedio y por qué importa?", contenido: "...", arbol: "...", consideraciones: "...", biografia: "...", evaluacion: "..." }
          ]
        }
      ]
    }]
  }]
};

// Endpoint para obtener el contenido del curso
app.get('/api/contenido', (req, res) => {
  res.json({ contenido: contenidoCurso });
});

// Endpoint para obtener el glosario (por ahora vacío)
app.get('/api/glosario', (req, res) => {
  res.json([]);
});

// Endpoint para login (simulado)
app.post('/api/login', (req, res) => {
  const { cedula } = req.body;
  // Simulamos un usuario admin por defecto (usted luego conectará a Google Sheets)
  if (cedula === 'admin') {
    res.json({ cedula: 'admin', nombre: 'Admin', apellido: '', rol: 'admin' });
  } else {
    res.json({ cedula, nombre: 'Estudiante', apellido: '', rol: 'estudiante' });
  }
});

// Endpoint para guardar progreso (simulado)
app.post('/api/progreso', (req, res) => {
  const { cedula, progreso } = req.body;
  console.log(`Guardando progreso de ${cedula}:`, progreso);
  res.json({ success: true });
});

// Endpoint para obtener progreso
app.get('/api/progreso/:cedula', (req, res) => {
  res.json({ progreso: '{}' });
});

// Endpoint para carga masiva (solo admin)
app.post('/api/carga-masiva', (req, res) => {
  const { adminCedula, csvContent } = req.body;
  if (adminCedula !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  // Aquí parsearía el CSV y actualizaría contenidoCurso
  res.json({ success: true, filasAgregadas: 1 });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Nexus corriendo en http://localhost:${PORT}`);
});