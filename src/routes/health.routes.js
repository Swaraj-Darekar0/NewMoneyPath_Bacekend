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
    // --- THIS IS THE FIX ---

    // 1. Log the real error so you can see it in your Render logs
    console.error("Health check CRASHED:", error);

    // 2. Send a small, custom JSON error response
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'crashed',
      error: error.message, // Send just the message
      version: version,
    });
    
    // Do NOT call next(error)
  }
});

module.exports = router;
