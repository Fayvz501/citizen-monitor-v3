# Citizen Monitor

Real-time incident monitoring platform.

## Local Setup

```bash
npm install
npm start
```

Open http://localhost:3000

## Deploy to Render.com

1. Push this repo to GitHub
2. Render → New → Web Service → Connect repo
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Add Environment Variables (see below)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Random string, 32+ chars |
| `VK_APP_ID` | No | VK ID app id from dev.vk.com |
| `VK_APP_SECRET` | No | VK ID secret key |
| `VK_BOT_WEBHOOK` | No | URL of VK bot service |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token |
| `TELEGRAM_CHANNEL_ID` | No | Telegram channel id |
| `VAPID_PUBLIC_KEY` | No | Web Push public key |
| `VAPID_PRIVATE_KEY` | No | Web Push private key |
