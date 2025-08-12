import { GameConfig } from '../config';
export class Renderer {
    canvas;
    ctx;
    pixelSize;
    gridCanvas;
    gridCtx;
    // Starfield layer
    stars = [];
    lastStarBuildW = 0;
    lastStarBuildH = 0;
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
    getPixelSize() {
        return this.pixelSize;
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
        // Rebuild stars if size changed
        if (this.lastStarBuildW !== this.canvas.width || this.lastStarBuildH !== this.canvas.height) {
            this.buildStars();
            this.lastStarBuildW = this.canvas.width;
            this.lastStarBuildH = this.canvas.height;
        }
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
    buildStars() {
        // Density scales with area; keep performant on mobile
        const area = (this.canvas.width * this.canvas.height) / (window.devicePixelRatio || 1);
        const base = 120;
        const density = Math.max(80, Math.min(260, Math.floor(area / (320 * 320) * base)));
        this.stars = Array.from({ length: density }).map(() => ({
            x: Math.random() * GameConfig.CANVAS_WIDTH,
            y: Math.random() * GameConfig.CANVAS_HEIGHT,
            r: Math.random() * 1.2 + 0.3,
            tw: Math.random() * 0.8 + 0.2, // twinkle speed
            phase: Math.random() * Math.PI * 2,
        }));
    }
    drawStarfield(time = performance.now()) {
        if (!this.stars.length)
            this.buildStars();
        const ctx = this.ctx;
        ctx.save();
        // Slight blue-purple space tint
        const grad = ctx.createLinearGradient(0, 0, 0, GameConfig.CANVAS_HEIGHT);
        grad.addColorStop(0, 'rgba(10,12,28,0.65)');
        grad.addColorStop(1, 'rgba(8,6,20,0.65)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        // Stars with soft glow and independent twinkle
        for (const s of this.stars) {
            const alpha = 0.5 + 0.5 * Math.sin(s.phase + time * 0.0015 * s.tw);
            ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            // subtle glow
            ctx.shadowColor = 'rgba(255,255,255,0.25)';
            ctx.shadowBlur = 6;
        }
        ctx.restore();
    }
    drawGrid() {
        this.ctx.drawImage(this.gridCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
    }
    drawRoundedCell(x, y, color, radius = Math.max(2, Math.round(this.pixelSize * 0.2)), glow = false) {
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
    drawSnake(snake) {
        const { COLORS } = GameConfig;
        const body = snake.getBody();
        const head = body[0];
        const headColor = head.color || COLORS.SNAKE_HEAD;
        const glow = snake.hasTurnGlow?.() === true;
        this.drawRoundedCell(head.x, head.y, headColor, undefined, glow);
        for (let i = 1; i < body.length; i++) {
            const segment = body[i];
            const color = segment.color || COLORS.SNAKE_BODY;
            this.drawRoundedCell(segment.x, segment.y, color);
        }
    }
    drawFood(food) {
        if (!food.isVisibleThisFrame())
            return;
        this.ctx.fillStyle = food.currentHexColor();
        this.ctx.fillRect(food.position.x * this.pixelSize, food.position.y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
    drawBullets(bullets) {
        if (!bullets || bullets.length === 0)
            return;
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
            ctx.strokeStyle = grad;
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
