const dotenv = require('dotenv');

dotenv.config();

const env = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '0000',
  DB_NAME: process.env.DB_NAME || 'narices_frias',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || 'barrientosnicolas67@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'vzrtqysrorulrefp',
  SMTP_FROM: process.env.SMTP_FROM || 'barrientosnicolas67@gmail.com',
};

module.exports = { env };
