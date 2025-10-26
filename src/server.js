if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = require('./app');
const { healthCheck } = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  if (!(await healthCheck())) {
    logger.error('Database connection failed. Exiting...');
    process.exit(1);
  }

  initializeCronJobs(); // Start cron jobs

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`)
  });

  const gracefulShutdown = () => {
    logger.info('Gracefully shutting down...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

startServer();
