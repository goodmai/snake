import { GameConfig } from '../config';
import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';
import type { Bullet } from '../game/GameState';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private pixelSize: number;
  private gridCanvas: HTMLCanvasElement;
  private gridCtx: CanvasRenderingContext2D;
  // Starfield layers for parallax
  private starsFar: { x: number; y: number; r: number; tw: number; phase: number }[] = [];
  private starsMid: { x: number; y: number; r: number; tw: number; phase: number }[] = [];
  private starsNear: { x: number; y: number; r: number; tw: number; phase: number }[] = [];
  private lastStarBuildW = 0;
  private lastStarBuildH = 0;

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
    // Rebuild stars if size changed
    if (this.lastStarBuildW !== this.canvas.width || this.lastStarBuildH !== this.canvas.height) {
      this.buildStars();
      this.lastStarBuildW = this.canvas.width;
      this.lastStarBuildH = this.canvas.height;
    }
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

  private buildStars(): void {
    // Density scales with area; keep performant on mobile
    const area = (this.canvas.width * this.canvas.height) / (window.devicePixelRatio || 1);
    const base = 120;
    const density = Math.max(80, Math.min(260, Math.floor(area / (320 * 320) * base)));
    const make = (n: number, scaleR: number) => Array.from({ length: n }).map(() => ({
      x: Math.random() * GameConfig.CANVAS_WIDTH,
      y: Math.random() * GameConfig.CANVAS_HEIGHT,
      r: (Math.random() * 1.2 + 0.3) * scaleR,
      tw: Math.random() * 0.8 + 0.2, // twinkle speed
      phase: Math.random() * Math.PI * 2,
    }));
    this.starsFar = make(Math.round(density * 0.4), 0.7);
    this.starsMid = make(Math.round(density * 0.35), 1.0);
    this.starsNear = make(Math.round(density * 0.25), 1.3);
  }

  public drawStarfield(time = performance.now()): void {
    if (!this.starsFar.length && !this.starsMid.length && !this.starsNear.length) this.buildStars();
    const ctx = this.ctx;
    ctx.save();
    // Slight blue-purple space tint
    const grad = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS_HEIGHT);
    grad.addColorStop(0, 'rgba(10,12,28,0.65)');
    grad.addColorStop(1, 'rgba(8,6,20,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);

    const drawLayer = (arr: typeof this.starsFar, velX: number, velY: number, glow: number) => {
      const offsetX = (time * velX * 0.00005) % GameConfig.CANVAS_WIDTH;
      const offsetY = (time * velY * 0.00005) % GameConfig.CANVAS_HEIGHT;
      for (const s of arr) {
        const x = (s.x + offsetX + GameConfig.CANVAS_WIDTH) % GameConfig.CANVAS_WIDTH;
        const y = (s.y + offsetY + GameConfig.CANVAS_HEIGHT) % GameConfig.CANVAS_HEIGHT;
        const alpha = 0.5 + 0.5 * Math.sin(s.phase + time * 0.0015 * s.tw);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.shadowColor = 'rgba(255,255,255,0.25)';
        ctx.shadowBlur = glow;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Parallax: far moves slowest, near moves fastest
    drawLayer(this.starsFar, -0.5, 0.2, 4);
    drawLayer(this.starsMid, -1.0, 0.4, 6);
    drawLayer(this.starsNear, -1.8, 0.8, 8);

    ctx.restore();
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
    const px = food.position.x * this.pixelSize;
    const py = food.position.y * this.pixelSize;
    const w = this.pixelSize;
    const h = this.pixelSize;

    // If this is a power-up (double-color), draw a cinematic gradient tile
    const anyFood: any = food as any;
    if (anyFood.powerUp && anyFood.colorA && anyFood.colorB) {
      const t = (Math.sin(performance.now() * 0.006) + 1) / 2;
      const ctx = this.ctx;
      ctx.save();
      const grad = ctx.createRadialGradient(px + w/2, py + h/2, Math.max(1, w*0.1), px + w/2, py + h/2, w*0.7);
      grad.addColorStop(0, anyFood.colorA);
      grad.addColorStop(1, anyFood.colorB);
      ctx.fillStyle = grad as any;
      // pulsing rounded rect
      const r = Math.max(3, Math.round(this.pixelSize * (0.2 + 0.05 * Math.sin(performance.now()*0.01))));
      this.roundRect(px, py, w, h, r);
      ctx.fill();
      // outline shimmer
      ctx.lineWidth = Math.max(1, this.pixelSize * 0.08);
      ctx.strokeStyle = `rgba(255,255,255,${(0.4 + 0.4*t).toFixed(2)})`;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // default food
    this.ctx.fillStyle = food.currentHexColor();
    this.ctx.fillRect(px, py, w, h);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  public drawBullets(bullets: Bullet[]): void {
    if (!bullets || bullets.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    bullets.forEach((b) => {
      const cx = b.x * this.pixelSize;
      const cy = b.y * this.pixelSize;
      const dx = b.vx * this.pixelSize;
      const dy = b.vy * this.pixelSize;
      // Laser beam segment with glow
      const nx = dx === 0 && dy === 0 ? 0 : dx;
      const ny = dx === 0 && dy === 0 ? 0 : dy;
      const ex = cx + nx * 0.6;
      const ey = cy + ny * 0.6;
      const sx = cx - nx * 0.6;
      const sy = cy - ny * 0.6;

      const grad = ctx.createLinearGradient(sx, sy, ex, ey);
      grad.addColorStop(0, 'rgba(255,80,80,0.0)');
      grad.addColorStop(0.5, 'rgba(255,60,60,0.9)');
      grad.addColorStop(1, 'rgba(255,80,80,0.0)');
      ctx.strokeStyle = grad as any;
      ctx.lineWidth = Math.max(1.5, this.pixelSize * 0.16);
      ctx.shadowColor = 'rgba(255,0,0,0.75)';
      ctx.shadowBlur = Math.max(8, Math.round(this.pixelSize * 0.6));
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Hot core
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(0.8, this.pixelSize * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    });
    ctx.restore();
  }
}

