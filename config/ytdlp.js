const path = require('path');
const fs = require('fs');

/**
 * Retourne les options optimisées pour yt-dlp afin d'éviter les blocages (403, 400).
 * @param {string} url - L'URL de la vidéo
 * @param {Object} extraOptions - Options supplémentaires
 */
const getOptions = (url, extraOptions = {}) => {
  let cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  
  // Support pour Render (Secret Files ou Variable d'env)
  if (process.env.YT_COOKIES && !fs.existsSync(cookiesPath)) {
    try {
      fs.writeFileSync(cookiesPath, process.env.YT_COOKIES);
      console.log('✅ Cookies créés à partir de la variable d\'environnement');
    } catch (err) {
      console.error('❌ Erreur création cookies via ENV:', err.message);
    }
  }

  const hasCookies = fs.existsSync(cookiesPath);

  const baseOptions = {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language: en-US,en;q=0.9,fr;q=0.8',
      'Sec-Fetch-Mode: navigate',
      'Origin: https://www.instagram.com',
      'Referer: https://www.instagram.com/'
    ],
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    // Flags critiques pour éviter les blocages
    noCacheDir: true,
    rmCacheDir: true,
    extractorArgs: 'instagram:get_comments=0',
    sleepInterval: 2,
    ...extraOptions
  };

  if (hasCookies) {
    console.log('🍪 Utilisation des cookies pour le téléchargement');
    baseOptions.cookies = cookiesPath;
  }

  return baseOptions;
};

module.exports = { getOptions };
