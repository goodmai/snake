import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';
import { GameStatus } from '../game/GameState';
export function App() {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const game = new Game(canvas);
        gameRef.current = game;
        // Telegram MainButton sync
        const tg = window.Telegram?.WebApp;
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
        return () => {
            window.__game__ = undefined;
        };
    }, []);
    return (_jsxs("div", { id: "root", style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [_jsx("audio", { id: "sfx-laser", preload: "auto", children: _jsx("source", { src: "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAZGF0YYQAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA8f8AAPn/AAD9/wAA/f8AAPn/AADx/wAA/f8AAPn/AAD//wAA//8AAP//AAD//wAA", type: "audio/wav" }) }), _jsx("canvas", { id: "game-canvas", ref: canvasRef }), _jsxs("div", { id: "controls", children: [_jsx("button", { id: "btn-up", className: "up", children: "\u25B2" }), _jsx("button", { id: "btn-left", className: "left", children: "\u25C0" }), _jsx("button", { id: "btn-right", className: "right", children: "\u25B6" }), _jsx("button", { id: "btn-down", className: "down", children: "\u25BC" })] }), _jsx("div", { id: "restart", children: _jsx("button", { id: "btn-restart", children: "Start \u25B6" }) })] }));
}
