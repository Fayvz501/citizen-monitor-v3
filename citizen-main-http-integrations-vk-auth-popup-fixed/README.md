# Citizen Monitor API

Основное приложение Citizen Monitor. Здесь находится веб-приложение, REST API, Socket.IO и база данных. Telegram-бот и Telegram Mini App вынесены в отдельный сервис `telegram-bot` и общаются с этим API только через HTTP.

## Локальный запуск

```bash
npm install
npm start
```

По умолчанию приложение будет доступно на `http://localhost:3000`.

## Render

```text
Build Command: npm install
Start Command: node src/server.js
```

## HTTP-интеграции

### Telegram service auth

Отдельный Telegram-сервис после проверки `initData` вызывает:

```http
POST /api/service/telegram/auth
Authorization: Bearer SERVICE_API_TOKEN
```

Тело:

```json
{
  "user": {
    "id": 123,
    "first_name": "Ivan",
    "last_name": "Ivanov",
    "username": "ivan",
    "photo_url": "https://..."
  }
}
```

Основное приложение создаёт или обновляет пользователя и возвращает JWT.

### Уведомления в ботов

При создании событий основное приложение отправляет HTTP-запросы:

- в Telegram service: `TELEGRAM_BOT_WEBHOOK` или `TELEGRAM_BOT_HOSTPORT`
- в VK service: `VK_BOT_WEBHOOK` или `VK_BOT_HOSTPORT`

## Переменные окружения

Обязательные:

```env
JWT_SECRET=
SERVICE_API_TOKEN=
DB_PATH=
UPLOAD_DIR=
```

Для Render Blueprint `SERVICE_API_TOKEN` берётся из общей environment group, а `DB_PATH` и `UPLOAD_DIR` уже прописаны в `render.yaml`.

Дополнительные:

```env
PUBLIC_BASE_URL=
VK_APP_ID=
VK_APP_SECRET=
VK_BOT_WEBHOOK=
VK_BOT_HOSTPORT=
TELEGRAM_BOT_WEBHOOK=
TELEGRAM_BOT_HOSTPORT=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@citizen.app
```
