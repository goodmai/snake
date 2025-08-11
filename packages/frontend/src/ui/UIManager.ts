import { GameConfig } from '../config';

export class UIManager {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  public drawScore(score: number): void {
    this.ctx.fillStyle = GameConfig.COLORS.UI_TEXT;
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${score}`, 10, 25);
  }

  public drawGameOver(score: number): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
    this.ctx.fillStyle = COLORS.UI_OVERLAY;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = COLORS.UI_TEXT;
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      `Final Score: ${score}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
    );
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText(
      'Click to Restart',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 40,
    );
  }

  public addRestartListener(restartCallback: () => void): void {
    this.ctx.canvas.addEventListener('click', restartCallback);
  }
}

