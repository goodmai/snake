import { Coord, Direction, GameConfig } from '../config';

export class Snake {
  private body: Coord[];
  private direction: Direction;

  constructor() {
    this.body = [];
    const { GRID_SIZE, CANVAS_HEIGHT, SNAKE_INITIAL_LENGTH, COLORS } = GameConfig;
    const startY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
    const demoColors = [
      COLORS.RAINBOW.RED,
      COLORS.RAINBOW.ORANGE,
      COLORS.RAINBOW.YELLOW,
      COLORS.RAINBOW.GREEN,
      COLORS.RAINBOW.BLUE,
      COLORS.RAINBOW.VIOLET,
    ];
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
      this.body.unshift({ x: i, y: startY, color: demoColors[i % demoColors.length] });
    }
    this.direction = 'RIGHT';
  }

  public getHead(): Coord {
    return this.body[0];
  }

  public getBody(): Coord[] {
    return this.body;
  }

  public changeDirection(newDirection: Direction): void {
    this.direction = newDirection;
  }

  public move(): void {
    const head = { ...this.getHead() };

    switch (this.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    this.body.unshift(head);
    this.body.pop();
  }

  public grow(color?: string): void {
    const tail = { ...this.body[this.body.length - 1] };
    if (color) tail.color = color;
    this.body.push(tail);
  }

  public checkSelfCollision(): boolean {
    const head = this.getHead();
    return this.body
      .slice(1)
      .some((segment) => segment.x === head.x && segment.y === head.y);
  }
}

