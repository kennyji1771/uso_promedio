const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Rutas de ejemplo ---
let contenidoCurso = {
  trayectos: [{
    titulo: "Curso principal",
    semestres: [{
      titulo: "Único semestre",
      modulos: [
        {
          titulo: "Módulo 1: Fundamentos de los promedios",
          temas: [
            { id: "t1", titulo: "¿Qué es un promedio?", contenido: "Texto...", arbol: "", consideraciones: "", biografia: "", evaluacion: "" }
          ]
        }
      ]
    }]
  }]
};

app.get('/api/contenido', (req, res) => {
  res.json({ contenido: contenidoCurso });
});

app.post('/api/login', (req, res) => {
  const { cedula } = req.body;
  if (cedula === 'admin') {
    res.json({ cedula: 'admin', nombre: 'Admin', rol: 'admin' });
  } else {
    res.json({ cedula, nombre: 'Estudiante', rol: 'estudiante' });
  }
});

app.post('/api/carga-masiva', (req, res) => {
  const { adminCedula } = req.body;
  if (adminCedula !== 'admin') return res.status(403).json({ error: 'No autorizado' });
  res.json({ success: true, filasAgregadas: 1 });
});

// Exportar para Vercel (y opcionalmente escuchar en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Local server on http://localhost:${PORT}`));
}
module.exports = app;