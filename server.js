const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'downloads')));

// Création des dossiers nécessaires
['downloads', 'public', 'routes'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Routes API
app.use('/api/info', require('./routes/info'));
app.use('/api/download', require('./routes/download'));

// Liste des vidéos téléchargées
app.get('/api/videos', (req, res) => {
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) return res.json([]);
  
  const files = fs.readdirSync(downloadsDir)
    .filter(f => /\.(mp4|webm|mkv|mov|avi|flv|mp3|m4a|opus|flac)$/i.test(f))
    .map(f => {
      const stats = fs.statSync(path.join(downloadsDir, f));
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        bytes: stats.size,
        date: stats.mtime,
        url: `/videos/${encodeURIComponent(f)}`
      };
    })
    .sort((a, b) => b.date - a.date);
  
  res.json(files);
});

// Supprimer une vidéo
app.delete('/api/videos/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = path.join(__dirname, 'downloads', filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Vidéo supprimée' });
  } else {
    res.status(404).json({ error: 'Fichier non trouvé' });
  }
});

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('⚠️ Erreur non capturée:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Promesse rejetée:', reason);
});

// Démarrage
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Serveur FENDER lancé sur http://localhost:${PORT}`);
  console.log(`📁 Dossier vidéos: ${path.join(__dirname, 'downloads')}`);
  console.log(`\n📍 Routes disponibles:`);
  console.log(`   GET  /api/videos       - Liste des vidéos`);
  console.log(`   POST /api/info         - Infos d'une URL`);
  console.log(`   POST /api/download     - Télécharger une vidéo`);
  console.log(`   DEL  /api/videos/:name - Supprimer une vidéo\n`);
});