import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Config Validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('should throw an error if BOT_TOKEN is missing', async () => {
    // isolate environment
    const originalEnv = { ...process.env };
    process.env = { NODE_ENV: 'test', VITEST: '1', GAME_URL: 'http://test.com' } as any;

    await expect(import('../config/index.js')).rejects.toThrow(
      'Invalid environment variables',
    );

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

