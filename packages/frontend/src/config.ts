export const GameConfig = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 320,
  GRID_SIZE: 20,
  GAME_SPEED_MS: 144,
  SNAKE_INITIAL_LENGTH: 3,

  COLORS: {
    BACKGROUND: '#1a1a1a',
    GRID_LINES: '#2a2a2a',
    SNAKE_HEAD: '#00FF00',
    SNAKE_BODY: '#00b300',
    FOOD: '#FF0000',
    UI_TEXT: '#FFFFFF',
    UI_OVERLAY: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type Coord = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

