import { test, expect } from '@playwright/test';

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('panel reveal — motion allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.pixel-panel').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForFunction(() => new Promise(r => requestAnimationFrame(() => r(true))));
  });

  test('panel below the fold has no .panel--revealed on load', async ({ page }) => {
    // StartMenu is the last panel in the stack — guaranteed below the fold at default viewport
    const startMenu = page.locator('.pixel-panel.start-menu');
    await expect(startMenu).toHaveCount(1);
    await expect(startMenu).not.toHaveClass(/panel--revealed/);
  });

  test('scrolling a panel into view adds .panel--revealed within 500ms', async ({ page }) => {
    const startMenu = page.locator('.pixel-panel.start-menu');
    await startMenu.scrollIntoViewIfNeeded();
    await expect(startMenu).toHaveClass(/panel--revealed/, { timeout: 500 });
  });

  test('panels above the fold reveal on initial scroll-position load', async ({ page }) => {
    // CharacterCard is the first panel — typically in the viewport at top
    const firstPanel = page.locator('.pixel-panel').first();
    await firstPanel.scrollIntoViewIfNeeded();
    await expect(firstPanel).toHaveClass(/panel--revealed/, { timeout: 500 });
  });
});

test.describe('panel reveal — reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.pixel-panel').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForFunction(() => new Promise(r => requestAnimationFrame(() => r(true))));
  });

  test('every panel has .panel--revealed on load without scrolling', async ({ page }) => {
    const panels = page.locator('.pixel-panel');
    const count = await panels.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(panels.nth(i)).toHaveClass(/panel--revealed/);
    }
  });
});
