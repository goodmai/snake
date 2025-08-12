import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';
import { applyModifierForColor } from './modifiers';

async function sendScoreToBackend(score: number): Promise<void> {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg || !tg.initData) {
    console.warn('Telegram initData not found. Score not sent.');
    return;
  }

  try {
    await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, initData: tg.initData }),
    });
    console.log(`Score ${score} sent successfully.`);
  } catch (error) {
    console.error('Failed to send score:', error);
  }
}

export enum GameStatus {
  Intro,
  Running,
  Paused,
  GameOver,
  Stopped,
}

export type Bullet = {
  x: number; // continuous grid coords (0..cells)
  y: number;
  vx: number; // cells per tick
  vy: number; // cells per tick
  life: number; // ticks lived
  maxLife: number; // safety cap
};

export class GameState {
  public snake: Snake;
  public food: Food;
  public score: number;
  public status: GameStatus;
  public canShoot: boolean = false;
  public bullets: Bullet[] = [];
  private speedMultiplier = 1; // affected by red/green
  // Timed effects
  private adrenalineUntil = 0;
  private ghostUntil = 0;
  private inverseUntil = 0;
  private iceUntil = 0;
  private superspeedUntil = 0;
  private shieldUntil = 0;
  private multiplierUntil = 0;
  private repulsorUntil = 0;

  constructor() {
    this.snake = new Snake();
    this.food = new Food(this.snake.getBody());
    this.score = 0;
    this.status = GameStatus.Intro;
  }

  public getCurrentSpeedMs(): number {
    let mult = this.speedMultiplier;
    const now = performance.now();
    if (now < this.adrenalineUntil) mult *= 1/1.5; // faster
    if (now < this.superspeedUntil) mult *= 1/2.0; // x2 speed
    if (now < this.iceUntil) mult *= 2.0; // slower (x0.5 speed)
    return Math.max(48, Math.round(GameConfig.GAME_SPEED_MS * mult));
  }

  public update(): void {
    // move special food (blue)
    this.food.tickMove(this.snake.getBody());

    // update input inversion flag on handler via global
    const now = performance.now();
    try {
      (window as any).__INPUT_INVERT__ = now < this.inverseUntil;
    } catch {}

    // Repulsor: push food away from head
    if (now < this.repulsorUntil) {
      const head = this.snake.getHead();
      const dx = this.food.position.x - head.x;
      const dy = this.food.position.y - head.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0 && dist <= 3) {
        const stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        const stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        // try move away one cell (prefer greater component)
        if (Math.abs(dx) >= Math.abs(dy)) this.food.position.x += stepX;
        else this.food.position.y += stepY;
      }
    }

    this.snake.move();
    this.snake.tickEffects();

    // update bullets animation and collisions
    this.updateBullets();

    const ghostActive = performance.now() < this.ghostUntil;
    const invuln = performance.now() < this.superspeedUntil || performance.now() < this.shieldUntil;
    if (this.isWallCollision() || (!ghostActive && this.snake.checkSelfCollision())) {
      if (invuln) {
        // consume shield if active; superspeed is not consumed
        if (performance.now() < this.shieldUntil) this.shieldUntil = 0;
      } else {
        this.status = GameStatus.GameOver;
        sendScoreToBackend(this.score).catch(console.error);
        return;
      }
    }

