import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('gp-booted', '1');
    sessionStorage.removeItem('gp-visited-nodes');
  });
  await page.goto('/');
  await expect(page.locator('#world-map-timeline')).toBeVisible({ timeout: 10_000 });
  // Wait for worldMap.ts to mount and apply hidden classes
  await page.waitForFunction(
    () => document.querySelector('.wm-card[data-job-index="1"]')?.classList.contains('wm-card--hidden'),
    { timeout: 10_000 }
  );
});

test.describe('WorldMap progressive disclosure', () => {
  test('card 0 (NOW PLAYING) is always visible on fresh session', async ({ page }) => {
    const card0 = page.locator('.wm-card[data-job-index="0"]');
    await expect(card0).not.toHaveClass(/wm-card--hidden/);
    await expect(card0.locator('.wm-card__content')).toBeVisible();
  });

  test('cards 1-4 show encrypted content on fresh session', async ({ page }) => {
    for (let i = 1; i <= 4; i++) {
      const cipher = page.locator(`.wm-card[data-job-index="${i}"] .wm-card__cipher`);
      await expect(cipher).toBeVisible();
      await expect(cipher).toContainText('??? ENCRYPTED');
    }
  });

  test('opening dialog for node 1 reveals card 1', async ({ page }) => {
    await page.locator('.wm-node[data-job-index="1"]').click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await page.locator('.wm-dialog__btn--close').click();
    const card1 = page.locator('.wm-card[data-job-index="1"]');
    await expect(card1).not.toHaveClass(/wm-card--hidden/);
    await expect(card1.locator('.wm-card__content')).toBeVisible();
  });

  test('card 1 starts revealed when gp-visited-nodes=[1] in sessionStorage', async ({ browser }) => {
    // addInitScript re-runs on reload so simulate persistence via a fresh context
    // that pre-seeds the visited state — this is what "persisted" means
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        sessionStorage.setItem('gp-booted', '1');
        sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1]));
      });
      await page.goto('/');
      await page.waitForFunction(
        () => document.querySelector('.wm-card[data-job-index="2"]')?.classList.contains('wm-card--hidden'),
        { timeout: 10_000 }
      );
      const card1 = page.locator('.wm-card[data-job-index="1"]');
      await expect(card1).not.toHaveClass(/wm-card--hidden/);
      await expect(card1.locator('.wm-card__content')).toBeVisible();
    } finally {
      await ctx.close();
    }
  });
});
