import { Coord, GameConfig } from '../config';

export class Food {
  public position: Coord;

  constructor(snakeBody: Coord[]) {
    this.position = { x: 0, y: 0 };
    this.respawn(snakeBody);
  }

  public respawn(snakeBody: Coord[]): void {
    const { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } = GameConfig;
    const maxX = CANVAS_WIDTH / GRID_SIZE;
    const maxY = CANVAS_HEIGHT / GRID_SIZE;

    do {
      this.position = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    } while (
      snakeBody.some(
        (segment) =>
          segment.x === this.position.x && segment.y === this.position.y,
      )
    );
  }
}

