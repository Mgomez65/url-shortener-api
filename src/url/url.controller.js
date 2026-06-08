const {
  createShortUrl,
  getUrlByShortCode,
  incrementClicks,
  getUrlStats,
} = require('./url.service');

function buildShortUrl(req, shortCode) {
  const host = req.headers.host || `localhost:${process.env.PORT || 3000}`;
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}/${shortCode}`;
}

async function shortenUrl(req, res) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'El campo url es obligatorio y debe ser una cadena' });
  }

  try {
    const saved = await createShortUrl(url);
    return res.status(201).json({
      shortUrl: buildShortUrl(req, saved.shortCode),
      shortCode: saved.shortCode,
      originalUrl: saved.originalUrl,
    });
  } catch (error) {
    console.error('Error creando URL corta:', error);
    return res.status(500).json({ error: 'No se pudo crear la URL corta' });
  }
}

async function redirectShortCode(req, res) {
  const { shortCode } = req.params;

  const url = await getUrlByShortCode(shortCode);
  if (!url) {
    return res.status(404).json({ error: 'Código corto no encontrado' });
  }

  await incrementClicks(shortCode);
  return res.redirect(url.originalUrl);
}

async function statsShortCode(req, res) {
  const { shortCode } = req.params;

  const stats = await getUrlStats(shortCode);
  if (!stats) {
    return res.status(404).json({ error: 'Código corto no encontrado' });
  }

  return res.json(stats);
}

module.exports = {
  shortenUrl,
  redirectShortCode,
  statsShortCode,
};
