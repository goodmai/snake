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
  private gameLoopId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.inputHandler = new InputHandler();
    this.gameState = new GameState();
    this.uiManager = new UIManager(this.renderer.getContext());

    this.restart = this.restart.bind(this);
  }

  public start(): void {
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
      this.render();
      this.gameState.status = GameStatus.Stopped;
      return;
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
      // Демо-режим: растим змейку по таймеру
      // Простая анимация: каждые несколько кадров добавляем сегмент без столкновений
      if (Math.random() < 0.3) {
        this.gameState.snake.grow();
      }
      return;
    }

    const nextDirection = this.inputHandler.getDirection();
    this.gameState.snake.changeDirection(nextDirection);
    this.gameState.update();
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
    }
  }

  private beginGame(): void {
    this.gameState.status = GameStatus.Running;
  }

  public restart(): void {
    if (this.gameState.status === GameStatus.Running) return;

    this.gameState.reset();
    if (this.gameLoopId === null) {
      this.start();
    }
  }
}

