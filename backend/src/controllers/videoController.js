const youtubedl = require('youtube-dl-exec');
const { getOptions } = require('../config/ytdlp');
const path = require('path');
const fs = require('fs');

const downloadsDir = path.join(__dirname, '..', '..', '..', 'downloads');

/**
 * Analyse une URL pour récupérer les infos de la vidéo
 */
exports.getVideoInfo = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  console.log(`🔍 Analyse de l'URL : ${url}`);

  try {
    const info = await youtubedl(url, getOptions(url, {
      dumpSingleJson: true,
    }));

    const formatDuration = (seconds) => {
      if (!seconds) return "00:00";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
      return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    res.json({
      success: true,
      title: info.title,
      duration: formatDuration(info.duration),
      thumbnail: info.thumbnail,
      uploader: info.uploader || info.extractor,
      views: info.view_count ? new Intl.NumberFormat().format(info.view_count) : 'N/A',
      platform: info.extractor_key || 'Web',
      original_url: info.webpage_url
    });

  } catch (error) {
    console.error('❌ Erreur info:', error.message);
    res.status(500).json({ 
      error: 'Impossible de récupérer les informations',
      details: error.message
    });
  }
};

/**
 * Télécharge la vidéo avec la qualité spécifiée
 */
exports.downloadVideo = async (req, res) => {
  const { url, quality } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const beforeFiles = new Set(fs.readdirSync(downloadsDir));
  
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
      const sorted = afterFiles
        .map(f => ({ name: f, time: fs.statSync(path.join(downloadsDir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
      newFile = sorted[0]?.name;
    }

    const filePath = path.join(downloadsDir, newFile);
    const stat = fs.statSync(filePath);
    
    res.json({ 
      success: true, 
      filename: newFile, 
      size: stat.size,
      url: `/videos/${encodeURIComponent(newFile)}`
    });

  } catch (error) {
    console.error('❌ Erreur download:', error.message);
    res.status(500).json({ error: 'Échec du téléchargement', details: error.message });
  }
};

/**
 * Récupère la liste des vidéos locales
 */
exports.listVideos = (req, res) => {
  if (!fs.existsSync(downloadsDir)) return res.json([]);
  
  const files = fs.readdirSync(downloadsDir)
    .filter(f => /\.(mp4|webm|mkv|mov|avi|flv|mp3|m4a|opus|flac)$/i.test(f))
    .map(f => {
      const stats = fs.statSync(path.join(downloadsDir, f));
      return {
        name: f,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: stats.mtime,
        url: `/videos/${encodeURIComponent(f)}`
      };
    })
    .sort((a, b) => b.date - a.date);
  
  res.json(files);
};

/**
 * Supprime une vidéo locale
 */
exports.deleteVideo = (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = path.join(downloadsDir, filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Vidéo supprimée' });
  } else {
    res.status(404).json({ error: 'Fichier non trouvé' });
  }
};
