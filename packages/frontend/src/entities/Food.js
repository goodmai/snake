import { GameConfig } from '../config';
import { pickRandomDistinct } from '../utils/random';
export class Food {
    position;
    color;
    blinkOn = true; // for ORANGE
    blinkTick = 0; // slow down orange blink
    blueDir = 1; // for BLUE horizontal movement
    blueTick = 0; // throttle BLUE movement speed
    constructor(snakeBody) {
        this.position = { x: 0, y: 0 };
        this.color = 'RED';
        this.respawn(snakeBody);
    }
    respawn(snakeBody) {
        // client-side debug log
        try {
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'foodRespawn', payload: { prevColor: this.color, pos: this.position } }),
            });
        }
        catch { }
        const { GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } = GameConfig;
        const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
        const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
        const rainbow = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'VIOLET'];
        do {
            this.position = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY),
            };
        } while (snakeBody.some((segment) => segment.x === this.position.x && segment.y === this.position.y));
        // pick a random color, avoid repeating the previous to make changes obvious
        const prev = this.color;
        this.color = pickRandomDistinct(rainbow, prev);
        this.blinkOn = true;
        this.blueDir = Math.random() < 0.5 ? -1 : 1;
        // assign visible color for renderer convenience
        this.position.color = COLORS.RAINBOW[this.color];
    }
    tickMove(snakeBody) {
        // BLUE moves slowly horizontal left-right within bounds and avoiding snake
        if (this.color !== 'BLUE')
            return;
        const { GRID_SIZE, CANVAS_WIDTH } = GameConfig;
        const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
        const nextX = this.position.x + this.blueDir;
        // Throttle movement: move only every 3rd tick
        this.blueTick = (this.blueTick + 1) % 3;
        if (this.blueTick !== 0) {
            // still toggle blink to keep subtle animation
            this.blinkOn = !this.blinkOn;
            return;
        }
        if (nextX < 0 || nextX >= maxX || snakeBody.some(s => s.x === nextX && s.y === this.position.y)) {
            this.blueDir = (this.blueDir === 1 ? -1 : 1);
            return;
        }
        this.position.x = nextX;
        // soft blink toggle for some motion feel
        this.blinkOn = !this.blinkOn;
    }
    isVisibleThisFrame() {
        // ORANGE blinks 10x slower than before
        if (this.color === 'ORANGE') {
            this.blinkTick = (this.blinkTick + 1) % 10;
            if (this.blinkTick === 0) {
                this.blinkOn = !this.blinkOn;
            }
            return this.blinkOn;
        }
        return true;
    }
    currentHexColor() {
        const c = GameConfig.COLORS.RAINBOW[this.color];
        return typeof c === 'string' ? c : '#ffffff';
    }
}
