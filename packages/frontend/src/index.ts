import { Game } from './game/Game';
import { GameStatus } from './game/GameState';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element with id "game-canvas" not found!');
}

// Initialize Telegram WebApp
const tg: any = (window as any).Telegram?.WebApp;
tg?.ready();
tg?.expand?.();

// Optional theme adjustments
if (tg?.themeParams?.bg_color) {
  document.body.style.backgroundColor = tg.themeParams.bg_color;
}

const game = new Game(canvas);

game.onStatusChange((status) => {
  if (!tg?.MainButton) return;
  if (status === GameStatus.Intro) {
    tg.MainButton.setText('Start');
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      // emulate clicking local Start button
      const btn = document.getElementById('btn-restart') as HTMLButtonElement | null;
      btn?.click();
    });
  } else if (status === GameStatus.Running) {
    tg.MainButton.setText('Restart');
    tg.MainButton.onClick(() => {
      const btn = document.getElementById('btn-restart') as HTMLButtonElement | null;
      btn?.click();
    });
    tg.MainButton.show();
  } else if (status === GameStatus.GameOver || status === GameStatus.Stopped) {
    tg.MainButton.setText('Restart');
    tg.MainButton.show();
  }
});

game.start();

