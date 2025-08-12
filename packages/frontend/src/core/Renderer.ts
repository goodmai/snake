import { GameConfig } from '../config';
import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private pixelSize: number;
  private gridCanvas: HTMLCanvasElement;
  private gridCtx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.pixelSize = GameConfig.GRID_SIZE;
    this.ctx = canvas.getContext('2d')!;
    this.gridCanvas = document.createElement('canvas');
    this.gridCtx = this.gridCanvas.getContext('2d')!;
    this.setupDPR();
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getPixelSize(): number {
    return this.pixelSize;
  }

  public setupDPR(): void {
    const dpr = window.devicePixelRatio || 1;
    // Autoscale style size to viewport width with margins
    const margin = 24;
    const vw = Math.max(280, Math.min(480, (window.innerWidth || GameConfig.CANVAS_WIDTH) - margin));
    const targetW = Math.round(vw);
    const targetH = targetW; // square
    this.canvas.style.width = `${targetW}px`;
    this.canvas.style.height = `${targetH}px`;

    // Scale UI buttons proportionally to canvas width
    const btnSize = Math.max(48, Math.round(targetW / 6));
    const btnFont = Math.max(16, Math.round(targetW / 18));
    document.documentElement.style.setProperty('--btn-size', `${btnSize}px`);
    document.documentElement.style.setProperty('--btn-font', `${btnFont}px`);

    // Internal resolution based on logical game size and DPR
    this.canvas.width = Math.floor(GameConfig.CANVAS_WIDTH * dpr);
    this.canvas.height = Math.floor(GameConfig.CANVAS_HEIGHT * dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.gridCanvas.width = this.canvas.width;
    this.gridCanvas.height = this.canvas.height;
    this.gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.gridCtx.scale(dpr, dpr);

    this.pixelSize = GameConfig.GRID_SIZE;
    this.buildGrid();
  }

  private buildGrid(): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
    this.gridCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.gridCtx.strokeStyle = COLORS.GRID_LINES;
    this.gridCtx.lineWidth = 0.5;

    for (let x = this.pixelSize; x < CANVAS_WIDTH; x += this.pixelSize) {
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(x, 0);
      this.gridCtx.lineTo(x, CANVAS_HEIGHT);
      this.gridCtx.stroke();
    }
    for (let y = this.pixelSize; y < CANVAS_HEIGHT; y += this.pixelSize) {
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0, y);
      this.gridCtx.lineTo(CANVAS_WIDTH, y);
      this.gridCtx.stroke();
    }
  }

  public clear(): void {
    this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawGrid(): void {
    this.ctx.drawImage(this.gridCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
  }

  private drawRoundedCell(x: number, y: number, color: string, radius = Math.max(2, Math.round(this.pixelSize * 0.2)), glow = false): void {
    const px = x * this.pixelSize;
    const py = y * this.pixelSize;
    const w = this.pixelSize;
    const h = this.pixelSize;
    const r = Math.min(radius, w / 2, h / 2);

    const ctx = this.ctx;
    ctx.save();
    if (glow) {
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = Math.max(8, Math.round(this.pixelSize * 0.35));
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + w - r, py);
    ctx.quadraticCurveTo(px + w, py, px + w, py + r);
    ctx.lineTo(px + w, py + h - r);
    ctx.quadraticCurveTo(px + w, py + h, px + w - r, py + h);
    ctx.lineTo(px + r, py + h);
    ctx.quadraticCurveTo(px, py + h, px, py + h - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  public drawSnake(snake: Snake): void {
    const { COLORS } = GameConfig;
    const body = snake.getBody();

    const head = body[0];
    const headColor = head.color || COLORS.SNAKE_HEAD;
    const glow = (snake as any).hasTurnGlow?.() === true;
    this.drawRoundedCell(head.x, head.y, headColor, undefined, glow);

    for (let i = 1; i < body.length; i++) {
      const segment = body[i];
      const color = segment.color || COLORS.SNAKE_BODY;
      this.drawRoundedCell(segment.x, segment.y, color);
    }
  }

  public drawFood(food: Food): void {
    if (!food.isVisibleThisFrame()) return;
    this.ctx.fillStyle = food.currentHexColor();
    this.ctx.fillRect(
      food.position.x * this.pixelSize,
      food.position.y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
  }
}

