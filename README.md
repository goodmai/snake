# 🐍 Telegram Snake Game (Production-Ready Edition)

This is a production-ready monorepo template for a Telegram HTML5 Game (Snake) with a Telegram bot, inline mode, and a Vite-based frontend WebApp.

Highlights:
- Full Telegram Games compliance (GameShortName, callback_query, setGameScore, inline mode)
- Mobile-friendly controls: on-screen buttons, taps on canvas, Start/Restart flow
- Intro demo screen, reduced board size (320x320), 20% slower speed for better UX
- Secure config via Zod and Telegram initData validation
- Dockerized bot with healthcheck; GitHub Actions pipeline

## Features
- Start screen with demo snake and Start button
- In-game rendering without leaderboard overlay
- After game over or full completion, score is sent and Telegram leaderboard is updated in the game message
- Inline mode: type @spr_spravka_bot snake to share the game in any chat
- Controls: keyboard, taps, and on-screen buttons

## Structure
[...unchanged tree omitted for brevity...]

## Prerequisites
- Node.js 20+
- Yarn
- Docker
- Telegram bot created via @BotFather with GameShortName (e.g., snake) and inline mode enabled (/setinline)

## Local Development
- Install: `yarn install`
- Run frontend: `yarn dev:frontend` (by default binds to 5173; our dev uses 8889 as shown in logs). You can force `--port 8889 --host 0.0.0.0`.
- Run bot: `yarn dev:bot`
- Ensure .env:
```
BOT_TOKEN="..."
GAME_URL="http://<your-lan-ip>:8889"
GAME_SHORT_NAME="snake"
NODE_ENV="development"
LOG_LEVEL="info"
```

## Telegram Setup
1) Create bot and game in @BotFather; set game_short_name to `snake` (or your name).
2) Enable inline mode: `/setinline` for your bot.
3) In .env set GAME_SHORT_NAME to your value and GAME_URL to your dev URL.
4) Start a chat with your bot and send `/snake` or use inline: `@your_bot snake`.

## Score and Leaderboard
- Frontend sends score to `/api/score` with validated `initData` from Telegram WebApp
- Bot validates and calls `setGameScore`:
  - If user started from a chat message, the bot updates that message (chat_id/message_id)
  - If inline, the bot updates the inline message (inline_message_id)
- Telegram renders the leaderboard in the game message

## Docker
- Bot has a multi-stage Dockerfile. The healthcheck uses Node http and requires no extra packages.
- Build: `docker build -t your-username/telegram-snake -f packages/bot/Dockerfile .`
- Run: `docker run -d --env-file ./.env -p 3001:3001 your-username/telegram-snake`

## docker-compose (Redis optional)
A sample compose file is provided to spin up Redis for persistence, bound only to 127.0.0.1 and protected by password.

```
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    ports:
      - "127.0.0.1:6379:6379"  # доступ только с localhost
    volumes:
      - redis_data:/data
    restart: unless-stopped
volumes:
  redis_data:
```

Usage:
- Set in .env:
  - `REDIS_PASSWORD=your_strong_password`
  - `REDIS_URL=redis://default:${REDIS_PASSWORD}@localhost:6379`
- Start: `yarn dev:redis`

Security:
- Port exposed only on 127.0.0.1
- AUTH required via `--requirepass`
- Use strong password and keep `.env` out of VCS (already ignored)

## CI/CD
- GitHub Actions pipeline: lint, test, build, Vercel deploy for frontend, Docker build+push for bot
- Required secrets in GitHub repository:
  - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  - `DOCKER_USERNAME`, `DOCKER_PASSWORD`
  - `BOT_TOKEN` (for optional integration tests / previews)

## Testing
- Unit tests: `yarn test`
- Suggested future tests: contract tests for /score and Playwright E2E

## Security and Privacy
- No cookies on the game page (Telegram Games policy)
- Do not log sensitive data; production logging should exclude PII

## Roadmap
- Persist sessions and scores in Redis/Postgres
- Swipe gestures with haptic feedback
- HiDPI canvas and responsive scaling
- Harden Vercel workflow and environment management

Это не просто игра "Змейка", а профессиональный шаблон (boilerplate) для создания Full-Stack TypeScript-приложений, готовых к развертыванию в production. Проект демонстрирует лучшие практики в архитектуре, разработке, тестировании и DevOps.

## ✨ Ключевые Особенности

* **Архитектура**:
    * **Monorepo**: Управление через `Yarn Workspaces` для четкого разделения `frontend` и `bot`.
    * **SOLID & OOP**: Код организован в виде классов с разделением ответственности (SOLID).
    * **Dependency Injection**: Зависимости (например, обработчики) внедряются в основной класс бота.
    * **Централизованная конфигурация**: Безопасная конфигурация с валидацией через `Zod`.
* **Инфраструктура и DevOps**:
    * **Docker**: Оптимизированный многоступенчатый `Dockerfile` с `healthcheck` и запуском от non-root пользователя.
    * **CI/CD**: Полноценный пайплайн на GitHub Actions, включающий:
        * Линтинг (`ESLint`).
        * Автоматическое тестирование (`Vitest`).
        * Сборку артефактов.
        * Деплой фронтенда на Vercel.
        * Сборку и пуш Docker-образа в Registry.
