import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element with id "game-canvas" not found!');
}

// Initialize Telegram WebApp
(window as any).Telegram?.WebApp?.ready();

const game = new Game(canvas);
game.start();

