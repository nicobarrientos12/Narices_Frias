const { query } = require('./base.repository');

async function createToken({ usuario_id, token_hash, expires_at }) {
  const sql = `INSERT INTO passwordresettoken (usuario_id, token_hash, expires_at, used)
               VALUES (?, ?, ?, 0)`;
  const result = await query(sql, [usuario_id, token_hash, expires_at]);
  return result.insertId;
}

async function findValidToken(token_hash) {
  const sql = `SELECT * FROM passwordresettoken
               WHERE token_hash = ? AND used = 0 AND expires_at > NOW()
               ORDER BY id DESC LIMIT 1`;
  const rows = await query(sql, [token_hash]);
  return rows[0] || null;
}

async function markUsed(id) {
  const sql = `UPDATE passwordresettoken SET used = 1 WHERE id = ?`;
  await query(sql, [id]);
  return true;
}

module.exports = { createToken, findValidToken, markUsed };
