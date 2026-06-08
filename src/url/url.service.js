const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const redis = require('../redis.client');

const prisma = new PrismaClient();
const ORIGINAL_URL_CACHE_PREFIX = 'url:original:';
const SHORT_CODE_CACHE_PREFIX = 'url:code:';

function generateShortCode(length = 7) {
  return crypto
    .randomBytes(Math.ceil((length * 6) / 8))
    .toString('base64')
    .replace(/\+|\/|=/g, '')
    .slice(0, length)
    .toLowerCase();
}

function buildOriginalUrlCacheKey(originalUrl) {
  return `${ORIGINAL_URL_CACHE_PREFIX}${originalUrl.toLowerCase()}`;
}

function buildShortCodeCacheKey(shortCode) {
  return `${SHORT_CODE_CACHE_PREFIX}${shortCode}`;
}

async function cacheUrlRecord(urlRecord) {
  const cacheKey = buildShortCodeCacheKey(urlRecord.shortCode);
  const originalCacheKey = buildOriginalUrlCacheKey(urlRecord.originalUrl);
  const urlData = {
    originalUrl: urlRecord.originalUrl,
    shortCode: urlRecord.shortCode,
    clicks: urlRecord.clicks,
    createdAt: urlRecord.createdAt,
    updatedAt: urlRecord.updatedAt,
  };

  await Promise.all([
    redis.set(originalCacheKey, urlRecord.shortCode),
    redis.set(cacheKey, JSON.stringify(urlData)),
  ]);
}

async function findUrlByOriginalUrl(originalUrl) {
  const normalizedUrl = originalUrl.trim();
  const originalCacheKey = buildOriginalUrlCacheKey(normalizedUrl);
  const cachedShortCode = await redis.get(originalCacheKey);

  if (cachedShortCode) {
    const cachedUrl = await getUrlByShortCode(cachedShortCode);
    if (cachedUrl) {
      return cachedUrl;
    }
  }

  const urlRecord = await prisma.url.findFirst({
    where: { originalUrl: normalizedUrl },
  });

  if (urlRecord) {
    await cacheUrlRecord(urlRecord);
  }

  return urlRecord;
}

async function createShortUrl(originalUrl) {
  const normalizedUrl = originalUrl.trim();

  const existingUrl = await findUrlByOriginalUrl(normalizedUrl);
  if (existingUrl) {
    return existingUrl;
  }

  let shortCode;
  let collision;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    shortCode = generateShortCode();
    collision = await prisma.url.findUnique({
      where: { shortCode },
    });

    if (!collision) {
      break;
    }
  }

  if (collision) {
    throw new Error('No se pudo generar un código corto único');
  }

  const url = await prisma.url.create({
    data: {
      originalUrl: normalizedUrl,
      shortCode,
    },
  });

  await cacheUrlRecord(url);
  return url;
}

async function getUrlByShortCode(shortCode) {
  const cacheKey = buildShortCodeCacheKey(shortCode);
  const cachedValue = await redis.get(cacheKey);

  if (cachedValue) {
    try {
      return JSON.parse(cachedValue);
    } catch (error) {
      console.error('Error parsing Redis cache for shortCode:', shortCode, error);
    }
  }

  const urlRecord = await prisma.url.findUnique({
    where: { shortCode },
  });

  if (urlRecord) {
    await cacheUrlRecord(urlRecord);
  }

  return urlRecord;
}

async function incrementClicks(shortCode) {
  const url = await prisma.url.update({
    where: { shortCode },
    data: { clicks: { increment: 1 } },
  });

  const cacheKey = buildShortCodeCacheKey(shortCode);
  const cachedValue = await redis.get(cacheKey);

  if (cachedValue) {
    try {
      const cachedUrl = JSON.parse(cachedValue);
      cachedUrl.clicks = url.clicks;
      cachedUrl.updatedAt = url.updatedAt;
      await redis.set(cacheKey, JSON.stringify(cachedUrl));
    } catch (error) {
      console.error('Error updating Redis cache clicks for shortCode:', shortCode, error);
    }
  }

  return url;
}

async function getUrlStats(shortCode) {
  return prisma.url.findUnique({
    where: { shortCode },
    select: {
      originalUrl: true,
      shortCode: true,
      clicks: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

module.exports = {
  createShortUrl,
  getUrlByShortCode,
  incrementClicks,
  getUrlStats,
};
