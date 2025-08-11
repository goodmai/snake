import { test, expect } from '@playwright/test';

// E2E: load WebApp, start game, trigger game over, assert /api/score and /api/leaderboard are called

test('game over posts score and fetches leaderboard', async ({ page }) => {
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
  let leaderboardFetched = false;

  await page.route('**/api/score', async (route) => {
    const request = route.request();
    const payload = await request.postDataJSON();
    if (typeof payload?.score === 'number' && payload?.initData) {
      scorePosted = true;
    }
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.route('**/api/leaderboard', async (route) => {
    leaderboardFetched = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { userId: 12345, name: 'daskibo', score: 4 },
      { userId: 2, name: 'user2', score: 3 },
    ]) });
  });

  await page.goto('/');

  // Start game by clicking Start button
  await page.click('#btn-restart');

  // Cause a quick game over: send many ArrowUp presses to hit the wall
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(20);
  }

  // Wait a bit for score/leaderboard calls
  await page.waitForTimeout(1500);

  expect(scorePosted).toBeTruthy();
  expect(leaderboardFetched).toBeTruthy();
});
