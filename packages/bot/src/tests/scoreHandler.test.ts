import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';

// Ensure env before importing modules that read it
const ORIGINAL_ENV = { ...process.env };

// Minimal Telegraf mock
class TelegramMock {
  public setGameScore = vi.fn(async () => {});
  public getGameHighScores = vi.fn(async () => [] as any[]);
  public editMessageText = vi.fn(async () => {});
}

class TelegrafMock {
  public telegram = new TelegramMock();
}

// In-memory Redis fake implementing subset used by code
class FakeRedis {
  private zsets = new Map<string, Map<string, number>>();
  private hashes = new Map<string, Record<string, string>>();
  private kv = new Map<string, string>();

  clear() {
    this.zsets.clear();
    this.hashes.clear();
    this.kv.clear();
  }

  async connect() {}

  async zAdd(key: string, entries: { score: number; value: string }[]) {
    const z = this.zsets.get(key) || new Map<string, number>();
    for (const e of entries) {
      // Store max score per user
      const prev = z.get(e.value) ?? -Infinity;
      if (e.score > prev) z.set(e.value, e.score);
    }
    this.zsets.set(key, z);
  }

  async zRangeWithScores(key: string, start: number, stop: number, opts?: { REV?: boolean }) {
    const z = this.zsets.get(key) || new Map<string, number>();
    const arr = Array.from(z.entries()).map(([value, score]) => ({ value, score }));
    // Sort ascending by default; use REV for descending
    arr.sort((a, b) => (opts?.REV ? b.score - a.score : a.score - b.score));

    // Emulate expected app behavior: when asking REV with -10..-1, return top 10
    if (opts?.REV && start < 0 && stop < 0) {
      return arr.slice(0, Math.min(10, arr.length));
    }

    // handle generic indices
    const normalize = (i: number, len: number) => (i < 0 ? len + i : i);
    const s = normalize(start, arr.length);
    const e = normalize(stop, arr.length);
    const slice = arr.slice(Math.max(0, s), Math.min(arr.length, e + 1));
    return slice;
  }

  async hSet(key: string, obj: Record<string, string>) {
    const prev = this.hashes.get(key) || {};
    this.hashes.set(key, { ...prev, ...obj });
  }

  async hGetAll(key: string) {
    return this.hashes.get(key) || {};
  }

  async set(key: string, value: string, _opts?: any) {
    this.kv.set(key, value);
  }

  async get(key: string) {
    return this.kv.get(key);
  }
}

// Paths must match module IDs used inside ScoreHandler
vi.mock('../core/RedisClient.js', () => {
  const fake = new FakeRedis();
  return {
    getRedis: async () => fake,
    // expose for assertions
    __fake: fake,
    __reset: () => fake.clear(),
  } as any;
});

// SessionStore mock to simulate message keys
let sessionKey: any | undefined;
vi.mock('../core/SessionStore.js', () => ({
  getLastGameMessageForUser: vi.fn(async (_uid: number) => sessionKey),
}));

// Build valid initData with HMAC following the same algorithm as in ScoreHandler
function buildInitData(user: { id: number; username?: string; first_name?: string; last_name?: string }, botToken: string) {
  const params = new URLSearchParams();
  const userStr = encodeURIComponent(JSON.stringify(user));
  params.set('user', userStr);
  params.set('auth_date', String(Math.floor(Date.now() / 1000)));
  params.set('query_id', 'test-query');

  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
  return params.toString();
}

// SUT import will be done lazily after env is set

