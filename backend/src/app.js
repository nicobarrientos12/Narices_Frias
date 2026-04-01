const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./middlewares/error.middleware');
const routes = require('./routes');
const authRoutes = require('./routes/auth.routes');
const authCtrl = require('./controllers/auth.controller');
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

app.get('/api/auth/captcha', authCtrl.captcha);
app.post('/api/auth/login', authCtrl.login);
app.post('/api/auth/refresh', authCtrl.refresh);
app.post('/api/auth/forgot', authCtrl.forgot);
app.post('/api/auth/reset', authCtrl.reset);
app.use('/api/auth', authRoutes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
