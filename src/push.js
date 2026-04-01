const { getDb } = require('./database');

let webpush = null;

function initPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@citizen.app';
  if (!pub || !priv) { console.log('[PUSH] Disabled (no VAPID keys)'); return; }

  try {
    webpush = require('web-push');
    webpush.setVapidDetails(email, pub, priv);
    console.log('[PUSH] Initialized');
  } catch (e) { console.error('[PUSH] Init error:', e.message); }
}

function subscribe(userId, subscription) {
  const db = getDb();
  try {
    db.prepare(`INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth)
      VALUES (?, ?, ?, ?)`)
      .run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
    return true;
  } catch (e) { return false; }
}

function unsubscribe(userId, endpoint) {
  const db = getDb();
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, endpoint);
}

async function sendToUser(userId, payload) {
  if (!webpush) return;
  const db = getDb();
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);

  for (const sub of subs) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
      }, JSON.stringify(payload));
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }
}

async function sendToNearby(lat, lng, radiusKm, payload, excludeUserId) {
  if (!webpush) return;
  const db = getDb();
  const zones = db.prepare('SELECT * FROM user_zones').all();

  for (const zone of zones) {
    if (zone.user_id === excludeUserId) continue;
    const dist = haversine(zone.lat, zone.lng, lat, lng);
    if (dist <= (zone.radius_km || radiusKm)) {
      await sendToUser(zone.user_id, payload);
    }
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getVapidPublicKey() { return process.env.VAPID_PUBLIC_KEY || ''; }

module.exports = { initPush, subscribe, unsubscribe, sendToUser, sendToNearby, getVapidPublicKey, haversine };
