import { GameConfig } from '../config';
import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly pixelSize: number;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.pixelSize = GameConfig.GRID_SIZE;
    this.canvas.width = GameConfig.CANVAS_WIDTH;
    this.canvas.height = GameConfig.CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public clear(): void {
    this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawGrid(): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
    this.ctx.strokeStyle = COLORS.GRID_LINES;
    this.ctx.lineWidth = 0.5;

    for (let x = this.pixelSize; x < CANVAS_WIDTH; x += this.pixelSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = this.pixelSize; y < CANVAS_HEIGHT; y += this.pixelSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }

  public drawSnake(snake: Snake): void {
    const { COLORS } = GameConfig;
    const body = snake.getBody();

    const head = body[0];
    this.ctx.fillStyle = COLORS.SNAKE_HEAD;
    this.ctx.fillRect(
      head.x * this.pixelSize,
      head.y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );

    this.ctx.fillStyle = COLORS.SNAKE_BODY;
    for (let i = 1; i < body.length; i++) {
      const segment = body[i];
      this.ctx.fillRect(
        segment.x * this.pixelSize,
        segment.y * this.pixelSize,
        this.pixelSize,
        this.pixelSize
      );
    }
  }

  public drawFood(food: Food): void {
    const { COLORS } = GameConfig;
    this.ctx.fillStyle = COLORS.FOOD;
    this.ctx.fillRect(
      food.position.x * this.pixelSize,
      food.position.y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
  }
}

