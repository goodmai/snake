import { Food } from '../entities/Food';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';
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
    constructor() {
        this.snake = new Snake();
        this.food = new Food(this.snake.getBody());
        this.score = 0;
        this.status = GameStatus.Intro;
    }
    update() {
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
    }
    // E2E helper: force game over and post score
    forceGameOver() {
        if (this.status === GameStatus.Running) {
            this.status = GameStatus.GameOver;
            sendScoreToBackend(this.score).catch(console.error);
        }
    }
}
