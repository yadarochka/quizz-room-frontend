# QuizzRoom — фронтенд

React + TypeScript + Vite SPA для создания квизов и запуска игровых комнат в реальном времени.

## Деплой

- Прод: https://quizzroom.netlify.app  
- API: https://quizz-room-server.onrender.com

## Возможности

- Вход через Яндекс OAuth (httpOnly cookie).
- Создание квиза, автосоздание сессии/комнаты, подключение по WebSocket (socket.io).
- Старт и проведение викторины в реальном времени.

## Запуск локально

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Создать `.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
   На проде: `VITE_API_URL=https://quizz-room-server.onrender.com`.
3. Старт dev-сервера:
   ```bash
   npm run dev
   ```

## Скрипты

- `npm run dev` — локальная разработка.
- `npm run build` — сборка.
- `npm run lint` — ESLint.
