let bot = null;

const TYPES = {
  fire: '🔥 ПОЖАР', accident: '🚗 ДТП', suspicious: '👁 ПОДОЗРИТЕЛЬНОЕ',
  crime: '🚨 КРИМИНАЛ', medical: '🏥 МЕД. ПОМОЩЬ', sos: '🆘 SOS', other: '📌 ДРУГОЕ'
};

function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.log('[TG] Bot disabled (no token)'); return; }

  try {
    const TelegramBot = require('node-telegram-bot-api');
    bot = new TelegramBot(token, { polling: false });
    console.log('[TG] Bot initialized');
  } catch (e) {
    console.error('[TG] Init error:', e.message);
  }
}

async function notifyChannel(incident) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!bot || !channelId) return;

  const typeLabel = TYPES[incident.type] || '📌 ДРУГОЕ';
  const text = [
    `⚡ <b>${typeLabel}</b>`,
    ``,
    `📝 ${incident.description}`,
    incident.address ? `📍 ${incident.address}` : `📍 ${incident.lat.toFixed(5)}, ${incident.lng.toFixed(5)}`,
    ``,
    `👤 ${incident.username || 'Аноним'}`,
    `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    ``,
    `🗺 <a href="https://maps.google.com/?q=${incident.lat},${incident.lng}">Открыть на карте</a>`
  ].join('\n');

  try {
    await bot.sendMessage(channelId, text, { parse_mode: 'HTML', disable_web_page_preview: true });
  } catch (e) {
    console.error('[TG] Send error:', e.message);
  }
}

async function notifySOS(incident) {
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!bot || !channelId) return;

  const text = [
    `🚨🚨🚨 <b>ТРЕВОГА SOS</b> 🚨🚨🚨`,
    ``,
    `Пользователь запросил экстренную помощь!`,
    incident.description ? `📝 ${incident.description}` : '',
    `📍 ${incident.lat.toFixed(5)}, ${incident.lng.toFixed(5)}`,
    `👤 ${incident.username || 'Аноним'}`,
    ``,
    `🗺 <a href="https://maps.google.com/?q=${incident.lat},${incident.lng}">ОТКРЫТЬ КАРТУ</a>`
  ].filter(Boolean).join('\n');

  try {
    await bot.sendMessage(channelId, text, { parse_mode: 'HTML' });
  } catch (e) {
    console.error('[TG] SOS send error:', e.message);
  }
}

module.exports = { initBot, notifyChannel, notifySOS };
