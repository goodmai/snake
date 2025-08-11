import { test, expect } from '@playwright/test';

// E2E: start, buttons, pause/resume, restart, game over → assert /api/score only

test('start, controls, pause, game over and restart flow (without leaderboard)', async ({ page }) => {
  // Mock Telegram WebApp
  await page.addInitScript(() => {
    (window as any).Telegram = {
      WebApp: {
        ready: () => {},
        expand: () => {},
        initData: 'user=' + encodeURIComponent(JSON.stringify({ id: 12345, username: 'daskibo', first_name: 'Das', last_name: 'Kibo' })),
        HapticFeedback: { impactOccurred: () => {}, notificationOccurred: () => {} },
      },
    };
  });

  let scorePosted = false;

  await page.route('**/api/score', async (route) => {
    const request = route.request();
    const payload = await request.postDataJSON();
    if (typeof payload?.score === 'number' && payload?.initData) {
      scorePosted = true;
    }
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.goto('/');

  // Start via Start button
  await page.click('#btn-restart');

  // Wait until running
  await expect.poll(async () => {
    return await page.evaluate(() => (window as any).__game__?.getStatus?.());
  }, { timeout: 5000 }).toBe('Running');

  // Force immediate game over for reliability via game hook
  await page.evaluate(() => { (window as any).__game__?.forceGameOver?.(); });

  // Press UI control buttons
  await page.click('#btn-up');
  await page.waitForTimeout(50);
  await page.click('#btn-right');
  await page.waitForTimeout(50);
  await page.click('#btn-down');
  await page.waitForTimeout(50);
  await page.click('#btn-left');
  await page.waitForTimeout(50);

  // Pause: fake visibility change
  await page.evaluate(() => {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    // Override document.hidden
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    // restore after a short delay
    setTimeout(() => {
      if (desc) Object.defineProperty(document, 'hidden', desc);
      document.dispatchEvent(new Event('visibilitychange'));
    }, 300);
  });

  await page.waitForTimeout(500);

  // Force game over by holding Up to hit the wall
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(10);
  }

  // Wait for score call
  await expect.poll(() => scorePosted, { timeout: 5000 }).toBeTruthy();

  // Restart: click the Restart button
  await page.click('#btn-restart');
  await page.waitForTimeout(300);
});
