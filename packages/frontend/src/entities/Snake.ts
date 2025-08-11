import { Coord, Direction, GameConfig } from '../config';

export class Snake {
  private body: Coord[];
  private direction: Direction;

  constructor() {
    this.body = [];
    const { GRID_SIZE, CANVAS_HEIGHT, SNAKE_INITIAL_LENGTH } = GameConfig;
    const startY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
      this.body.unshift({ x: i, y: startY });
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

  public grow(): void {
    this.body.push({ ...this.body[this.body.length - 1] });
  }

  public checkSelfCollision(): boolean {
    const head = this.getHead();
    return this.body
      .slice(1)
      .some((segment) => segment.x === head.x && segment.y === head.y);
  }
}

