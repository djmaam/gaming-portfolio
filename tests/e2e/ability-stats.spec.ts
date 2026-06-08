import { test, expect } from './_fixtures';

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('ability stats — motion allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.ability-stats')).toBeVisible({ timeout: 10_000 });
  });

  test('bars start empty + LV0 before scrolling into view', async ({ page }) => {
    // AbilityStats panel sits below the fold at 1280×720 — its IO has not
    // fired yet, so the JS reset state must be visible.
    const firstRow = page.locator('.ability-stats .stat-row').first();
    await expect(firstRow.locator('.stat-cell.stat-cell--filled')).toHaveCount(0);
    await expect(firstRow.locator('.stat-row__lv')).toHaveText('LV0');
  });

  test('scrolling into view fills bars and counts up LV', async ({ page }) => {
    const panel = page.locator('.ability-stats');
    await panel.scrollIntoViewIfNeeded();
    const firstRow = page.locator('.ability-stats .stat-row').first();
    // FRONTEND stat = 95 → LV10 → 10 filled cells. Allow up to 2s for the
    // 600ms animation plus stagger and any rAF jitter.
    await expect(firstRow.locator('.stat-row__lv')).toHaveText('LV10', { timeout: 2_000 });
    await expect(firstRow.locator('.stat-cell.stat-cell--filled')).toHaveCount(10);
  });
});

test.describe('ability stats — reduced motion (fixture default)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.ability-stats')).toBeVisible({ timeout: 10_000 });
  });

  test('bars are at final state immediately, no scroll required', async ({ page }) => {
    const firstRow = page.locator('.ability-stats .stat-row').first();
    await expect(firstRow.locator('.stat-row__lv')).toHaveText('LV10', { timeout: 2_000 });
    await expect(firstRow.locator('.stat-cell.stat-cell--filled')).toHaveCount(10);
  });
});
