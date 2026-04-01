const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TRUST_WEIGHTS = { newcomer: 1, verified: 2, moderator: 3, admin: 5 };

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, trust: user.trust_level || 'newcomer' }, JWT_SECRET, { expiresIn: '30d' });
}
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Требуется авторизация' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Неверный токен' }); }
}
function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) { try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); } catch {} }
  next();
}
function modOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Auth required' });
  const { getDb } = require('./database');
  const u = getDb().prepare('SELECT trust_level FROM users WHERE id=?').get(req.user.id);
  if (!u || !['moderator','admin'].includes(u.trust_level)) return res.status(403).json({ error: 'Mods only' });
  next();
}
function socketAuth(socket, next) {
  const t = socket.handshake.auth.token;
  if (!t) return next(new Error('Auth required'));
  try { socket.user = jwt.verify(t, JWT_SECRET); next(); } catch { next(new Error('Bad token')); }
}
function getVoteWeight(tl) { return TRUST_WEIGHTS[tl] || 1; }

// ─── VK OAuth ───
async function exchangeVkCode(code, redirectUri, codeVerifier, deviceId) {
  const VK_APP_ID = process.env.VK_APP_ID;
  const VK_APP_SECRET = process.env.VK_APP_SECRET;
  if (!VK_APP_ID || !VK_APP_SECRET) throw new Error('VK_APP_ID / VK_APP_SECRET not set');

  const params = {
    grant_type: 'authorization_code',
    code: code,
    client_id: VK_APP_ID,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier || '',
  };
  if (deviceId) params.device_id = deviceId;

  const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  const { access_token, user_id, email } = tokenData;

  // Get user info via VK ID user_info endpoint
  const userRes = await fetch('https://id.vk.com/oauth2/user_info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token, client_id: VK_APP_ID }).toString()
  });
  const userData = await userRes.json();

  return {
    vk_id: userData.user?.user_id || user_id,
    email: userData.user?.email || email || null,
    first_name: userData.user?.first_name || 'VK',
    last_name: userData.user?.last_name || 'User',
    photo: userData.user?.avatar || '',
    access_token,
  };
}

module.exports = { generateToken, authMiddleware, optionalAuth, modOnly, socketAuth, getVoteWeight, exchangeVkCode, JWT_SECRET };