    if (this.isFoodCollision()) {
      this.onEatFood();
    }
  }

  private isWallCollision(): boolean {
    const head = this.snake.getHead();
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
    return (
      head.x < 0 ||
      head.x >= CANVAS_WIDTH / GRID_SIZE ||
      head.y < 0 ||
      head.y >= CANVAS_HEIGHT / GRID_SIZE
    );
  }

  private isFoodCollision(): boolean {
    const head = this.snake.getHead();
    return head.x === this.food.position.x && head.y === this.food.position.y;
  }

  private isWin(): boolean {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
    const cells = (CANVAS_WIDTH / GRID_SIZE) * (CANVAS_HEIGHT / GRID_SIZE);
    return this.snake.getBody().length >= cells;
  }

  public reset(): void {
    if (this.status === GameStatus.Running) return;

    this.snake = new Snake();
    this.food = new Food(this.snake.getBody());
    this.score = 0;
    this.status = GameStatus.Running;
    this.canShoot = false;
    this.bullets = [];
    this.speedMultiplier = 1;
    const now = performance.now();
    this.adrenalineUntil = this.ghostUntil = this.inverseUntil = this.iceUntil = now;
    this.updateShootButton();
  }

  // E2E helper: force game over and post score
  public forceGameOver(): void {
    if (this.status === GameStatus.Running) {
      this.status = GameStatus.GameOver;
      sendScoreToBackend(this.score).catch(console.error);
    }
  }
  private onEatFood(): void {
    // apply score with multiplier
    const now = performance.now();
    this.score += now < this.multiplierUntil ? 2 : 1;
    const { COLORS, EFFECTS } = GameConfig;
    const eatenColor = this.food.powerUp ? (this.food as any).colorA : (COLORS.RAINBOW as any)[this.food.color];
    // Поглощение цвета: окрасить хвост и усилить последний сегмент
    this.snake.grow(eatenColor);

    // SFX per power-up type
    const play = (id: string) => {
      try { const el = document.getElementById(id) as HTMLAudioElement | null; el?.currentTime && (el.currentTime = 0); el?.play?.().catch(()=>{});} catch {}
    };

    // Apply special power-up effects
    const now2 = performance.now();
    switch (this.food.powerUp) {
      case 'INFERNO':
        this.adrenalineUntil = now2 + EFFECTS.INFERNO_MS; // x1.5 speed
        play('sfx-inferno');
        break;
      case 'PHASE':
        this.ghostUntil = now2 + EFFECTS.PHASE_MS; // pass-through
        play('sfx-phase');
        break;
      case 'ICE':
        this.iceUntil = now2 + EFFECTS.ICE_MS; // slow
        play('sfx-ice');
        break;
      case 'TOXIC': {
        // shorten by 3, keep min 3
        const body = this.snake.getBody();
        const minLen = 3;
        const remove = Math.min(3, Math.max(0, body.length - minLen));
        for (let i=0;i<remove;i++) body.pop();
        play('sfx-toxic');
        break;
      }
      case 'BLACKHOLE':
        this.inverseUntil = now2 + EFFECTS.BLACK_HOLE_MS; // controls invert
        play('sfx-blackhole');
        break;
      case 'SUPERSONIC':
        this.superspeedUntil = now2 + EFFECTS.SUPERSONIC_MS;
        // invulnerability implies collisions are ignored briefly
        play('sfx-supersonic');
        break;
      case 'SHIELD':
        this.shieldUntil = now2 + EFFECTS.SHIELD_MS;
        play('sfx-shield');
        break;
      case 'MULTIPLIER':
        this.multiplierUntil = now2 + EFFECTS.MULTIPLIER_MS;
        play('sfx-multiplier');
        break;
      case 'REPULSOR':
        this.repulsorUntil = now2 + EFFECTS.REPULSOR_MS;
        play('sfx-repulsor');
        break;
      default:
        // fallback small chime
        play('sfx-pickup');
    }

    // Клиентский лог: факт поедания с цветом
    try {
      const isTest = typeof process !== 'undefined' && (process as any).env?.NODE_ENV === 'test';
      if (!isTest && typeof window !== 'undefined') {
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'foodEaten', payload: { color: this.food.color, hex: eatenColor, score: this.score } }),
        });
      }
    } catch {}

    // Применить модификатор цвета
    applyModifierForColor(this, this.food.color as any);

    if (this.isWin()) {
      this.status = GameStatus.GameOver;
      sendScoreToBackend(this.score).catch(console.error);
      return;
    }
    this.food.respawn(this.snake.getBody());
  }

  public shoot(): boolean {
    if (!this.canShoot) return false;
    const head = this.snake.getHead();
    const dir = this.getDirectionVector();

    // play laser sound if available
    try {
      const el = document.getElementById('sfx-laser') as HTMLAudioElement | null;
      el?.currentTime && (el.currentTime = 0);
      el?.play?.().catch(() => {});
    } catch {}
    try { (window as any).__glogger__?.event('shoot', {}); (window as any).__glogger__?.pushCmd('S'); } catch {}

    // spawn bullet for animation
    this.spawnBullet(head.x + 0.5, head.y + 0.5, dir.x, dir.y);

    // Maintain existing immediate-hit logic for gameplay/tests
    const fx = this.food.position.x;
    const fy = this.food.position.y;
    const dx = fx - head.x;
    const dy = fy - head.y;
    if ((dir.x !== 0 && dy === 0 && Math.sign(dx) === Math.sign(dir.x) && Math.abs(dx) > 0) ||
        (dir.y !== 0 && dx === 0 && Math.sign(dy) === Math.sign(dir.y) && Math.abs(dy) > 0)) {
      this.onEatFood();
      return true;
    }
    return false;
  }

  private getDirectionVector(): { x: number; y: number } {
    const h = this.snake.getHead();
    // approximate via next cell based on where the second segment is
    const neck = this.snake.getBody()[1] || h;
    const vx = h.x - neck.x;
    const vy = h.y - neck.y;
    return { x: Math.sign(vx), y: Math.sign(vy) };
  }

  private spawnBullet(x: number, y: number, dx: number, dy: number): void {
    // normalize direction; if zero (no movement), do nothing
    if (dx === 0 && dy === 0) return;
    // 10x faster laser travel
    const speedCellsPerTick = 7.5;
    this.bullets.push({ x, y, vx: dx * speedCellsPerTick, vy: dy * speedCellsPerTick, life: 0, maxLife: 16 });
  }

  private updateBullets(): void {
    if (!this.bullets.length) return;
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
    const fx = this.food.position.x;
    const fy = this.food.position.y;

    this.bullets = this.bullets.filter((b) => {
      b.x += b.vx;
      b.y += b.vy;
      b.life++;

      // out of bounds or expired
      if (b.x < 0 || b.y < 0 || b.x > maxX || b.y > maxY || b.life > b.maxLife) return false;

      // if food still at some cell and bullet reached that cell center, keep animating; hit already handled in shoot()
      const closeToFood = Math.abs(b.x - (fx + 0.5)) < 0.35 && Math.abs(b.y - (fy + 0.5)) < 0.35;
      if (closeToFood) {
        // allow a small overshoot, then remove
        return b.life < Math.min(b.maxLife, 4);
      }
      return true;
    });
  }

  private updateShootButton(): void {
    const btn = document.getElementById('btn-shoot') as HTMLButtonElement | null;
    if (!btn) return;
    btn.style.display = this.canShoot ? 'inline-flex' : 'none';
    btn.disabled = !this.canShoot;
  }
}

