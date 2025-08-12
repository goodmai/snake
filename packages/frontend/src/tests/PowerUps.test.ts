import { describe, it, expect } from 'vitest';
import { GameState, GameStatus } from '../game/GameState';
import { GameConfig } from '../config';

function placeFoodNextStep(gs: GameState) {
  const h = gs.snake.getHead();
  const body = (gs as any).snake.getBody();
  const neck = body[1] || h;
  const vx = Math.sign(h.x - neck.x);
  const vy = Math.sign(h.y - neck.y);
  (gs as any).food.position.x = h.x + vx;
  (gs as any).food.position.y = h.y + vy;
}

describe('New power-ups basic behavior', () => {
  it('MULTIPLIER doubles score on subsequent eat', () => {
    const gs = new GameState();
    gs.reset();
(gs as any).food.powerUp = 'MULTIPLIER';
    placeFoodNextStep(gs);
    const s0 = gs.score;
    gs.update(); // activate multiplier (+1)
    expect(gs.score).toBe(s0 + 1);
    // next eat +2
(gs as any).food.powerUp = null;
    placeFoodNextStep(gs);
    const s1 = gs.score;
    gs.update();
    expect(gs.score).toBe(s1 + 2);
  });

  it('SHIELD prevents one immediate collision', () => {
    const gs = new GameState();
    gs.reset();
(gs as any).food.powerUp = 'SHIELD';
    placeFoodNextStep(gs);
    gs.update(); // activate shield
    // Create wall collision next tick
    // Move head to right boundary
  const widthCells = GameConfig.CANVAS_WIDTH / GameConfig.GRID_SIZE;
    (gs as any).snake.getHead().x = widthCells - 1;
    // moving right will cause collision but shield should absorb
    gs.update();
    expect(gs.status).toBe(GameStatus.Running);
  });

  it('SUPERSONIC reduces tick ms below INFERNO', () => {
    const gs = new GameState();
    gs.reset();
(gs as any).food.powerUp = 'INFERNO';
    placeFoodNextStep(gs); gs.update();
    const speedInferno = gs.getCurrentSpeedMs();
    (gs as any).food.powerUp = 'SUPERSONIC';
    placeFoodNextStep(gs); gs.update();
    const speedSuper = gs.getCurrentSpeedMs();
    expect(speedSuper).toBeLessThan(speedInferno);
  });
});
