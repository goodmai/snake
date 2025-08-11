# Project Epics and Tasks

## Epic 1: Telegram Game Compliance and UX
- Task 1.1: Add Intro screen with demo snake and Start button (done)
- Task 1.2: Ensure game opens inside Telegram via GameShortName and callback_query (done)
- Task 1.3: Capture chat_id/message_id or inline_message_id for score updates (done)
- Task 1.4: Submit score and update Telegram leaderboard in the message (done)
- Task 1.5: Add on-screen controls and restart (done)
- Task 1.6: Localized inline results (ru/en) and cache_time (done)

## Epic 2: Mobile Controls and Rendering
- Task 2.1: Tap zones on canvas to change direction (done)
- Task 2.2: On-screen directional buttons (done)
- Task 2.3: Adjust canvas to smaller size and reduce speed by 20% (done)
- Task 2.4: Swipe gestures with threshold and haptics (done)
- Task 2.5: HiDPI support using devicePixelRatio and autoscale by viewport width (done)
- Task 2.6: Autoscale UI buttons based on canvas width (done)
- Task 2.7: Pause/resume on visibility change with overlay (done)
- Task 2.8: Improved intro animation (double perimeter + waves) (done)

## Epic 3: Backend Robustness
- Task 3.1: Validate Telegram initData with HMAC (done)
- Task 3.2: SessionStore mapping user-> message/inline ids with Redis fallback (done)
- Task 3.3: Provide /score endpoint; update Telegram leaderboard (done)
- Task 3.4: Replace Docker healthcheck with Node http probe to avoid extra packages (done)
- Task 3.5: Persist scores/session in Redis (done); Postgres (future)
- Task 3.6: Mini-leaderboard REST endpoint with display names (done)

## Epic 4: CI/CD and DevEx
- Task 4.1: Improve .dockerignore to reduce build context (done)
- Task 4.2: Initialize git, ignore .env (done)
- Task 4.3: Prepare README with full setup, secrets, and usage (done)
- Task 4.4: Verify tests and local run scripts (done)
- Task 4.5: Refine GitHub Actions (add Redis service in tests) (done); Vercel config (partial)
- Task 4.6: Add docker compose for Redis and secure defaults (done)

## Epic 5: Testing
- Task 5.1: Unit tests for core logic (present)
- Task 5.2: Add contract tests for /score and initData validation (future)
- Task 5.3: Add E2E tests (Playwright) for game flow (future)
