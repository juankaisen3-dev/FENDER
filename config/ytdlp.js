const path = require('path');
const fs = require('fs');

/**
 * Retourne les options optimisées pour yt-dlp afin d'éviter les blocages (403, 400).
 * @param {string} url - L'URL de la vidéo
 * @param {Object} extraOptions - Options supplémentaires
 */
const getOptions = (url, extraOptions = {}) => {
  const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  const hasCookies = fs.existsSync(cookiesPath);

  const baseOptions = {
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    addHeader: [
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language: en-US,en;q=0.9,fr;q=0.8',
      'Sec-Fetch-Mode: navigate'
    ],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    referer: 'https://www.google.com/',
    // Flags critiques pour éviter les blocages
    forceIpv4: true,
    noCacheDir: true,
    rmCacheDir: true,
    ...extraOptions
  };

  if (hasCookies) {
    console.log('🍪 Utilisation des cookies pour le téléchargement');
    baseOptions.cookies = cookiesPath;
  }

  return baseOptions;
};

module.exports = { getOptions };
