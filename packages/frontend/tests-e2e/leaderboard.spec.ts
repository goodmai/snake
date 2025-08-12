import { test, expect } from '@playwright/test';

const FIXTURE = Array.from({ length: 10 }).map((_, i) => {
  // highest first
  const rank = i + 1;
  const score = 110 - i * 10; // 110,100,90,...,20
  const id = 1000 + i;
  return { userId: id, score, name: rank === 1 ? '@alpha' : rank === 2 ? 'Beta Bee' : `user${rank}` };
});

// Helper to collect canvas draw calls
const installCanvasSpy = () => {
  const calls: string[] = [];
  const proto = (window as any).CanvasRenderingContext2D?.prototype;
  if (!proto) return calls;
  const orig = proto.fillText;
  proto.fillText = function(str: string, ...rest: any[]) {
    try { calls.push(String(str)); } catch {}
    return orig.call(this, str, ...rest);
  } as any;
  (window as any).__draw_calls__ = calls;
  return calls;
};

// Provide Telegram WebApp stub to avoid network loading
const installTelegramStub = () => {
  (window as any).Telegram = {
    WebApp: {
      ready: () => {},
      expand: () => {},
      HapticFeedback: { impactOccurred: () => {}, notificationOccurred: () => {} },
      MainButton: { setText: () => {}, onClick: () => {}, show: () => {} },
      themeParams: {},
    },
  };
};

// Force immediate game over for deterministic test
const installForceGameOver = () => {
  (window as any).__E2E_FORCE_GAME_OVER__ = true;
};

test('frontend renders leaderboard after game over using prefilled DB', async ({ page }) => {
  // Intercept leaderboard API
  await page.route('**/api/leaderboard', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FIXTURE) });
  });

  // Inject stubs before any script runs
  await page.addInitScript(installTelegramStub);
  await page.addInitScript(installCanvasSpy);
  await page.addInitScript(installForceGameOver);

  await page.goto('/');

  // Click Start button to enter game and trigger loop
  const startBtn = page.locator('#btn-restart');
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  // Wait for canvas to draw leaderboard lines after game over
  await page.waitForTimeout(500);

  const calls = await page.evaluate(() => (window as any).__draw_calls__ as string[] || []);

  // Basic header
  expect(calls.some(s => /Top players/i.test(s))).toBeTruthy();

  // Expect first two entries present and formatted
  expect(calls.some(s => s.includes('1. @alpha — 110'))).toBeTruthy();
  expect(calls.some(s => s.includes('2. Beta Bee — 100'))).toBeTruthy();

  // Ensure roughly 5 leaderboard rows drawn (UI draws up to 5)
  const rowCount = calls.filter(s => /\d+\.\s/.test(s) && /—/.test(s)).length;
  expect(rowCount).toBeGreaterThanOrEqual(3);
});
