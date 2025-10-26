const express = require('express');
const missionsController = require('../controllers/missions.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { validate, createMissionSchema, updateMissionSchema, reorderMissionsSchema } = require('../utils/validation');

const router = express.Router();

// All mission routes require authentication
router.use(authenticate);

router.post(
  '/', // Changed from /create to be more RESTful
  authRateLimiter(10, 60 * 60), // 10 requests per hour
  validate(createMissionSchema),
  missionsController.createMission
);

router.get(
  '/', // Changed from /:userId to use authenticated user
  missionsController.getMissions
);

router.get(
  '/:id', // Changed from /detail/:id
  missionsController.getMissionById
);

router.patch(
  '/:id',
  validate(updateMissionSchema),
  missionsController.updateMission
);

router.delete(
  '/:id',
  missionsController.deleteMission
);

router.post(
  '/:id/archive',
  missionsController.archiveMission
);

router.post(
  '/reorder',
  validate(reorderMissionsSchema),
  missionsController.reorderMissions
);

module.exports = router;
