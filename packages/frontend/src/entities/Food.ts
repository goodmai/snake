import { Coord, GameConfig, Rainbow } from '../config';

export class Food {
  public position: Coord;
  public color: Rainbow;
  private blinkOn = true; // for ORANGE
  private blueDir: 1 | -1 = 1; // for BLUE horizontal movement

  constructor(snakeBody: Coord[]) {
    this.position = { x: 0, y: 0 };
    this.color = 'RED';
    this.respawn(snakeBody);
  }

  public respawn(snakeBody: Coord[]): void {
    const { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

    const rainbow: Rainbow[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'VIOLET'];

    do {
      this.position = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
      };
    } while (
      snakeBody.some(
        (segment) => segment.x === this.position.x && segment.y === this.position.y,
      )
    );

    this.color = rainbow[Math.floor(Math.random() * rainbow.length)];
    this.blinkOn = true;
    this.blueDir = Math.random() < 0.5 ? -1 : 1;
    // assign visible color for renderer convenience
    this.position.color = (COLORS.RAINBOW as any)[this.color];
  }

  public tickMove(snakeBody: Coord[]): void {
    // BLUE moves slowly horizontal left-right within bounds and avoiding snake
    if (this.color !== 'BLUE') return;
    const { GRID_SIZE, CANVAS_WIDTH } = GameConfig;
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const nextX = this.position.x + this.blueDir;
    if (nextX < 0 || nextX >= maxX || snakeBody.some(s => s.x === nextX && s.y === this.position.y)) {
      this.blueDir = (this.blueDir === 1 ? -1 : 1);
      return;
    }
    // move every other tick to be slow: we can flip blinkOn as tick to act as throttle
    if (this.blinkOn) {
      this.position.x = nextX;
    }
    this.blinkOn = !this.blinkOn;
  }

  public isVisibleThisFrame(): boolean {
    // ORANGE blinks
    if (this.color === 'ORANGE') {
      this.blinkOn = !this.blinkOn;
      return this.blinkOn;
    }
    return true;
  }
}

