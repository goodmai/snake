# Snake Game Specifications

This document defines the current game rules, UI, inputs, rendering, and client-server integration for the Telegram WebApp Snake game.

1. Grid and canvas
- Logical field: square grid
- CANVAS_WIDTH: 320
- CANVAS_HEIGHT: 320
- GRID_SIZE: 20 (pixels per cell)
- Effective cells: 16 x 16
- Background color: #1a1a1a
- Grid lines: #2a2a2a

2. Snake
- Initial length: 4 segments
- Initial direction: RIGHT
- Initial position: horizontal line centered vertically at grid middle (y = floor(HEIGHT/GRID/2)) and x from 0 to length-1
- Initial coloring: first two segments GREEN, next two YELLOW
- Movement: at a fixed tick rate computed from GAME_SPEED_MS and a speedMultiplier
- Turning: UP/DOWN/LEFT/RIGHT, no 180° reverse allowed in a single input step
- Growth: when food is eaten, duplicate tail with color set to the eaten food’s hex (RAINBOW mapping)
- Self-collision: game over
- Wall collision: game over

3. Food
- Spawns at random free cell not occupied by the snake
- Colors: RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET
- Color selection: pickRandomDistinct from the rainbow avoiding previous color when possible
- Special behaviors:
  - ORANGE: blinks (visible every other frame)
  - BLUE: moves horizontally left/right within bounds and avoids snake (slow move via throttled tick)
- Rendering color: hex from RAINBOW mapping

4. Modifiers (on eat)
- RED: speedMultiplier *= 0.95 (speed up)
- GREEN: speedMultiplier *= 1.05 (slow down)
- ORANGE: visual-only blink already handled by Food/Renderer
- BLUE: movement of the food already handled in Food.tickMove
- YELLOW: enable shooting (canShoot = true), show shoot button
- VIOLET: disable shooting (canShoot = false), hide shoot button

5. Shooting
- Only when canShoot = true
- Fires along current head direction; if food lies in same row/column ahead in that direction, it’s a hit -> treat as eat
- After hit: apply normal eat logic

6. UI and controls
- On-screen D-pad (up, down, left, right) + restart button
- Floating shoot button (initially hidden) appears when canShoot
- Keyboard: arrow keys control direction; Space triggers shoot
- Telegram MainButton mirrors Start/Restart actions
- DPR scaling: canvas and buttons scale with viewport; CSS variables --btn-size and --btn-font set on resize

7. Game loop and states
- States: Intro, Running, Paused, GameOver, Stopped
- Intro: demo snake moves along generated path; segments are animated with HSL hue cycling
- Running: normal gameplay
- Paused: overlay shown
- GameOver: overlay + leaderboard drawn
- Stopped: post-GameOver, loop halts until restart

8. Leaderboard integration
- On GameOver or forced game over: POST /api/score with { score, initData }
- Leaderboard fetched from /api/leaderboard and drawn on GameOver/Stopped

9. Client diagnostics events
- POST /api/log with JSON content-type for the following events:
  - introColors: array of first 5 segment colors (periodically during Intro)
  - foodRespawn: { prevColor, pos }
  - foodEaten: { color, hex, score }

10. Colors
- RAINBOW hex mapping:
  - RED: #ff4136
  - ORANGE: #ff851b
  - YELLOW: #ffdc00
  - GREEN: #2ecc40
  - BLUE: #0074d9
  - VIOLET: #b10dc9
- Snake head default: #FFFFFF
- Snake body default: #00b300 (used when segment has no color)
- Food default: not used; food uses rainbow color mapping

11. Performance
- GAME_SPEED_MS: 144 baseline, clamped min effective tick to 48ms after multiplier
- Rendering per frame: clear -> drawGrid -> drawFood (unless Intro) -> drawSnake -> UI overlays

12. Networking and hosting
- Frontend served statically by Nginx
- /api proxied to bot service (Express) at http://bot:3001
- Telegram Game URL must be reachable (LAN IP or public domain) and cannot be localhost

13. Testing
- Unit tests for utilities (random picker), modifiers, snake logic
- E2E: forcing game over flag, ensuring leaderboard request fires


