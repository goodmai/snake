import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';
import { applyModifierForColor } from './modifiers';
async function sendScoreToBackend(score) {
    const tg = window.Telegram?.WebApp;
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
    }
    catch (error) {
        console.error('Failed to send score:', error);
    }
}
export var GameStatus;
(function (GameStatus) {
    GameStatus[GameStatus["Intro"] = 0] = "Intro";
    GameStatus[GameStatus["Running"] = 1] = "Running";
    GameStatus[GameStatus["Paused"] = 2] = "Paused";
    GameStatus[GameStatus["GameOver"] = 3] = "GameOver";
    GameStatus[GameStatus["Stopped"] = 4] = "Stopped";
})(GameStatus || (GameStatus = {}));
export class GameState {
    snake;
    food;
    score;
    status;
    canShoot = false;
    bullets = [];
    speedMultiplier = 1; // affected by red/green
    constructor() {
        this.snake = new Snake();
        this.food = new Food(this.snake.getBody());
        this.score = 0;
        this.status = GameStatus.Intro;
    }
    getCurrentSpeedMs() {
        return Math.max(48, Math.round(GameConfig.GAME_SPEED_MS * this.speedMultiplier));
    }
    update() {
        // move special food (blue)
        this.food.tickMove(this.snake.getBody());
        this.snake.move();
        this.snake.tickEffects();
        // update bullets animation and collisions
        this.updateBullets();
        if (this.isWallCollision() || this.snake.checkSelfCollision()) {
            this.status = GameStatus.GameOver;
            sendScoreToBackend(this.score).catch(console.error);
            return;
        }
        if (this.isFoodCollision()) {
            this.onEatFood();
        }
    }
    isWallCollision() {
        const head = this.snake.getHead();
        const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
        return (head.x < 0 ||
            head.x >= CANVAS_WIDTH / GRID_SIZE ||
            head.y < 0 ||
            head.y >= CANVAS_HEIGHT / GRID_SIZE);
    }
    isFoodCollision() {
        const head = this.snake.getHead();
        return head.x === this.food.position.x && head.y === this.food.position.y;
    }
    isWin() {
        const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
        const cells = (CANVAS_WIDTH / GRID_SIZE) * (CANVAS_HEIGHT / GRID_SIZE);
        return this.snake.getBody().length >= cells;
    }
    reset() {
        if (this.status === GameStatus.Running)
            return;
        this.snake = new Snake();
        this.food = new Food(this.snake.getBody());
        this.score = 0;
        this.status = GameStatus.Running;
        this.canShoot = false;
        this.bullets = [];
        this.speedMultiplier = 1;
        this.updateShootButton();
    }
    // E2E helper: force game over and post score
    forceGameOver() {
        if (this.status === GameStatus.Running) {
            this.status = GameStatus.GameOver;
            sendScoreToBackend(this.score).catch(console.error);
        }
    }
    onEatFood() {
        this.score++;
        const { COLORS } = GameConfig;
        const eatenColor = COLORS.RAINBOW[this.food.color];
        // Поглощение цвета: окрасить хвост и усилить последний сегмент
        this.snake.grow(eatenColor);
        // Клиентский лог: факт поедания с цветом
        try {
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'foodEaten', payload: { color: this.food.color, hex: eatenColor, score: this.score } }),
            });
        }
        catch { }
        // Применить модификатор цвета
        applyModifierForColor(this, this.food.color);
        if (this.isWin()) {
            this.status = GameStatus.GameOver;
            sendScoreToBackend(this.score).catch(console.error);
            return;
        }
        this.food.respawn(this.snake.getBody());
    }
    shoot() {
        if (!this.canShoot)
            return false;
        const head = this.snake.getHead();
        const dir = this.getDirectionVector();
        // play laser sound if available
        try {
            const el = document.getElementById('sfx-laser');
            el?.currentTime && (el.currentTime = 0);
            el?.play?.().catch(() => { });
        }
        catch { }
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
    getDirectionVector() {
        const h = this.snake.getHead();
        // approximate via next cell based on where the second segment is
        const neck = this.snake.getBody()[1] || h;
        const vx = h.x - neck.x;
        const vy = h.y - neck.y;
        return { x: Math.sign(vx), y: Math.sign(vy) };
    }
    spawnBullet(x, y, dx, dy) {
        // normalize direction; if zero (no movement), do nothing
        if (dx === 0 && dy === 0)
            return;
        const speedCellsPerTick = 0.75; // smooth travel
        this.bullets.push({ x, y, vx: dx * speedCellsPerTick, vy: dy * speedCellsPerTick, life: 0, maxLife: 64 });
    }
    updateBullets() {
        if (!this.bullets.length)
            return;
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
            if (b.x < 0 || b.y < 0 || b.x > maxX || b.y > maxY || b.life > b.maxLife)
                return false;
            // if food still at some cell and bullet reached that cell center, keep animating; hit already handled in shoot()
            const closeToFood = Math.abs(b.x - (fx + 0.5)) < 0.35 && Math.abs(b.y - (fy + 0.5)) < 0.35;
            if (closeToFood) {
                // allow a small overshoot, then remove
                return b.life < Math.min(b.maxLife, 4);
            }
            return true;
        });
    }
    updateShootButton() {
        const btn = document.getElementById('btn-shoot');
        if (!btn)
            return;
        btn.style.display = this.canShoot ? 'inline-flex' : 'none';
        btn.disabled = !this.canShoot;
    }
}
