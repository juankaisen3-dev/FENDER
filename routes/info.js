const express = require('express');
const router = express.Router();
const youtubedl = require('youtube-dl-exec');

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      noCheckCertificates: true
    });

    const formats = info.formats
      .filter(f => f.height && f.height > 0 && f.vcodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        resolution: parseInt(f.height)
      }))
      .sort((a, b) => b.resolution - a.resolution);

    const high = formats.find(f => f.resolution >= 1080) || formats[0];
    const medium = formats.find(f => f.resolution >= 720 && f.resolution < 1080) || formats[0];
    const low = formats.find(f => f.resolution < 720) || formats[formats.length-1];

    res.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader,
      formats_available: {
        high: high?.format_id || null,
        medium: medium?.format_id || null,
        low: low?.format_id || null
      }
    });

  } catch (error) {
    console.error('❌ Erreur info:', error.message);
    res.status(500).json({ error: 'Impossible de récupérer les informations' });
  }
});

module.exports = router;