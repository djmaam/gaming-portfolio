import { test, expect } from './_fixtures';

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('quest log — motion allowed', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.quest-log')).toBeVisible({ timeout: 10_000 });
  });

  test('all entries become visible after the panel enters view', async ({ page }) => {
    await page.locator('.quest-log').scrollIntoViewIfNeeded();
    const entries = page.locator('.quest-log .quest-entry');
    await expect(entries).toHaveCount(4);
    // All 4 entries must eventually pick up the visible class (stagger budget
    // ~ 4 × 120ms + animation tail). Allow generous slack for CI jitter.
    for (let i = 0; i < 4; i++) {
      await expect(entries.nth(i)).toHaveClass(/quest-entry--visible/, { timeout: 2_000 });
    }
  });

  test('typewriter renders the note text fully after stagger completes', async ({ page }) => {
    await page.locator('.quest-log').scrollIntoViewIfNeeded();
    const firstNote = page.locator('.quest-log .quest-entry').first().locator('.quest-entry__note');
    // Wait for typewriter to finish — note must end up non-empty.
    await expect(firstNote).not.toHaveText('', { timeout: 3_000 });
  });

  test('clicking an entry expands it', async ({ page }) => {
    await page.locator('.quest-log').scrollIntoViewIfNeeded();
    const first = page.locator('.quest-log .quest-entry').first();
    await expect(first).toHaveClass(/quest-entry--visible/, { timeout: 2_000 });
    await first.click();
    await expect(first).toHaveClass(/quest-entry--expanded/);
    await first.click();
    await expect(first).not.toHaveClass(/quest-entry--expanded/);
  });
});

test.describe('quest log — reduced motion (fixture default)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.quest-log')).toBeVisible({ timeout: 10_000 });
  });

  test('all entries are visible immediately with full note text', async ({ page }) => {
    const entries = page.locator('.quest-log .quest-entry');
    await expect(entries).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(entries.nth(i)).toHaveClass(/quest-entry--visible/, { timeout: 2_000 });
      await expect(entries.nth(i).locator('.quest-entry__note')).not.toHaveText('');
    }
  });
});
