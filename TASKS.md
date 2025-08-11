# Project Epics and Tasks

## Epic 1: Telegram Game Compliance and UX
- Task 1.1: Add Intro screen with demo snake and Start button (done)
- Task 1.2: Ensure game opens inside Telegram via GameShortName and callback_query (done)
- Task 1.3: Capture chat_id/message_id or inline_message_id for score updates (this change)
- Task 1.4: Submit score and update Telegram leaderboard in the message (done)
- Task 1.5: Add on-screen controls and restart (done)

## Epic 2: Mobile Controls and Rendering
- Task 2.1: Tap zones on canvas to change direction (done)
- Task 2.2: On-screen directional buttons (done)
- Task 2.3: Adjust canvas to smaller size and reduce speed by 20% (done)
- Task 2.4: Optional: Swipe gestures with threshold and haptics (future)
- Task 2.5: HiDPI support using devicePixelRatio (future)

## Epic 3: Backend Robustness
- Task 3.1: Validate Telegram initData with HMAC (done)
- Task 3.2: Add in-memory SessionStore mapping user-> message/inline ids (this change)
- Task 3.3: Provide /score endpoint; update Telegram leaderboard (done)
- Task 3.4: Replace Docker healthcheck with Node http probe to avoid extra packages (this change)
- Task 3.5: Persist scores/session in Redis/Postgres (future)

## Epic 4: CI/CD and DevEx
- Task 4.1: Improve .dockerignore to reduce build context (this change)
- Task 4.2: Initialize git, ignore .env (this change; .env already ignored)
- Task 4.3: Prepare README with full setup, secrets, and usage (this change)
- Task 4.4: Verify tests and local run scripts (this change)
- Task 4.5: Refine GitHub Actions and Vercel config (future)

## Epic 5: Testing
- Task 5.1: Unit tests for core logic (present)
- Task 5.2: Add contract tests for /score and initData validation (future)
- Task 5.3: Add E2E tests (Playwright) for game flow (future)
