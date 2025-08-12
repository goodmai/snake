import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';

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

export class GameState {
  public snake: Snake;
  public food: Food;
  public score: number;
  public status: GameStatus;
  public canShoot: boolean = false;
  private speedMultiplier = 1; // affected by red/green

  constructor() {
    this.snake = new Snake();
    this.food = new Food(this.snake.getBody());
    this.score = 0;
    this.status = GameStatus.Intro;
  }

  public getCurrentSpeedMs(): number {
    return Math.max(48, Math.round(GameConfig.GAME_SPEED_MS * this.speedMultiplier));
  }

  public update(): void {
    // move special food (blue)
    this.food.tickMove(this.snake.getBody());

    this.snake.move();

    if (this.isWallCollision() || this.snake.checkSelfCollision()) {
      this.status = GameStatus.GameOver;
      sendScoreToBackend(this.score).catch(console.error);
      return;
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
    this.speedMultiplier = 1;
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
    this.score++;
    const { COLORS } = GameConfig;
    const eatenColor = (COLORS.RAINBOW as any)[this.food.color];
    this.snake.grow(eatenColor);

    // Apply effects
    switch (this.food.color) {
      case 'RED':
        this.speedMultiplier *= 0.95;
        break;
      case 'GREEN':
        this.speedMultiplier *= 1.05;
        break;
      case 'YELLOW':
        this.canShoot = true;
        this.updateShootButton();
        break;
      case 'VIOLET':
        this.canShoot = false;
        this.updateShootButton();
        break;
      // ORANGE blinking handled in renderer; BLUE movement already handled in tickMove
    }

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
    // Check if food is in the direction of head in same row/col
    const fx = this.food.position.x;
    const fy = this.food.position.y;
    const dx = fx - head.x;
    const dy = fy - head.y;
    const dir = this.getDirectionVector();
    if ((dir.x !== 0 && dy === 0 && Math.sign(dx) === Math.sign(dir.x) && Math.abs(dx) > 0) ||
        (dir.y !== 0 && dx === 0 && Math.sign(dy) === Math.sign(dir.y) && Math.abs(dy) > 0)) {
      // Hit
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

  private updateShootButton(): void {
    const btn = document.getElementById('btn-shoot') as HTMLButtonElement | null;
    if (!btn) return;
    btn.style.display = this.canShoot ? 'inline-flex' : 'none';
    btn.disabled = !this.canShoot;
  }
}

