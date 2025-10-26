
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const logger = require('./config/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const corsMiddleware = require('./middleware/cors');

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.id = uuidv4();
  logger.info(`Request received: ${req.method} ${req.path}`,
   {
     requestId: req.id 
    });
  next();
});



app.use('/api', routes);

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
