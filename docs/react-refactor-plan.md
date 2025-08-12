# React Refactor Plan

Goal: Migrate the current vanilla TS/Vite frontend to React while preserving game rules, improving structure, and ensuring deterministic rendering and testability.

1) Architecture Overview
- Use React + TypeScript (Vite + SWC or esbuild)
- Core game logic (entities, state, modifiers, utils) remains framework-agnostic in /src/core (pure TS)
- React layer handles mounting, lifecycle, canvas rendering, and UI controls
- Use a single Canvas component for drawing; use requestAnimationFrame loop encapsulated with React refs
- Use Context for GameState exposure to UI controls if needed

2) Project Structure
src/
- core/
  - config.ts (GameConfig, types)
  - entities/ (Snake.ts, Food.ts)
  - game/ (GameState.ts, modifiers.ts, utils/random.ts)
- ui/
  - components/
    - Canvas.tsx (Renderer binding)
    - Controls.tsx (buttons: up/down/left/right, shoot, restart)
    - Overlay.tsx (GameOver, Paused, Score, Leaderboard)
  - hooks/
    - useRaf.ts (RAF loop)
    - useTelegram.ts (WebApp integration)
- app/
  - App.tsx (compose UI + Canvas)
  - main.tsx (boot, mount, theme setup)

3) Rendering
- Keep Renderer as a pure class; provide draw methods
- Canvas.tsx sets up canvas ref, DPR, resize handlers
- Game loop is run in a hook (useRaf) which calls gameState.update() at a fixed tick interval and requests draw() on each frame
- Use useEffect to bind keyboard and touch controls to InputHandler (still framework-agnostic), expose via ref

4) State Management
- GameState remains as-is (class with public API). React components do not store game state in React state except UI bits. For UI (score, status), read from GameState on each render or via subscription callback from Game
- For MainButton updates (Telegram), use useTelegram hook and effect on status changes

5) Networking and Diagnostics
- Keep fetch calls to /api endpoints as-is, isolated inside GameState or a thin service
- Diagnostics events (introColors, foodRespawn, foodEaten) remain in the core. Optionally expose a logger service injected into GameState for testability

6) Input
- Controls.tsx binds to onClick handlers that forward to InputHandler
- Keyboard listeners in a top-level effect in App.tsx or useInput hook

7) Testing
- Unit: retain Vitest + jsdom for core/ classes
- Component: @testing-library/react for UI components with mocks for core
- E2E: Playwright for end-to-end testing in generated static build

8) Migration Steps
- Step 1: Extract all core logic under src/core, ensure no DOM references leak
- Step 2: Create React scaffolding (App.tsx, main.tsx) with Vite React template
- Step 3: Port Renderer usage into Canvas.tsx and wire up DPR, resize
- Step 4: Introduce useRaf and schedule update() based on gameState.getCurrentSpeedMs()
- Step 5: Implement Controls.tsx, wire InputHandler
- Step 6: Implement Overlay components (Score, GameOver, Leaderboard)
- Step 7: Port Telegram integration via useTelegram hook
- Step 8: Smoke-test locally and in Docker
- Step 9: Replace index.html script tag with React mount point

9) Performance Considerations
- Avoid storing game ticks in React state; use refs and imperative draw
- Throttle scoreboard fetch on GameOver only
- Minimize re-renders by lifting GameState out of React state

10) Docker and build
- Keep a clean multi-stage Dockerfile
- Ensure only .tsx/.ts sources are used; avoid JS shadowing issues by removing legacy JS files

11) Rollout
- Feature flag: serve React build under a path (/r/), run side-by-side until stable
- Switch default route to React version once tested


