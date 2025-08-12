import { Direction } from '../config';

export class InputHandler {
  private currentDirection: Direction = 'RIGHT';
  private lastInputDirection: Direction = 'RIGHT';
  private touchStartX: number | null = null;
  private touchStartY: number | null = null;
  private readonly swipeThreshold = 24; // px
  private inverted = false;

  public init(canvas?: HTMLCanvasElement, controls?: {
    up?: HTMLElement | null;
    down?: HTMLElement | null;
    left?: HTMLElement | null;
    right?: HTMLElement | null;
  }): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    if (canvas) {
      // Обработка тапа по canvas для мобильных устройств
      canvas.addEventListener(
        'touchstart',
        this.handleTouchStart.bind(this, canvas),
        { passive: false },
      );
      canvas.addEventListener(
        'touchmove',
        this.handleTouchMove.bind(this),
        { passive: false },
      );
      canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    if (controls) {
      controls.up?.addEventListener('click', () => this.setDirection('UP'));
      controls.down?.addEventListener('click', () => this.setDirection('DOWN'));
      controls.left?.addEventListener('click', () => this.setDirection('LEFT'));
      controls.right?.addEventListener('click', () => this.setDirection('RIGHT'));
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    let newDirection: Direction | null = null;
    const key = event.key;
    const map = this.inverted
      ? { ArrowUp: 'DOWN', ArrowDown: 'UP', ArrowLeft: 'RIGHT', ArrowRight: 'LEFT' } as const
      : { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' } as const;
    const candidate = (map as any)[key] as Direction | undefined;
    if (candidate) {
      if (
        !(
          (candidate === 'UP' && this.currentDirection === 'DOWN') ||
          (candidate === 'DOWN' && this.currentDirection === 'UP') ||
          (candidate === 'LEFT' && this.currentDirection === 'RIGHT') ||
          (candidate === 'RIGHT' && this.currentDirection === 'LEFT')
        )
      ) {
        newDirection = candidate;
      }
    }
    if (newDirection) {
      this.lastInputDirection = newDirection;
      try { (this as any).onDirection?.(newDirection); } catch {}
    }
  }

  private handleTouchStart(canvas: HTMLCanvasElement, event: TouchEvent): void {
    // Предотвращаем зум/скролл на тап
    event.preventDefault();
    if (event.touches.length === 0) return;

    const touch = event.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Вычисляем смещение от центра, чтобы понять основное направление тапа
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    let newDirection: Direction | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Горизонтальный приоритет
      if (dx < 0 && this.currentDirection !== 'RIGHT') newDirection = 'LEFT';
      if (dx > 0 && this.currentDirection !== 'LEFT') newDirection = 'RIGHT';
    } else {
      // Вертикальный приоритет
      if (dy < 0 && this.currentDirection !== 'DOWN') newDirection = 'UP';
      if (dy > 0 && this.currentDirection !== 'UP') newDirection = 'DOWN';
    }

    if (newDirection) {
      this.lastInputDirection = newDirection;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.touchStartX === null || this.touchStartY === null) return;
    event.preventDefault();
    const touch = event.touches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    if (Math.abs(dx) < this.swipeThreshold && Math.abs(dy) < this.swipeThreshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) this.setDirection('LEFT');
      else this.setDirection('RIGHT');
    } else {
      if (dy < 0) this.setDirection('UP');
      else this.setDirection('DOWN');
    }

    // reset to avoid multiple triggers
    this.touchStartX = null;
    this.touchStartY = null;
  }

  private handleTouchEnd(): void {
    this.touchStartX = null;
    this.touchStartY = null;
  }

  public setInverted(v: boolean): void { this.inverted = v; }

  private setDirection(dir: Direction): void {
    // запрещаем разворот на 180°
    if (
      (dir === 'UP' && this.currentDirection === 'DOWN') ||
      (dir === 'DOWN' && this.currentDirection === 'UP') ||
      (dir === 'LEFT' && this.currentDirection === 'RIGHT') ||
      (dir === 'RIGHT' && this.currentDirection === 'LEFT')
    ) {
      return;
    }
    this.lastInputDirection = dir;
  }

  public getDirection(): Direction {
    this.currentDirection = this.lastInputDirection;
    return this.currentDirection;
  }
}

