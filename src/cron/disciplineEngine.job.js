const cron = require('node-cron');
const { recalculateDailyTargets } = require('../services/discipline.service');
const userModel = require('../models/user.model');

const scheduleDisciplineEngine = () => {
  // Schedule to run once a day at 1:00 AM IST (which is 7:30 PM UTC the previous day)
  // Cron syntax: minute hour day-of-month month day-of-week
  cron.schedule('30 19 * * *', async () => {
    console.log('Running Daily Discipline Engine Job for IST timezone...');
    try {
      // Since we are targeting a single timezone (IST), we can process all users.
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
    } catch (error) {
      console.error('Error in daily discipline engine job:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
};

module.exports = { scheduleDisciplineEngine };
