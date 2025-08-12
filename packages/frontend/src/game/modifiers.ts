import { GameConfig, Rainbow } from '../config';
import { GameState } from './GameState';

export type Modifier = (gs: GameState) => void;

export const ColorModifiers: Record<Rainbow, Modifier> = {
  RED: (gs) => {
    gs['speedMultiplier'] *= 0.95; // быстрее
  },
  GREEN: (gs) => {
    gs['speedMultiplier'] *= 1.05; // медленнее
  },
  ORANGE: (_gs) => {
    // визуальный эффект мигания уже в Renderer/Food
  },
  BLUE: (_gs) => {
    // движение еды уже реализовано в Food.tickMove
  },
  YELLOW: (gs) => {
    gs.canShoot = true;
    (gs as any).updateShootButton();
  },
  VIOLET: (gs) => {
    gs.canShoot = false;
    (gs as any).updateShootButton();
  },
};

export function applyModifierForColor(gs: GameState, color: Rainbow): void {
  const fn = ColorModifiers[color];
  if (fn) fn(gs);
}
