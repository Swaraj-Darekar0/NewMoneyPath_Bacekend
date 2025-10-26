const { scheduleDisciplineEngine } = require('./disciplineEngine.job');

const initializeCronJobs = () => {
  if (process.env.ENABLE_CRON === 'true') {
    console.log('Initializing cron jobs...');
    scheduleDisciplineEngine();
    // Other jobs can be scheduled here
  } else {
    console.log('Cron jobs are disabled.');
  }
};

module.exports = { initializeCronJobs };
