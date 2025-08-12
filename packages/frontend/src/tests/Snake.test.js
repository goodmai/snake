import { describe, it, expect } from 'vitest';
import { GameState } from '../game/GameState';
import { GameConfig } from '../config';
describe('Rainbow features', () => {
    it('applies speed changes for red and green', () => {
        const gs = new GameState();
        // mock DOM for shoot button
        const btn = document.createElement('button');
        btn.id = 'btn-shoot';
        document.body.appendChild(btn);
        const base = GameConfig.GAME_SPEED_MS;
        // force food color and eat by placing on head and updating
        gs.food.color = 'RED';
        const head1 = gs.snake.getHead();
        gs.food.position = { x: head1.x + 1, y: head1.y };
        gs.update();
        expect(gs.getCurrentSpeedMs()).toBeLessThan(base);
        gs.food.color = 'GREEN';
        const head2 = gs.snake.getHead();
        gs.food.position = { x: head2.x + 1, y: head2.y };
        gs.update();
        expect(gs.getCurrentSpeedMs()).toBeGreaterThanOrEqual(Math.round(base * 0.95));
    });
    it('blue food moves horizontally over ticks', () => {
        const gs = new GameState();
        gs.food.color = 'BLUE';
        const startX = gs.food.position.x;
        // tick several times
        for (let i = 0; i < 6; i++) {
            gs.food.tickMove(gs.snake.getBody());
        }
        expect(gs.food.position.x).not.toBe(startX);
    });
    it('yellow grants shooting and violet removes it', () => {
        const gs = new GameState();
        const btn = document.createElement('button');
        btn.id = 'btn-shoot';
        document.body.appendChild(btn);
        gs.food.color = 'YELLOW';
        const head3 = gs.snake.getHead();
        gs.food.position = { x: head3.x + 1, y: head3.y };
        gs.update();
        expect(gs.canShoot).toBe(true);
        gs.food.color = 'VIOLET';
        const head4 = gs.snake.getHead();
        gs.food.position = { x: head4.x + 1, y: head4.y };
        gs.update();
        expect(gs.canShoot).toBe(false);
    });
    it('shooting consumes target ahead', () => {
        const gs = new GameState();
        const btn = document.createElement('button');
        btn.id = 'btn-shoot';
        document.body.appendChild(btn);
        gs.canShoot = true;
        const head = gs.snake.getHead();
        // place food ahead to the right in same row
        gs.food.position.x = head.x + 3;
        gs.food.position.y = head.y;
        const oldScore = gs.score;
        const hit = gs.shoot();
        expect(hit).toBe(true);
        expect(gs.score).toBe(oldScore + 1);
    });
    it('snake tail segment gets eaten food color', () => {
        const gs = new GameState();
        // Make sure shoot button exists for any UI updates
        const btn = document.createElement('button');
        btn.id = 'btn-shoot';
        document.body.appendChild(btn);
        // Force a known color on food and eat it by placing in next cell
        gs.food.color = 'BLUE';
        // prevent blue from moving away during update tick
        gs.food.tickMove = () => { };
        const head = gs.snake.getHead();
        gs.food.position = { x: head.x + 1, y: head.y };
        const beforeLen = gs.snake.getBody().length;
        gs.update();
        const body = gs.snake.getBody();
        expect(body.length).toBe(beforeLen + 1);
        const tail = body[body.length - 1];
        // BLUE color hex
        expect(tail.color).toBe('#0074d9');
    });
    it('food color randomizes across respawns', () => {
        const gs = new GameState();
        const seen = new Set();
        for (let i = 0; i < 20; i++) {
            gs.food.respawn(gs.snake.getBody());
            seen.add(gs.food.color);
        }
        // Expect to have seen multiple rainbow colors
        expect(seen.size).toBeGreaterThan(2);
    });
});
import { beforeEach } from 'vitest';
import { Snake } from '../entities/Snake';
describe('Snake Logic', () => {
    let snake;
    beforeEach(() => {
        snake = new Snake();
    });
    it('should initialize with correct length and position', () => {
        expect(snake.getBody().length).toBe(GameConfig.SNAKE_INITIAL_LENGTH);
        expect(snake.getHead().x).toBe(GameConfig.SNAKE_INITIAL_LENGTH - 1);
    });
    it('should move right correctly', () => {
        const initialHeadX = snake.getHead().x;
        snake.move();
        const newHead = snake.getHead();
        expect(newHead.x).toBe(initialHeadX + 1);
    });
    it('should change direction and move up', () => {
        const initialHead = snake.getHead();
        snake.changeDirection('UP');
        snake.move();
        const newHead = snake.getHead();
        expect(newHead.y).toBe(initialHead.y - 1);
        expect(newHead.x).toBe(initialHead.x);
    });
    it('should grow by one segment', () => {
        const initialLength = snake.getBody().length;
        snake.grow();
        expect(snake.getBody().length).toBe(initialLength + 1);
    });
    it('should detect self-collision', () => {
        const body = snake.getBody();
        // Manually create a collision scenario
        body[0] = { x: 5, y: 10 }; // head
        body[1] = { x: 4, y: 10 };
        body.push({ x: 5, y: 9 });
        body.push({ x: 5, y: 10 }); // This segment collides with the head
        expect(snake.checkSelfCollision()).toBe(true);
    });
    it('should not detect self-collision when moving', () => {
        expect(snake.checkSelfCollision()).toBe(false);
        snake.move();
        expect(snake.checkSelfCollision()).toBe(false);
    });
});
