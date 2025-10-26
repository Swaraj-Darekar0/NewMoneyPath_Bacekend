const express = require('express');
const cronController = require('../controllers/cron.controller');

const router = express.Router();

// This endpoint will be called by Render Cron Jobs
router.post(
  '/trigger-discipline-engine',
  cronController.triggerDisciplineEngine
);

module.exports = router;