* **Качество и Надежность**:
    * **TypeScript**: Строгая типизация во всем проекте.
    * **Тестирование**: Встроенный фреймворк `Vitest` для модульного тестирования.
    * **Логирование**: Структурированное логирование с `pino` (включая `pino-pretty` для разработки).
    * **Обработка ошибок**: Глобальный `catch` и `Graceful Shutdown` для безопасной остановки бота.
* **Frontend**:
    * **Vite**: Современный и быстрый сборщик для фронтенда.
    * **Рендеринг**: Оптимизированный игровой цикл, не зависящий от FPS (`performance.now`).

## 🏗️ Структура Проекта

telegram-snake-senior/
├── .github/workflows/deploy.yml  # CI/CD пайплайн
├── packages/
│   ├── bot/                      # Бэкенд-пакет
│   │   ├── Dockerfile
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── tests/            # Тесты для бота
│   │       ├── core/
│   │       ├── config/
│   │       ├── handlers/
│   │       └── index.ts
│   └── frontend/                 # Фронтенд-пакет
│       ├── vite.config.ts
│       └── src/
│           ├── tests/            # Тесты для игры
│           ├── game/
│           ├── core/
│           └── index.ts
├── .env.example
├── package.json                  # Корневой package.json с workspaces
└── ...                           # Прочие конфигурационные файлы


## 📋 Пререквизиты

Перед началом работы убедитесь, что у вас установлены:
* [Node.js](https://nodejs.org/) (v20.x или выше)
* [Yarn](https://yarnpkg.com/) (v1.x или v3.x)
* [Docker](https://www.docker.com/)

## 🚀 Настройка и Запуск

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <your-repo-url>
    cd telegram-snake-senior
    ```

2.  **Установите зависимости:**
    ```bash
    yarn install
    ```

3.  **Настройте переменные окружения:**
    * Скопируйте `.env.example` в новый файл `.env`.
    * Заполните его своими данными:
        ```env
        # Токен, полученный от @BotFather в Telegram
        BOT_TOKEN="12345:ABC-DEF1234ghIkl-zyx57W2v1u123"

        # URL, где будет размещен ваш фронтенд (например, с Vercel)
        GAME_URL="[https://my-snake-game.vercel.app](https://my-snake-game.vercel.app)"
        ```

4.  **Запуск в режиме разработки:**
    * В разных терминалах запустите фронтенд и бэкенд:
    ```bash
    # Запустить бэкенд-бота
    yarn dev:bot

    # Запустить фронтенд (будет доступен на http://localhost:5173)
    yarn dev:frontend
    ```

5.  **Запуск тестов:**
    * Для запуска всех тестов в проекте выполните:
    ```bash
    yarn test
    ```

## 🚢 Развертывание (Deployment)

### Автоматический (через CI/CD)

При каждом пуше в ветку `main` GitHub Actions автоматически:
1.  Проверит код линтером.
2.  Запустит все тесты.
3.  Соберет фронтенд и задеплоит его на **Vercel**.
4.  Соберет Docker-образ бота и отправит его в **Docker Hub**.

Вам потребуется настроить `secrets` в вашем GitHub-репозитории (`DOCKER_USERNAME`, `VERCEL_TOKEN` и т.д.).

### Ручной

* **Фронтенд**: Соберите статику командой `yarn workspace frontend build` и разместите содержимое папки `packages/frontend/dist` на любом статическом хостинге (Vercel, Netlify, GitHub Pages).

* **Бэкенд**: Соберите и запустите Docker-образ:
    ```bash
    # Сборка образа
    docker build -t your-username/telegram-snake -f packages/bot/Dockerfile .

    # Запуск контейнера
    docker run -d --env-file ./.env --name snake-bot your-username/telegram-snake
    ```

## 🧠 Архитектурные Решения

* **Yarn Workspaces**: Идеально подходит для монорепозиториев. Позволяет управлять зависимостями каждого пакета изолированно, но при этом иметь общие `devDependencies` и скрипты.
* **Zod**: Гарантирует, что приложение не запустится с невалидной или отсутствующей конфигурацией, что предотвращает трудноотлаживаемые ошибки во время выполнения.
* **Vitest**: Современный тестовый фреймворк, совместимый с Vite. Обеспечивает быструю и удобную среду для написания тестов как для Node.js, так и для DOM.
* **Graceful Shutdown**: Критически важная функция для любого сервиса. Позволяет боту корректно завершить текущие операции и отключиться от Telegram API перед остановкой процесса, избегая таймаутов и потери данных.

## 🔮 Дальнейшие Улучшения (Next Steps)

* **Мониторинг**: Интегрировать **Sentry** или аналогичный сервис для автоматического сбора и анализа ошибок в production.
* **Производительность**: Для более сложной игровой логики можно вынести ее в **Web Workers**, чтобы не блокировать основной поток и UI.
* **Безопасность**:
    * Добавить **Rate Limiting** для бота, чтобы защититься от спам-атак.
    * Настроить **Content Security Policy (CSP)** для фронтенда, чтобы снизить риск XSS-атак.
* **Функционал**:
    * Реализовать **таблицу лидеров (Leaderboard)** через `setGameScore` и `getGameHighScores` методы Telegram API (требует более сложной логики для передачи `inline_message_id`).
    * Добавить кэширование ассетов через **Workbox** для улучшения PWA-возможностей.

