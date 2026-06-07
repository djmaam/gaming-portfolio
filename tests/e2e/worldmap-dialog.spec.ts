import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Skip boot/title so we land directly in EXPLORE with world map active
  // reduce-motion → bypass GP-20 panel reveal (panels visible without scroll)
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => sessionStorage.setItem('gp-booted', '1'));
  await page.goto('/');
  // Wait for the world map timeline to be present (static HTML, no hydration needed)
  await expect(page.locator('#world-map-timeline')).toBeVisible({ timeout: 10_000 });
});

test.describe('WorldMap dialog', () => {
  test('world map timeline is visible', async ({ page }) => {
    await expect(page.locator('#world-map-timeline')).toBeVisible();
  });

  test('ArrowDown moves hero canvas top position', async ({ page }) => {
    const canvas = page.locator('.wm-hero-canvas');
    // Hero canvas is injected by mountWorldMap() after React hydrates to EXPLORE.
    // client:idle can take a moment — wait for it.
    await expect(canvas).toBeVisible({ timeout: 10_000 });
    // Wait for the rAF loop to set an initial style.top value
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.wm-hero-canvas') as HTMLElement | null;
        return el && el.style.top !== '';
      },
      { timeout: 5_000 }
    );
    const initialTop = await canvas.evaluate((el: HTMLElement) => el.style.top);
    // Hold ArrowDown so the rAF loop registers movement across multiple frames
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(200); // ~12 frames at 60fps
    await page.keyboard.up('ArrowDown');
    const movedTop = await canvas.evaluate((el: HTMLElement) => el.style.top);
    expect(movedTop).not.toBe(initialTop);
  });

  test('node button click opens dialog with correct company name', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.wm-dialog__company')).toContainText('Nera');
  });

  test('Escape key closes open dialog', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.wm-dialog-panel')).not.toBeVisible({ timeout: 5_000 });
  });

  test('CLOSE button closes dialog', async ({ page }) => {
    await page.locator('.wm-node').first().click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await page.locator('.wm-dialog__btn--close').click();
    await expect(page.locator('.wm-dialog-panel')).not.toBeVisible({ timeout: 5_000 });
  });

  test('touch device: node tap opens dialog directly (no hero canvas)', async ({ browser }) => {
    const ctx = await browser.newContext({
      hasTouch: true,
      // pointer: coarse is inferred from hasTouch in Chromium
    });
    try {
      const page = await ctx.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => sessionStorage.setItem('gp-booted', '1'));
      await page.goto('/');
      await expect(page.locator('#world-map-timeline')).toBeVisible({ timeout: 10_000 });
      // Wait for React hydration (client:idle) so mountWorldMap() has run
      await page.waitForLoadState('networkidle');
      // On touch device (pointer: coarse), hero canvas is never injected
      await expect(page.locator('.wm-hero-canvas')).not.toBeVisible();
      // Tapping a node directly opens the dialog
      await page.locator('.wm-node').first().tap();
      await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    } finally {
      await ctx.close();
    }
  });
});
