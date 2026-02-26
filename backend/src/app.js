const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./middlewares/error.middleware');
const routes = require('./routes');
const { env } = require('./config/env');

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
