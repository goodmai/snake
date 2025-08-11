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
  GameOver,
  Stopped,
}

export class GameState {
  public snake: Snake;
  public food: Food;
  public score: number;
  public status: GameStatus;

  constructor() {
    this.snake = new Snake();
    this.food = new Food(this.snake.getBody());
    this.score = 0;
    this.status = GameStatus.Intro;
  }

  public update(): void {
    this.snake.move();

    if (this.isWallCollision() || this.snake.checkSelfCollision()) {
      this.status = GameStatus.GameOver;
      sendScoreToBackend(this.score).catch(console.error);
      return;
    }

    if (this.isFoodCollision()) {
      this.score++;
      this.snake.grow();
      // Проверка победы: змея заняла всё поле
      if (this.isWin()) {
        this.status = GameStatus.GameOver;
        sendScoreToBackend(this.score).catch(console.error);
        return;
      }
      this.food.respawn(this.snake.getBody());
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
  }
}

