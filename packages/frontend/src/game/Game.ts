import { GameConfig } from '../config';
import { InputHandler } from '../core/InputHandler';
import { Renderer } from '../core/Renderer';
import { GameState, GameStatus } from './GameState';
import { UIManager } from '../ui/UIManager';

export class Game {
  private readonly renderer: Renderer;
  private readonly inputHandler: InputHandler;
  private readonly gameState: GameState;
  private readonly uiManager: UIManager;
  private lastFrameTime: number = 0;
  private lastLeaderboard: { name: string; score: number }[] | null = null;
  private leaderboardRequested = false;
  private gameLoopId: number | null = null;
  private e2eForceHandled = false;
  private statusListeners: Array<(s: GameStatus)=>void> = [];

  private introPath: { x: number; y: number }[] = [];
  private introIndex = 0;
  private introTargetLen = 8;

  constructor(canvas: HTMLCanvasElement) {
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

  public start(): void {
    // Handle DPR and resize
    this.renderer.setupDPR();
    window.addEventListener('resize', () => this.renderer.setupDPR());
    const controls = {
      up: document.getElementById('btn-up'),
      down: document.getElementById('btn-down'),
      left: document.getElementById('btn-left'),
      right: document.getElementById('btn-right'),
    };
    this.inputHandler.init(this.renderer.getCanvas(), controls);

    // Кнопка сначала как Start, затем как Restart
    const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement | null;
    if (btnRestart) {
      btnRestart.textContent = this.gameState.status === GameStatus.Intro ? 'Start ▶' : 'Restart ⟲';
      btnRestart.onclick = () => {
        if (this.gameState.status === GameStatus.Intro) {
      this.beginGame();
      btnRestart.textContent = 'Restart ⟲';
      this.emitStatus();
        } else {
          this.restart();
        }
      };
    }

    this.gameLoopId = requestAnimationFrame(this.loop.bind(this));
  }

  private loop(currentTime: number): void {
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
    } else if (!document.hidden && this.gameState.status === GameStatus.Paused) {
      this.setStatus(GameStatus.Running);
    }
    
    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime >= GameConfig.GAME_SPEED_MS) {
      this.lastFrameTime = currentTime;
      this.update();
    }

    this.render();
  }

  private update(): void {
    if (this.gameState.status === GameStatus.Intro) {
      // Детерминированная петля по периметру, плавный рост до introTargetLen
      const body = this.gameState.snake.getBody();
      const next = this.introPath[this.introIndex];
      body.unshift({ x: next.x, y: next.y });
      if (body.length > this.introTargetLen) body.pop();
      this.introIndex = (this.introIndex + 1) % this.introPath.length;
      return;
    }

    if (this.gameState.status === GameStatus.Paused) {
      return;
    }

    // E2E hook: allow forcing immediate game over via global flag
    const force = (window as any).__E2E_FORCE_GAME_OVER__;
    if (force && !this.e2eForceHandled) {
      this.e2eForceHandled = true;
      this.gameState.forceGameOver();
    }

    const prevScore = this.gameState.score;
    const nextDirection = this.inputHandler.getDirection();
    this.gameState.snake.changeDirection(nextDirection);
    this.gameState.update();

    const tg: any = (window as any).Telegram?.WebApp;
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

  private render(): void {
    this.renderer.clear();
    this.renderer.drawGrid();

    if (this.gameState.status !== GameStatus.Intro) {
      this.renderer.drawFood(this.gameState.food);
      this.renderer.drawSnake(this.gameState.snake);
      this.uiManager.drawScore(this.gameState.score);
    } else {
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

  private async fetchLeaderboard(): Promise<void> {
    try {
      const resp = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!resp.ok) return;
      const data: { userId: number; score: number; name: string }[] = await resp.json();
      this.lastLeaderboard = data.map(d => ({ name: d.name, score: d.score }));
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    }
  }

  private beginGame(): void {
    this.setStatus(GameStatus.Running);
  }

  // E2E helpers
  public getStatus(): string {
    return GameStatus[this.gameState.status];
  }

  public forceGameOver(): void {
    this.gameState.forceGameOver();
    // Ensure leaderboard fetch is triggered immediately for E2E reliability
    if (!this.leaderboardRequested) {
      this.leaderboardRequested = true;
      this.fetchLeaderboard().finally(() => (this.leaderboardRequested = false));
    }
  }

  private buildIntroPath(): void {
    // Двойной периметр + волновая траектория по горизонтали
    const cellsX = GameConfig.CANVAS_WIDTH / GameConfig.GRID_SIZE;
    const cellsY = GameConfig.CANVAS_HEIGHT / GameConfig.GRID_SIZE;
    const perimeter = (offset: number) => {
      const p: { x: number; y: number }[] = [];
      const x0 = offset;
      const y0 = offset;
      const x1 = cellsX - 1 - offset;
      const y1 = cellsY - 1 - offset;
      // top
      for (let x = x0; x <= x1; x++) p.push({ x, y: y0 });
      // right
      for (let y = y0 + 1; y <= y1; y++) p.push({ x: x1, y });
      // bottom
      for (let x = x1 - 1; x >= x0; x--) p.push({ x, y: y1 });
      // left
      for (let y = y1 - 1; y > y0; y--) p.push({ x: x0, y });
      return p;
    };

    const pathOuter = perimeter(0);
    const pathInner = cellsX > 4 && cellsY > 4 ? perimeter(2) : [];

    // Волновая траектория (синус по Y, движение по X)
    const wave: { x: number; y: number }[] = [];
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

  private setStatus(s: GameStatus): void {
    if (this.gameState.status !== s) {
      this.gameState.status = s;
      this.emitStatus();
    }
  }

  private emitStatus(): void {
    for (const cb of this.statusListeners) cb(this.gameState.status);
  }

  public onStatusChange(cb: (s: GameStatus)=>void): void {
    this.statusListeners.push(cb);
  }

  public restart(): void {
    if (this.gameState.status === GameStatus.Running) return;

    this.gameState.reset();
    if (this.gameLoopId === null) {
      this.start();
    }
  }
}

