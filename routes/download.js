const express = require('express');
const router = express.Router();
const youtubedl = require('youtube-dl-exec');
const { getOptions } = require('../config/ytdlp');
const path = require('path');
const fs = require('fs');

router.post('/', async (req, res) => {
  const { url, quality } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  const downloadsDir = path.join(__dirname, '..', 'downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  // Nettoyage automatique des fichiers de plus de 2 heures
  const now = Date.now();
  try {
    const files = fs.readdirSync(downloadsDir);
    for (const file of files) {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 7200000) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (e) {
    console.error('Erreur nettoyage:', e.message);
  }

  const beforeFiles = new Set(fs.readdirSync(downloadsDir));
  
  // Sélecteur de format amélioré
  let formatSelector = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
  if (quality === 'high') formatSelector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
  else if (quality === 'low') formatSelector = 'bestvideo[height<=480]+bestaudio/best[height<=480]';

  console.log(`📥 Téléchargement (${quality || 'default'}): ${url}`);

  try {
    await youtubedl(url, getOptions(url, {
      output: path.join(downloadsDir, '%(title)s.%(ext)s'),
      format: formatSelector,
      noPlaylist: true,
      mergeOutputFormat: 'mp4',
    }));
    
    const afterFiles = fs.readdirSync(downloadsDir);
    let newFile = afterFiles.find(f => !beforeFiles.has(f));
    
    if (!newFile) {
      const files = afterFiles
        .map(f => ({ name: f, time: fs.statSync(path.join(downloadsDir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
      newFile = files[0]?.name;
    }

    if (!newFile) throw new Error('Le fichier n\'a pas pu être créé');

    const filePath = path.join(downloadsDir, newFile);
    const stat = fs.statSync(filePath);
    
    console.log(`✅ Succès: ${newFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

    res.json({ 
      success: true, 
      filename: newFile, 
      size: stat.size,
      url: `/videos/${encodeURIComponent(newFile)}`
    });

  } catch (error) {
    console.error('❌ Erreur download:', error.message);
    res.status(500).json({ 
      error: 'Échec du téléchargement', 
      details: error.message 
    });
  }
});

module.exports = router;