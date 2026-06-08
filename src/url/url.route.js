const express = require('express');
const {
  shortenUrl,
  redirectShortCode,
  statsShortCode,
} = require('./url.controller');

const router = express.Router();

router.post('/shorten', shortenUrl);
router.get('/stats/:shortCode', statsShortCode);
router.get('/:shortCode', redirectShortCode);

module.exports = router;
