export const GameConfig = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 320,
  GRID_SIZE: 20,
  GAME_SPEED_MS: 144,
  SNAKE_INITIAL_LENGTH: 4,

  EFFECTS: {
    INFERNO_MS: 3000,
    PHASE_MS: 4000,
    ICE_MS: 3000,
    TOXIC_POOL_MS: 2000,
    BLACK_HOLE_MS: 4000,
    SUPERSONIC_MS: 2000,
    SHIELD_MS: 10000,
    MULTIPLIER_MS: 7000,
    REPULSOR_MS: 5000,
  },

  COLORS: {
    BACKGROUND: '#0c0e18',
    GRID_LINES: '#202234',
    SNAKE_HEAD: '#FFFFFF',
    SNAKE_BODY: '#00b300',
    FOOD: '#FF0000',
    UI_TEXT: '#FFFFFF',
    UI_OVERLAY: 'rgba(0, 0, 0, 0.7)',
    RAINBOW: {
      RED: '#ff4136',
      ORANGE: '#ff851b',
      YELLOW: '#ffdc00',
      GREEN: '#2ecc40',
      BLUE: '#0074d9',
      VIOLET: '#b10dc9',
    },
    EXTRA: {
      PINK: '#F5ABF3',
      CYAN: '#1ABC9C',
      BLACK: '#000000',
      WHITE: '#FFFFFF',
      INFERNO_A: '#FF4848',
      INFERNO_B: '#FFA500',
      PHASE_A: '#9B59B6',
      PHASE_B: '#F5ABF3',
      ICE_A: '#3498DB',
      ICE_B: '#1ABC9C',
      TOXIC_A: '#2ECC71',
      TOXIC_B: '#F1C40F',
      SUPERSONIC_A: '#4D4DFF',
      SUPERSONIC_B: '#FFFFFF',
      SHIELD_A: '#FFD700',
      SHIELD_B: '#C0C0C0',
      REPULSOR_A: '#B0C4DE',
      REPULSOR_B: '#87CEEB',
      MULT_A: '#E5E4E2',
      MULT_B: '#8A2BE2',
    },
  },
} as const;

export type Rainbow = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | 'VIOLET';
export type Coord = { x: number; y: number; color?: string };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type PowerUp = 'INFERNO' | 'PHASE' | 'ICE' | 'TOXIC' | 'BLACKHOLE' | 'SUPERSONIC' | 'SHIELD' | 'MULTIPLIER' | 'REPULSOR';

