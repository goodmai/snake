import { GameConfig } from '../config';
export class Snake {
    body;
    direction;
    turnGlowFrames = 0;
    constructor() {
        this.body = [];
        const { GRID_SIZE, CANVAS_HEIGHT, SNAKE_INITIAL_LENGTH, COLORS } = GameConfig;
        const startY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
        // По требованиям: размер змеи 4, узор G-Y-G-Y (зелёный-жёлтый)
        const baseColors = [COLORS.RAINBOW.GREEN, COLORS.RAINBOW.YELLOW, COLORS.RAINBOW.GREEN, COLORS.RAINBOW.YELLOW];
        const initLen = Math.max(4, SNAKE_INITIAL_LENGTH);
        for (let i = 0; i < initLen; i++) {
            const color = baseColors[i % baseColors.length];
            this.body.unshift({ x: i, y: startY, color });
        }
        this.direction = 'RIGHT';
    }
    getHead() {
        return this.body[0];
    }
    getBody() {
        return this.body;
    }
    changeDirection(newDirection) {
        const opposite = (a, b) => (a === 'UP' && b === 'DOWN') || (a === 'DOWN' && b === 'UP') ||
            (a === 'LEFT' && b === 'RIGHT') || (a === 'RIGHT' && b === 'LEFT');
        if (newDirection === this.direction)
            return;
        if (opposite(newDirection, this.direction))
            return;
        this.direction = newDirection;
        this.turnGlowFrames = 6; // brief glow effect on turns
    }
    move() {
        const head = { ...this.getHead() };
        switch (this.direction) {
            case 'UP':
                head.y--;
                break;
            case 'DOWN':
                head.y++;
                break;
            case 'LEFT':
                head.x--;
                break;
            case 'RIGHT':
                head.x++;
                break;
        }
        this.body.unshift(head);
        this.body.pop();
    }
    tickEffects() {
        if (this.turnGlowFrames > 0)
            this.turnGlowFrames--;
    }
    hasTurnGlow() {
        return this.turnGlowFrames > 0;
    }
    grow(color) {
        const tail = { ...this.body[this.body.length - 1] };
        if (color)
            tail.color = color;
        this.body.push(tail);
    }
    checkSelfCollision() {
        const head = this.getHead();
        return this.body
            .slice(1)
            .some((segment) => segment.x === head.x && segment.y === head.y);
    }
}
