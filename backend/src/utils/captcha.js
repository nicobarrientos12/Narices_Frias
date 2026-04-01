const crypto = require('crypto');
const { env } = require('../config/env');

const CAPTCHA_TTL_MS = 1000 * 60 * 5;

function signPayload(payload) {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(payload)
    .digest('hex');
}

function encodeToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

function createCaptchaChallenge() {
  const left = crypto.randomInt(1, 10);
  const right = crypto.randomInt(1, 10);
  const useSubtraction = crypto.randomInt(0, 2) === 1;

  const first = useSubtraction ? Math.max(left, right) : left;
  const second = useSubtraction ? Math.min(left, right) : right;
  const operation = useSubtraction ? '-' : '+';

  const token = encodeToken({
    first,
    second,
    operation,
    issuedAt: Date.now(),
  });

  return {
    question: `Resuelve: ${first} ${operation} ${second}`,
    token,
  };
}

function verifyCaptchaResponse({ captcha_token, captcha_answer }) {
  if (!captcha_token || captcha_answer === undefined || captcha_answer === null || captcha_answer === '') {
    const err = new Error('Captcha requerido');
    err.status = 400;
    throw err;
  }

  const data = decodeToken(captcha_token);
  if (!data) {
    const err = new Error('Captcha invalido');
    err.status = 400;
    throw err;
  }

  if (Date.now() - Number(data.issuedAt) > CAPTCHA_TTL_MS) {
    const err = new Error('Captcha expirado');
    err.status = 400;
    throw err;
  }

  const expected = data.operation === '-' ? Number(data.first) - Number(data.second) : Number(data.first) + Number(data.second);
  if (Number(captcha_answer) !== expected) {
    const err = new Error('Captcha incorrecto');
    err.status = 400;
    throw err;
  }
}

module.exports = {
  createCaptchaChallenge,
  verifyCaptchaResponse,
};
