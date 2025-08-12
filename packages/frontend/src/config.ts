export const GameConfig = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 320,
  GRID_SIZE: 20,
  GAME_SPEED_MS: 144,
  SNAKE_INITIAL_LENGTH: 4,

  COLORS: {
    BACKGROUND: '#1a1a1a',
    GRID_LINES: '#2a2a2a',
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
  },
} as const;

export type Rainbow = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | 'VIOLET';
export type Coord = { x: number; y: number; color?: string };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

