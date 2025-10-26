const { recalculateDailyTargets } = require('../services/discipline.service');
const userModel = require('../models/user.model');

const triggerDisciplineEngine = async (req, res, next) => {
  try {
    // Secure this endpoint with a secret key
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Discipline Engine triggered by Render Cron Job...');
    
    // For a single-timezone app (India), we process all users when the job runs.
    const usersToProcess = await userModel.findAll();
    console.log(`Found ${usersToProcess.length} users to process.`);

    for (const user of usersToProcess) {
      try {
        await recalculateDailyTargets(user.id);
        console.log(`Discipline engine ran successfully for user ${user.id}`);
      } catch (userError) {
        console.error(`Failed to run discipline engine for user ${user.id}:`, userError);
      }
    }

    res.status(200).json({ message: `Discipline engine job completed for ${usersToProcess.length} users.` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerDisciplineEngine,
};
