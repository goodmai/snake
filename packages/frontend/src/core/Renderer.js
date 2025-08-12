import { GameConfig } from '../config';
export class Renderer {
    canvas;
    ctx;
    pixelSize;
    gridCanvas;
    gridCtx;
    constructor(canvas) {
        this.canvas = canvas;
        this.pixelSize = GameConfig.GRID_SIZE;
        this.ctx = canvas.getContext('2d');
        this.gridCanvas = document.createElement('canvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.setupDPR();
    }
    getContext() {
        return this.ctx;
    }
    getCanvas() {
        return this.canvas;
    }
    setupDPR() {
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
    buildGrid() {
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
    clear() {
        this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawGrid() {
        this.ctx.drawImage(this.gridCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
    }
    drawSnake(snake) {
        const { COLORS } = GameConfig;
        const body = snake.getBody();
        const head = body[0];
        this.ctx.fillStyle = COLORS.SNAKE_HEAD;
        this.ctx.fillRect(head.x * this.pixelSize, head.y * this.pixelSize, this.pixelSize, this.pixelSize);
        this.ctx.fillStyle = COLORS.SNAKE_BODY;
        for (let i = 1; i < body.length; i++) {
            const segment = body[i];
            this.ctx.fillRect(segment.x * this.pixelSize, segment.y * this.pixelSize, this.pixelSize, this.pixelSize);
        }
    }
    drawFood(food) {
        const { COLORS } = GameConfig;
        this.ctx.fillStyle = COLORS.FOOD;
        this.ctx.fillRect(food.position.x * this.pixelSize, food.position.y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
}
