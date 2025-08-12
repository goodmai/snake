import { Coord, Direction, GameConfig } from '../config';

export class Snake {
  private body: Coord[];
  private direction: Direction;
  private turnGlowFrames: number = 0;

  constructor() {
    this.body = [];
    const { GRID_SIZE, CANVAS_HEIGHT, SNAKE_INITIAL_LENGTH, COLORS } = GameConfig;
    const startY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
    // По требованиям: размер змеи 4, узор G-Y-G-Y (зелёный-жёлтый)
    const baseColors = [COLORS.RAINBOW.GREEN, COLORS.RAINBOW.YELLOW, COLORS.RAINBOW.GREEN, COLORS.RAINBOW.YELLOW];
    const initLen = Math.max(4, SNAKE_INITIAL_LENGTH);
    // Build from head (rightmost) to tail (leftmost) so that:
    // head.x = initLen - 1 and colors follow [G, Y, G, Y, ...]
for (let j = 0; j < initLen; j++) {
      const color = baseColors[j % baseColors.length];
      const x = (initLen - 1) - j;
      this.body.push({ x, y: startY, color });
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
    const opposite = (a: Direction, b: Direction) =>
      (a === 'UP' && b === 'DOWN') || (a === 'DOWN' && b === 'UP') ||
      (a === 'LEFT' && b === 'RIGHT') || (a === 'RIGHT' && b === 'LEFT');
    if (newDirection === this.direction) return;
    if (opposite(newDirection, this.direction)) return;
    this.direction = newDirection;
    this.turnGlowFrames = 6; // brief glow effect on turns
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

  public tickEffects(): void {
    if (this.turnGlowFrames > 0) this.turnGlowFrames--;
  }

  public hasTurnGlow(): boolean {
    return this.turnGlowFrames > 0;
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

