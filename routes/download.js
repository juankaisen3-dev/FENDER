const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

router.post('/', async (req, res) => {
  const { url, quality } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  const downloadsDir = path.join(__dirname, '..', 'downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  // Nettoyage des fichiers de plus d'une heure
  const now = Date.now();
  fs.readdirSync(downloadsDir).forEach(file => {
    const filePath = path.join(downloadsDir, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > 3600000) {
      try { fs.unlinkSync(filePath); } catch(e) {}
    }
  });

  const beforeFiles = new Set(fs.readdirSync(downloadsDir));
  const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');

  let formatSelector = 'best[height<=720]';
  if (quality === 'high') formatSelector = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
  else if (quality === 'medium') formatSelector = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
  else if (quality === 'low') formatSelector = 'worstvideo+worstaudio/worst';

  const command = `yt-dlp -o "${outputTemplate}" -f "${formatSelector}" --no-playlist --merge-output-format mp4 "${url}"`;

  console.log(`📥 Téléchargement (${quality}): ${url}`);

  try {
    await execPromise(command, { timeout: 600000 });
    console.log('✅ Téléchargement terminé');

    const afterFiles = fs.readdirSync(downloadsDir);
    let newFile = afterFiles.find(f => !beforeFiles.has(f));
    if (!newFile) {
      const files = afterFiles
        .map(f => ({ name: f, time: fs.statSync(path.join(downloadsDir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
      newFile = files[0]?.name;
    }
    if (!newFile) throw new Error('Aucun fichier créé');

    const filePath = path.join(downloadsDir, newFile);
    const stat = fs.statSync(filePath);
    console.log(`📁 Fichier prêt: ${newFile} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

    res.json({ success: true, filename: newFile, size: stat.size });

  } catch (error) {
    console.error('❌ Erreur download:', error.message);
    res.status(500).json({ error: 'Échec du téléchargement', details: error.stderr || error.message });
  }
});

module.exports = router;