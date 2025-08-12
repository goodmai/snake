# Snake Game Specifications

This document defines the current game rules, UI, inputs, rendering, audio/visual polish, and client-server integration for the Telegram WebApp Snake game.

1. Grid and canvas
- Logical field: square grid
- CANVAS_WIDTH: 320
- CANVAS_HEIGHT: 320
- GRID_SIZE: 20 (pixels per cell)
- Effective cells: 16 x 16
- Background: animated starfield with soft twinkling stars
- Grid lines: #2a2a2a

2. Snake
- Initial length: 4 segments
- Initial direction: RIGHT
- Initial position: horizontal line centered vertically at grid middle (y = floor(HEIGHT/GRID/2)) and x from 0 to length-1
- Coloring: segments cycle through a rainbow; each eaten food color paints the new tail segment with that hex
- Movement: tick rate derived from GAME_SPEED_MS, clamped to min 48ms after multipliers
- Turning: UP/DOWN/LEFT/RIGHT, no 180° reverse allowed in a single input step
- Growth: duplicate tail with eaten food’s hex
- Collisions: self- or wall-collision results in GameOver

3. Food
- Spawns at random free cell not occupied by the snake
- Colors: RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET
- Color selection: pickRandomDistinct from the rainbow avoiding the previous color when possible
- Special behaviors:
  - ORANGE: blinks slowly (10x slower than before)
  - BLUE: moves horizontally left/right within bounds and avoids snake (throttled tick)
- Rendering color: hex from RAINBOW mapping

4. Power-ups (Double Boost Squares)
- Spawn chance: ~50% during normal play; disabled in unit tests for determinism
- Types and effects on eat:
  - INFERNO: temporary speed up (adrenaline)
  - PHASE SHIFT: temporary pass-through (ghost) against self-collision
  - ICE SHARD: temporary slow down
  - TOXIC SPILL: shortens the snake by up to 3 segments (min length preserved)
  - BLACK HOLE: temporarily inverts controls
- Visuals: pulsating dual-color gradients; shimmering outline
- Client logs include powerUpSpawn and foodEaten when not in test env

5. Shooting
- Enabled by YELLOW; disabled by VIOLET
- Fires along current head direction; if food lies on the same row/column ahead, it’s an instant hit (eat)
- Visuals: red glowing laser beam bullets animated at ~7.5 cells/tick
- Audio: embedded red laser SFX on shoot

6. UI and controls
- On-screen D-pad (up, down, left, right) + restart button
- Floating shoot button appears when canShoot
- Keyboard: arrows control direction; Space triggers shoot
- Telegram MainButton mirrors Start/Restart actions
- DPR scaling: canvas and buttons scale with viewport; CSS variables --btn-size and --btn-font set on resize

7. Game loop and states
- States: Intro, Running, Paused, GameOver, Stopped
- Intro: demo snake, starfield background, color cycling
- Running: gameplay + starfield background + laser SFX
- Paused: overlay shown
- GameOver: overlay + canvas-drawn leaderboard
- Stopped: post-GameOver, loop halts until restart

8. Leaderboard integration
- On GameOver: POST /api/score { score, initData }
- Canvas leaderboard fetches /api/leaderboard and renders top entries

9. Client diagnostics events
- POST /api/log with JSON for:
  - powerUpSpawn: { type, pos }
  - foodEaten: { color, hex, score }
  - other UI/intro logs may be emitted conditionally
- Network logging is disabled in unit tests

10. Colors
- RAINBOW hex mapping:
  - RED: #ff4136
  - ORANGE: #ff851b
  - YELLOW: #ffdc00
  - GREEN: #2ecc40
  - BLUE: #0074d9
  - VIOLET: #b10dc9
- Snake head default: #ffffff

11. Performance
- GAME_SPEED_MS: 144 baseline; modifiers apply, min tick 48ms
- Rendering per frame: drawStarfield -> drawGrid -> drawFood -> drawSnake -> overlays

12. Networking and hosting
- Frontend built with Vite; can be served by static host/NGINX
- Bot service (Express) exposes /health, /score, /leaderboard, /session/*, /log; /api proxied to bot
- Telegram Game URL must be publicly reachable

13. Testing
- Unit tests: utilities, modifiers, snake, power-up gating in tests
- E2E: leaderboard rendering after forced game over; request interception for /api/leaderboard