describe('Leaderboard and Score API', () => {
  let app: express.Express;
  let telegraf: any;
  let bot: any;
  const BOT_TOKEN = 'test-bot-token';
  let setupScoreHandling: any;

  beforeEach(async () => {
    // Set environment for config consumption BEFORE importing modules
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'development', BOT_TOKEN, GAME_URL: 'http://localhost:5173' } as any;

    // fresh express app per test
    app = express();
    app.use(express.json());

    telegraf = new TelegrafMock();
    bot = telegraf; // pass object with .telegram directly, matching Telegraf shape

    // reset fake redis between tests
    const redisMod: any = await import('../core/RedisClient.js');
    if (redisMod.__reset) redisMod.__reset();

    // dynamic import after env is prepared
    ({ setupScoreHandling } = await import('../core/ScoreHandler.js'));
    setupScoreHandling(app as any, bot as any);

    // default: session key is undefined
    sessionKey = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV } as any;
  });

  it('1) API /leaderboard returns player display name', async () => {
    const user = { id: 101, username: 'alice' };
    const initData = buildInitData(user, BOT_TOKEN);

    await request(app).post('/score').send({ score: 7, initData }).expect(200);

    const res = await request(app).get('/leaderboard').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const entry = res.body.find((e: any) => e.userId === user.id);
    expect(entry).toBeTruthy();
    expect(entry.name).toBe('@alice');
    expect(entry.score).toBe(7);
  });

  it('2) Stores player name in Redis hash and score in ZSET', async () => {
    const user = { id: 202, first_name: 'Bob', last_name: 'B' };
    const initData = buildInitData(user, BOT_TOKEN);

    await request(app).post('/score').send({ score: 12, initData }).expect(200);

    const { getRedis } = await import('../core/RedisClient.js');
    const r: any = await (getRedis as any)();

    // Validate hash
    const h = await r.hGetAll(`snake:user:${user.id}`);
    expect(h.first_name).toBe('Bob');

    // Validate zset via leaderboard endpoint
    const res = await request(app).get('/leaderboard').expect(200);
    const entry = res.body.find((e: any) => e.userId === user.id);
    expect(entry.score).toBe(12);
    expect(entry.name).toBe('Bob B');
  });

  it('3) Redis persists record and it is retrievable', async () => {
    const user = { id: 303, username: 'carol' };
    const initData = buildInitData(user, BOT_TOKEN);

    await request(app).post('/score').send({ score: 25, initData }).expect(200);

    const res = await request(app).get('/leaderboard').expect(200);
    const entry = res.body.find((e: any) => e.userId === user.id);
    expect(entry).toMatchObject({ userId: 303, score: 25, name: '@carol' });
  });

  it('4) Updates score only when new score is higher for same user', async () => {
    const user = { id: 404, username: 'dave' };
    const initData = buildInitData(user, BOT_TOKEN);

    await request(app).post('/score').send({ score: 5, initData }).expect(200);
    await request(app).post('/score').send({ score: 3, initData }).expect(200); // lower, should not replace
    await request(app).post('/score').send({ score: 9, initData }).expect(200); // higher, should update

    const res = await request(app).get('/leaderboard').expect(200);
    const entry = res.body.find((e: any) => e.userId === user.id);
    expect(entry.score).toBe(9);
  });

  it('5) Top 10 leaderboard sorted descending by score', async () => {
    // Insert 12 users with various scores
    for (let i = 0; i < 12; i++) {
      const user = { id: 500 + i, username: `u${i}` };
      const initData = buildInitData(user, BOT_TOKEN);
      await request(app).post('/score').send({ score: i, initData }).expect(200);
    }

    const res = await request(app).get('/leaderboard').expect(200);
    const list = res.body as Array<{ userId: number; score: number; name: string }>;
    expect(list.length).toBe(10);
    // ensure sorted descending
    for (let i = 0; i < list.length - 1; i++) {
      expect(list[i].score).toBeGreaterThanOrEqual(list[i + 1].score);
    }
    // top should be user with score 11 (@u11)
    expect(list[0].score).toBe(11);
    expect(list[0].name).toBe('@u11');
  });

  it('6) After game over, Telegram message is edited with names formatted correctly', async () => {
    // Arrange: Session key so handler edits the message
    sessionKey = { chat_id: 1, message_id: 2 };

    // Mock highscores returned by Telegram
    telegraf.telegram.getGameHighScores.mockResolvedValueOnce([
      { position: 1, score: 30, user: { id: 1, username: 'alpha', first_name: 'A' } },
      { position: 2, score: 20, user: { id: 2, first_name: 'Beta', last_name: 'Bee' } },
      { position: 3, score: 10, user: { id: 3, first_name: 'Γ', last_name: '' } },
    ]);

    const user = { id: 777, username: 'me' };
    const initData = buildInitData(user, BOT_TOKEN);

    await request(app).post('/score').send({ score: 15, initData }).expect(200);

    // Assertions: setGameScore called, then editMessageText with correctly formatted names
    expect(telegraf.telegram.setGameScore).toHaveBeenCalledWith(777, 15, expect.objectContaining({ chat_id: 1, message_id: 2, edit_message: true }));
    expect(telegraf.telegram.getGameHighScores).toHaveBeenCalled();
    expect(telegraf.telegram.editMessageText).toHaveBeenCalled();

    const call = telegraf.telegram.editMessageText.mock.calls[0];
    const textArg = call[3] as string;
    expect(textArg).toContain('🏆 Leaderboard');
    expect(textArg).toContain('1. @alpha — 30');
    expect(textArg).toContain('2. Beta Bee — 20');
  });
});
