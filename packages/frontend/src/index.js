import { Game } from './game/Game';
import { GameStatus } from './game/GameState';
async function ensureTelegramWebApp() {
    const w = window;
    if (w.Telegram?.WebApp)
        return w.Telegram.WebApp;
    // Dynamically load the script if not present (skipped in E2E where it's mocked)
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://telegram.org/js/telegram-web-app.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Telegram WebApp script'));
        document.head.appendChild(s);
    });
    return window.Telegram?.WebApp;
}
(async () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        throw new Error('Canvas element with id "game-canvas" not found!');
    }
    const tg = await ensureTelegramWebApp();
    tg?.ready();
    tg?.expand?.();
    if (tg?.themeParams?.bg_color) {
        document.body.style.backgroundColor = tg.themeParams.bg_color;
    }
    const game = new Game(canvas);
    // E2E hook: expose game instance
    window.__game__ = game;
    game.onStatusChange((status) => {
        if (!tg?.MainButton)
            return;
        if (status === GameStatus.Intro) {
            tg.MainButton.setText('Start');
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                const btn = document.getElementById('btn-restart');
                btn?.click();
            });
        }
        else if (status === GameStatus.Running) {
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
    });
    game.start();
})();
