import { GameConfig } from '../config';
export class Snake {
    body;
    direction;
    constructor() {
        this.body = [];
        const { GRID_SIZE, CANVAS_HEIGHT, SNAKE_INITIAL_LENGTH } = GameConfig;
        const startY = Math.floor(CANVAS_HEIGHT / GRID_SIZE / 2);
        for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
            this.body.unshift({ x: i, y: startY });
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
        this.direction = newDirection;
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
    grow() {
        this.body.push({ ...this.body[this.body.length - 1] });
    }
    checkSelfCollision() {
        const head = this.getHead();
        return this.body
            .slice(1)
            .some((segment) => segment.x === head.x && segment.y === head.y);
    }
}
