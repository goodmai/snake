import { describe, it, expect } from 'vitest';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';

describe('Snake colors', () => {
  it('starts with GYGY pattern', () => {
    const s = new Snake();
    const body = s.getBody();
    const [c0, c1, c2, c3] = body.slice(0,4).map(seg => seg.color?.toLowerCase());
    const G = GameConfig.COLORS.RAINBOW.GREEN.toLowerCase();
    const Y = GameConfig.COLORS.RAINBOW.YELLOW.toLowerCase();
    // Head is the first element due to unshift during construction
    expect([c0, c1, c2, c3]).toEqual([G, Y, G, Y]);
  });

  it('keeps head color after one move', () => {
    const s = new Snake();
    const headColor = s.getHead().color;
    s.move();
    expect(s.getHead().color).toBe(headColor);
  });
});
