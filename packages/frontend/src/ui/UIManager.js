import { GameConfig } from '../config';
export class UIManager {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    drawScore(score) {
        this.ctx.fillStyle = GameConfig.COLORS.UI_TEXT;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${score}`, 10, 25);
    }
    drawGameOver(score) {
        const { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
        this.ctx.fillStyle = COLORS.UI_OVERLAY;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.ctx.fillStyle = COLORS.UI_TEXT;
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
    drawLeaderboard(rows) {
        const { CANVAS_WIDTH, CANVAS_HEIGHT } = GameConfig;
        this.ctx.fillStyle = GameConfig.COLORS.UI_TEXT;
        this.ctx.textAlign = 'center';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Top players', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        this.ctx.font = '14px Arial';
        const startY = CANVAS_HEIGHT / 2 + 100;
        rows.slice(0, 5).forEach((r, i) => {
            this.ctx.fillText(`${i + 1}. ${r.name} — ${r.score}`, CANVAS_WIDTH / 2, startY + i * 18);
        });
    }
    drawPaused() {
        const { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
        this.ctx.fillStyle = COLORS.UI_OVERLAY;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.ctx.fillStyle = COLORS.UI_TEXT;
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Paused', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    addRestartListener(restartCallback) {
        this.ctx.canvas.addEventListener('click', restartCallback);
    }
}
