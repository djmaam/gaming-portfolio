import { test, expect } from '@playwright/test';

// Helper: navigate with clean session and motion enabled (triggers BOOT)
async function freshVisit(page: Parameters<typeof test>[1]['page']) {
  await page.addInitScript(() => sessionStorage.clear());
  await page.goto('/');
}

test.describe('Boot flow', () => {
  // All boot-flow tests need motion enabled so the BOOT state is entered
  test.use({ reducedMotion: 'no-preference' });

  test('shows BOOT overlay (.gp-boot) on fresh session', async ({ page }) => {
    await freshVisit(page);
    // client:idle hydration is deferred — wait up to 10s for React to mount
    await expect(page.locator('.gp-boot')).toBeVisible({ timeout: 10_000 });
  });

  test('click BOOT overlay transitions to TITLE screen', async ({ page }) => {
    await freshVisit(page);
    await expect(page.locator('.gp-boot')).toBeVisible({ timeout: 10_000 });
    await page.locator('.gp-boot').click();
    await expect(page.locator('.gp-title')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('press Enter on TITLE screen transitions to EXPLORE', async ({ page }) => {
    await freshVisit(page);
    await expect(page.locator('.gp-boot')).toBeVisible({ timeout: 10_000 });
    await page.locator('.gp-boot').click();
    await expect(page.locator('.gp-title')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.locator('.gp-title')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('second visit in same session skips BOOT', async ({ page }) => {
    await freshVisit(page);
    // First visit: boot through to EXPLORE
    await expect(page.locator('.gp-boot')).toBeVisible({ timeout: 10_000 });
    await page.locator('.gp-boot').click();
    await expect(page.locator('.gp-title')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.locator('.gp-title')).not.toBeVisible({ timeout: 5_000 });
    // Reload — sessionStorage persists within same Playwright context
    await page.reload();
    // Wait for hydration then assert no boot overlay
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.gp-boot')).not.toBeVisible();
  });

  test('prefers-reduced-motion: reduce skips BOOT', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.clear());
    await page.goto('/');
    // After hydration, BOOT should be skipped → land in EXPLORE (GameLayer returns null)
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.gp-boot')).not.toBeVisible();
    await ctx.close();
  });
});
