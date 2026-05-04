const express = require('express');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./routes/videoRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (Frontend compilé)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

// Servir les vidéos téléchargées
app.use('/videos', express.static(path.join(__dirname, '..', '..', 'downloads')));

// Routes API
app.use('/api', videoRoutes);

// Fallback pour le SPA (React)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
  res.sendFile(indexPath);
});

module.exports = app;
