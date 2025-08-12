import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Reuse FakeRedis from scoreHandler test by mocking module
const hoisted = vi.hoisted(() => {
  class FakeRedis {
    private lists = new Map<string, string[]>();
    private hashes = new Map<string, Record<string, string>>();
    private kv = new Map<string, string>();
    async rPush(key: string, v: string) { const arr = this.lists.get(key) || []; arr.push(v); this.lists.set(key, arr); }
    async lRange(key: string, s: number, e: number) { const arr = this.lists.get(key) || []; return arr.slice(s, e >= 0 ? e + 1 : undefined); }
    async hSet(key: string, obj: Record<string, string>) { const prev = this.hashes.get(key) || {}; this.hashes.set(key, { ...prev, ...obj }); }
    async hGetAll(key: string) { return this.hashes.get(key) || {}; }
    async append(key: string, v: string) { const cur = this.kv.get(key) || ''; this.kv.set(key, cur + v); }
    async get(key: string) { return this.kv.get(key) || ''; }
  }
  const fake = new FakeRedis();
  return { fake };
});

vi.mock('../core/RedisClient.js', () => {
  return { getRedis: async () => hoisted.fake, __fake: hoisted.fake } as any;
});

import { setupScoreHandling } from '../core/ScoreHandler.js';

describe('Session logging API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    setupScoreHandling(app as any, { telegram: {} } as any);
  });

  it('starts, logs events, and finishes a session with seq aggregated', async () => {
    const start = await request(app).post('/session/start').set('x-dev-user','12345').send({ initData: 'x=1' }).expect(200);
    const { sessionId } = start.body;
    expect(sessionId).toBeTruthy();

    await request(app).post('/session/event').send({ sessionId, type: 'key', payload: { dir: 'UP' } }).expect(204);
    await request(app).post('/session/event').send({ sessionId, type: 'key', payload: { dir: 'LEFT' } }).expect(204);
    await request(app).post('/session/event').send({ sessionId, type: 'shoot', payload: {} }).expect(204);

    const fin = await request(app).post('/session/finish').send({ sessionId, score: 10, durationMs: 1234 }).expect(200);
    expect(fin.body.ok).toBe(true);
  });

  it('accepts /health and /log', async () => {
    // health is provided by a separate express instance in runtime, here we only test /log
    await request(app).post('/log').send({ event: 'test', payload: { ok: true } }).expect(204);
  });
});
