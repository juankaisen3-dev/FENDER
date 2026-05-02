const express = require('express');
const router = express.Router();
const youtubedl = require('youtube-dl-exec');
const { getOptions } = require('../config/ytdlp');

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  console.log(`🔍 Analyse de l'URL : ${url}`);

  try {
    const info = await youtubedl(url, getOptions(url, {
      dumpSingleJson: true,
      youtubeSkipDashManifest: true,
    }));

    // Formater la durée (secondes en MM:SS)
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
      details: error.message.includes('not supported') ? 'Plateforme non supportée' : 'Lien invalide ou problème de connexion'
    });
  }
});

module.exports = router;