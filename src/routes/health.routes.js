const express = require('express');
const { healthCheck } = require('../config/database');
const { version } = require('../../package.json');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const dbConnected = await healthCheck();
    if (dbConnected) {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        version: version,
      });
    } else {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        version: version,
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
