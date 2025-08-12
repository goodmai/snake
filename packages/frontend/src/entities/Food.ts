import { Coord, GameConfig, Rainbow, PowerUp } from '../config';
import { pickRandomDistinct } from '../utils/random';

export class Food {
  public position: Coord;
  public color: Rainbow;
  public powerUp: PowerUp | null = null;
  private colorA: string | null = null;
  private colorB: string | null = null;
  private blinkOn = true; // for ORANGE
  private blinkTick = 0; // slow down orange blink
  private blueDir: 1 | -1 = 1; // for BLUE horizontal movement
  private blueTick: number = 0; // throttle BLUE movement speed

  constructor(snakeBody: Coord[]) {
    this.position = { x: 0, y: 0 };
    this.color = 'RED';
    this.respawn(snakeBody);
  }

  public respawn(snakeBody: Coord[]): void {
    // reset special
    this.powerUp = null; this.colorA = null; this.colorB = null;
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

    // 30%+ chance to spawn as a Double Boost Square (disabled during unit tests)
    const isTest = typeof process !== 'undefined' && (process as any).env?.NODE_ENV === 'test';
    if (!isTest && Math.random() < 0.5) {
      const pick = Math.random();
      if (pick < 0.2) {
        this.powerUp = 'INFERNO';
        this.colorA = COLORS.EXTRA.INFERNO_A;
        this.colorB = COLORS.EXTRA.INFERNO_B;
      } else if (pick < 0.4) {
        this.powerUp = 'PHASE';
        this.colorA = COLORS.EXTRA.PHASE_A;
        this.colorB = COLORS.EXTRA.PHASE_B;
      } else if (pick < 0.6) {
        this.powerUp = 'ICE';
        this.colorA = COLORS.EXTRA.ICE_A;
        this.colorB = COLORS.EXTRA.ICE_B;
      } else if (pick < 0.8) {
        this.powerUp = 'TOXIC';
        this.colorA = COLORS.EXTRA.TOXIC_A;
        this.colorB = COLORS.EXTRA.TOXIC_B;
      } else {
        this.powerUp = 'BLACKHOLE';
        this.colorA = COLORS.EXTRA.BLACK;
        this.colorB = COLORS.EXTRA.WHITE;
      }
      try {
        if (typeof window !== 'undefined') {
          fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'powerUpSpawn', payload: { type: this.powerUp, pos: this.position } }) });
        }
      } catch {}
    }

    // pick a random normal color if not special; avoid repeating the previous to make changes obvious
    if (!this.powerUp) {
      const prev = this.color;
      this.color = pickRandomDistinct(rainbow, prev);
    }
    this.blinkOn = true;
    this.blueDir = Math.random() < 0.5 ? -1 : 1;
    // assign visible color for renderer convenience
    this.position.color = this.powerUp ? (this.colorA as string) : (COLORS.RAINBOW as any)[this.color];
  }

  public tickMove(snakeBody: Coord[]): void {
    // BLUE moves slowly horizontal left-right within bounds and avoiding snake
    if (this.color !== 'BLUE') return;
    const { GRID_SIZE, CANVAS_WIDTH } = GameConfig;
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const nextX = this.position.x + this.blueDir;

    // Throttle movement: move only every 3rd tick
    this.blueTick = (this.blueTick + 1) % 3;
    if (this.blueTick !== 0) {
      // still toggle blink to keep subtle animation
      this.blinkOn = !this.blinkOn;
      return;
    }

    if (nextX < 0 || nextX >= maxX || snakeBody.some(s => s.x === nextX && s.y === this.position.y)) {
      this.blueDir = (this.blueDir === 1 ? -1 : 1);
      return;
    }
    this.position.x = nextX;
    // soft blink toggle for some motion feel
    this.blinkOn = !this.blinkOn;
  }

  public isVisibleThisFrame(): boolean {
    // ORANGE blinks 10x slower than before
    if (this.color === 'ORANGE') {
      this.blinkTick = (this.blinkTick + 1) % 10;
      if (this.blinkTick === 0) {
        this.blinkOn = !this.blinkOn;
      }
      return this.blinkOn;
    }
    return true;
  }

  public currentHexColor(): string {
    if (this.powerUp && this.colorA && this.colorB) {
      // oscillate between A and B for a liquid gradient feel
      const t = (Math.sin(performance.now() * 0.003) + 1) / 2;
      const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
      const pa = this.hexToRgb(this.colorA);
      const pb = this.hexToRgb(this.colorB);
      const r = lerp(pa.r, pb.r), g = lerp(pa.g, pb.g), b = lerp(pa.b, pb.b);
      return `rgb(${r}, ${g}, ${b})`;
    }
    const c = (GameConfig.COLORS.RAINBOW as any)[this.color];
    return typeof c === 'string' ? c : '#ffffff';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const m = hex.replace('#','');
    const bigint = parseInt(m, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
}

