import { test, expect } from './_fixtures';

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('ambient CRT effects — motion allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
    await page.goto('/');
    await page.waitForFunction(() => new Promise<void>(r => requestAnimationFrame(() => r())));
    await expect(page.locator('#crt-overlay')).toHaveCount(1, { timeout: 5_000 });
  });

  test('crt overlay element is present on the body', async ({ page }) => {
    await expect(page.locator('#crt-overlay')).toBeVisible();
  });

  test('hovering a pixel-panel applies the glitch class then removes it', async ({ page }) => {
    const panel = page.locator('.pixel-panel').first();
    await panel.hover();
    await expect(panel).toHaveClass(/pixel-panel--glitch/, { timeout: 1_000 });
    await page.locator('body').hover({ position: { x: 0, y: 0 } });
    await expect(panel).not.toHaveClass(/pixel-panel--glitch/);
  });
});

test.describe('ambient CRT effects — reduced motion (fixture default)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED);
    await page.goto('/');
    await page.waitForFunction(() => new Promise<void>(r => requestAnimationFrame(() => r())));
  });

  test('overlay is NOT injected and hover does not add the glitch class', async ({ page }) => {
    await expect(page.locator('#crt-overlay')).toHaveCount(0);
    const panel = page.locator('.pixel-panel').first();
    await panel.hover();
    await expect(panel).not.toHaveClass(/pixel-panel--glitch/);
  });
});
