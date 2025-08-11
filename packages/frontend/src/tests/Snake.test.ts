import { describe, it, expect, beforeEach } from 'vitest';
import { Snake } from '../entities/Snake';
import { GameConfig } from '../config';

describe('Snake Logic', () => {
  let snake: Snake;

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

