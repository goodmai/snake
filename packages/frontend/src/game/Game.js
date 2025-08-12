import { GameConfig } from '../config';
import { InputHandler } from '../core/InputHandler';
import { Renderer } from '../core/Renderer';
import { GameState, GameStatus } from './GameState';
import { UIManager } from '../ui/UIManager';
export class Game {
    renderer;
    inputHandler;
    gameState;
    uiManager;
    lastFrameTime = 0;
    lastLeaderboard = null;
    leaderboardRequested = false;
    gameLoopId = null;
    e2eForceHandled = false;
    statusListeners = [];
    introPath = [];
    introIndex = 0;
    introTargetLen = 8;
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.inputHandler = new InputHandler();
        this.gameState = new GameState();
        this.uiManager = new UIManager(this.renderer.getContext());
        this.buildIntroPath();
        this.restart = this.restart.bind(this);
        // Ensure leaderboard fetch happens on GameOver regardless of code path (update/loop/force)
        this.onStatusChange((s) => {
            if (s === GameStatus.GameOver) {
                if (!this.leaderboardRequested) {
                    this.leaderboardRequested = true;
                    this.fetchLeaderboard().finally(() => (this.leaderboardRequested = false));
                }
            }
        });
    }
    start() {
        // Handle DPR and resize
        this.renderer.setupDPR();
        window.addEventListener('resize', () => this.renderer.setupDPR());
        const controls = {
            up: document.getElementById('btn-up'),
            down: document.getElementById('btn-down'),
            left: document.getElementById('btn-left'),
            right: document.getElementById('btn-right'),
        };
        this.ensureShootButton();
        this.inputHandler.init(this.renderer.getCanvas(), controls);
        // Кнопка сначала как Start, затем как Restart
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) {
            btnRestart.textContent = this.gameState.status === GameStatus.Intro ? 'Start ▶' : 'Restart ⟲';
            btnRestart.onclick = () => {
                if (this.gameState.status === GameStatus.Intro) {
                    this.beginGame();
                    btnRestart.textContent = 'Restart ⟲';
                    this.emitStatus();
                }
                else {
                    this.restart();
                }
            };
        }
        const shootBtn = document.getElementById('btn-shoot');
        if (shootBtn) {
            shootBtn.onclick = () => {
                this.gameState.shoot();
            };
            shootBtn.style.display = 'none';
        }
        // keyboard support for shooting
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState.canShoot) {
                    this.gameState.shoot();
                }
            }
        });
        this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
    }
    loop(currentTime) {
        this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
        if (this.gameState.status === GameStatus.Stopped) {
            if (this.gameLoopId) {
                cancelAnimationFrame(this.gameLoopId);
                this.gameLoopId = null;
            }
            return;
        }
        if (this.gameState.status === GameStatus.GameOver) {
            // Ensure leaderboard request happens even if GameOver was forced outside update()
            if (!this.leaderboardRequested) {
                this.leaderboardRequested = true;
                this.fetchLeaderboard().finally(() => (this.leaderboardRequested = false));
            }
            this.render();
            this.setStatus(GameStatus.Stopped);
            return;
        }
        if (document.hidden && this.gameState.status === GameStatus.Running) {
            this.setStatus(GameStatus.Paused);
        }
        else if (!document.hidden && this.gameState.status === GameStatus.Paused) {
            this.setStatus(GameStatus.Running);
        }
        const deltaTime = currentTime - this.lastFrameTime;
        if (deltaTime >= this.gameState.getCurrentSpeedMs()) {
            this.lastFrameTime = currentTime;
            this.update();
        }
        this.render();
    }
    update() {
        if (this.gameState.status === GameStatus.Intro) {
            // Детерминированная петля по периметру, плавный рост до introTargetLen
            const body = this.gameState.snake.getBody();
            const next = this.introPath[this.introIndex];
            body.unshift({ x: next.x, y: next.y });
            if (body.length > this.introTargetLen)
                body.pop();
            this.introIndex = (this.introIndex + 1) % this.introPath.length;
            // Радужная пульсация: обновим цвета сегментов по синусу от времени
            const t = performance.now() / 400; // период ~400мс
            for (let i = 0; i < body.length; i++) {
                const hue = Math.floor(((i * 30 + t * 180) % 360));
                // Используем запятую в hsl() для совместимости вебвью
                body[i].color = `hsl(${hue}, 100%, 50%)`;
            }
            return;
        }
        if (this.gameState.status === GameStatus.Paused) {
            return;
        }
        // E2E hook: allow forcing immediate game over via global flag
        const force = window.__E2E_FORCE_GAME_OVER__;
        if (force && !this.e2eForceHandled) {
            this.e2eForceHandled = true;
            this.gameState.forceGameOver();
        }
        const prevScore = this.gameState.score;
        const nextDirection = this.inputHandler.getDirection();
        this.gameState.snake.changeDirection(nextDirection);
        this.gameState.update();
        const tg = window.Telegram?.WebApp;
        if (this.gameState.score > prevScore) {
            tg?.HapticFeedback?.impactOccurred?.('light');
        }
        if (this.gameState.status === GameStatus.GameOver) {
            tg?.HapticFeedback?.notificationOccurred?.('error');
            if (!this.leaderboardRequested) {
                this.leaderboardRequested = true;
                this.fetchLeaderboard().finally(() => (this.leaderboardRequested = false));
            }
            this.emitStatus();
        }
    }
    render() {
        this.renderer.clear();
        // dreamy starfield background
        this.renderer.drawStarfield();
        this.renderer.drawGrid();
        if (this.gameState.status !== GameStatus.Intro) {
            this.renderer.drawFood(this.gameState.food);
            this.renderer.drawSnake(this.gameState.snake);
            // draw bullets over the field
            this.renderer.drawBullets(this.gameState.bullets);
            this.uiManager.drawScore(this.gameState.score);
        }
        else {
            // В интро показываем только демонстрационную змейку
            this.renderer.drawSnake(this.gameState.snake);
        }
        if (this.gameState.status === GameStatus.GameOver || this.gameState.status === GameStatus.Stopped) {
            this.uiManager.drawGameOver(this.gameState.score);
            if (this.lastLeaderboard) {
                this.uiManager.drawLeaderboard(this.lastLeaderboard);
            }
        }
        if (this.gameState.status === GameStatus.Paused) {
            this.uiManager.drawPaused();
        }
    }
    async fetchLeaderboard() {
        try {
            const resp = await fetch('/api/leaderboard', { cache: 'no-store' });
            if (!resp.ok)
                return;
            const data = await resp.json();
            this.lastLeaderboard = data.map(d => ({ name: d.name, score: d.score }));
        }
        catch (e) {
            console.error('Failed to load leaderboard', e);
        }
    }
    beginGame() {
        this.setStatus(GameStatus.Running);
    }
    // E2E helpers
    getStatus() {
        return GameStatus[this.gameState.status];
    }
    forceGameOver() {
        this.gameState.forceGameOver();
        // Ensure leaderboard fetch is triggered immediately for E2E reliability
        if (!this.leaderboardRequested) {
            this.leaderboardRequested = true;
            this.fetchLeaderboard().finally(() => (this.leaderboardRequested = false));
        }
    }
    buildIntroPath() {
        // Двойной периметр + волновая траектория по горизонтали
        const cellsX = GameConfig.CANVAS_WIDTH / GameConfig.GRID_SIZE;
        const cellsY = GameConfig.CANVAS_HEIGHT / GameConfig.GRID_SIZE;
        const perimeter = (offset) => {
            const p = [];
            const x0 = offset;
            const y0 = offset;
            const x1 = cellsX - 1 - offset;
            const y1 = cellsY - 1 - offset;
            // top
            for (let x = x0; x <= x1; x++)
                p.push({ x, y: y0 });
            // right
            for (let y = y0 + 1; y <= y1; y++)
                p.push({ x: x1, y });
            // bottom
            for (let x = x1 - 1; x >= x0; x--)
                p.push({ x, y: y1 });
            // left
            for (let y = y1 - 1; y > y0; y--)
                p.push({ x: x0, y });
            return p;
        };
        const pathOuter = perimeter(0);
        const pathInner = cellsX > 4 && cellsY > 4 ? perimeter(2) : [];
        // Волновая траектория (синус по Y, движение по X)
        const wave = [];
        const amp = Math.max(1, Math.floor(cellsY / 6));
        const yMid = Math.floor(cellsY / 2);
        for (let x = 0; x < cellsX; x++) {
            const y = yMid + Math.round(Math.sin((x / cellsX) * Math.PI * 2) * amp);
            wave.push({ x, y });
        }
        for (let x = cellsX - 2; x > 0; x--) {
            const y = yMid + Math.round(Math.cos((x / cellsX) * Math.PI * 2) * amp);
            wave.push({ x, y });
        }
        // Объединяем: внешний периметр -> волна -> внутренний периметр -> волна
        this.introPath = [...pathOuter, ...wave, ...pathInner, ...wave];
        this.introIndex = 0;
        this.introTargetLen = Math.max(6, Math.floor((cellsX + cellsY) / 3));
    }
    setStatus(s) {
        if (this.gameState.status !== s) {
            this.gameState.status = s;
            this.emitStatus();
        }
    }
    emitStatus() {
        for (const cb of this.statusListeners)
            cb(this.gameState.status);
    }
    onStatusChange(cb) {
        this.statusListeners.push(cb);
    }
    restart() {
        if (this.gameState.status === GameStatus.Running)
            return;
        this.gameState.reset();
        if (this.gameLoopId === null) {
            this.start();
        }
    }
    ensureShootButton() {
        if (document.getElementById('btn-shoot'))
            return;
        // create floating button near controls
        const btn = document.createElement('button');
        btn.id = 'btn-shoot';
        btn.textContent = '👅';
        btn.style.position = 'fixed';
        btn.style.bottom = '24px';
        btn.style.right = '24px';
        btn.style.width = 'var(--btn-size, 56px)';
        btn.style.height = 'var(--btn-size, 56px)';
        btn.style.fontSize = 'var(--btn-font, 18px)';
        btn.style.borderRadius = '50%';
        btn.style.display = 'none';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        document.body.appendChild(btn);
    }
}
