import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Config Validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('does not throw in test when BOT_TOKEN is missing', async () => {
    const originalEnv = { ...process.env };
    process.env = { NODE_ENV: 'test', VITEST: '1', GAME_URL: 'http://test.com' } as any;

    const mod = await import('../config/index.js');
    expect(mod.config.GAME_URL).toBe('http://test.com');

    process.env = originalEnv as any;
  });

  it('should pass if all required variables are present', async () => {
    vi.stubGlobal('process', {
      ...process,
      env: {
        BOT_TOKEN: 'fake-token',
        GAME_URL: 'http://test.com',
      },
    });

    const { config } = await import('../config/index.js');
    expect(config.BOT_TOKEN).toBe('fake-token');
  });
});

