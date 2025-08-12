import { describe, it, expect } from 'vitest';
import { GameState } from '../game/GameState';
import { applyModifierForColor } from '../game/modifiers';

describe('color modifiers', () => {
  it('yellow grants shoot and violet revokes', () => {
    const gs = new GameState();
    const btn = document.createElement('button');
    btn.id = 'btn-shoot';
    document.body.appendChild(btn);

    applyModifierForColor(gs as any, 'YELLOW' as any);
    expect(gs.canShoot).toBe(true);

    applyModifierForColor(gs as any, 'VIOLET' as any);
    expect(gs.canShoot).toBe(false);
  });
});
