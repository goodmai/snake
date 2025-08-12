import { Game } from './game/Game';
import { GameStatus } from './game/GameState';
const canvas = document.getElementById('game-canvas');
if (!canvas) {
    throw new Error('Canvas element with id "game-canvas" not found!');
}
// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand?.();
// Optional theme adjustments
if (tg?.themeParams?.bg_color) {
    document.body.style.backgroundColor = tg.themeParams.bg_color;
}
const game = new Game(canvas);
// E2E hook: expose game instance
;
window.__game__ = game;
game.onStatusChange((status) = , e, {
    if(, tg, MainButton) { }, return: ,
    if(status) { }
} === GameStatus.Intro);
{
    tg.MainButton.setText('Start');
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
        // emulate clicking local Start button
        const btn = document.getElementById('btn-restart');
        btn?.click();
    });
}
if (status === GameStatus.Running) {
    tg.MainButton.setText('Restart');
    tg.MainButton.onClick(() => {
        const btn = document.getElementById('btn-restart');
        btn?.click();
    });
    tg.MainButton.show();
}
else if (status === GameStatus.GameOver || status === GameStatus.Stopped) {
    tg.MainButton.setText('Restart');
    tg.MainButton.show();
}
;
game.start();
