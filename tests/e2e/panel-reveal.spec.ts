import { test, expect } from './_fixtures';

// Lock viewport so 'below the fold' assertions don't drift if the page
// layout changes — StartMenu at index 6 must remain off-screen at this
// height for the negative-control assertion to actually mean something.
test.use({ viewport: { width: 1280, height: 720 } });

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('panel reveal — motion allowed', () => {
  test.beforeEach(async ({ page }) => {
    // Override fixture default (reduce) → motion ALLOWED for reveal tests
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
    await page.goto('/');
    // Wait for hydration: GameLayer mounts panelReveal, IO auto-fires for
    // intersecting targets, first panel gets .panel--revealed.
    await expect(page.locator('.pixel-panel.panel--revealed').first())
      .toBeVisible({ timeout: 5_000 });
  });

  test('above-the-fold panel is revealed on initial load (no scroll)', async ({ page }) => {
    const firstPanel = page.locator('.pixel-panel').first();
    // No scroll — assert that the auto-fire on IO.observe() for an already-
    // visible target produced .panel--revealed. Negative control: a regression
    // that breaks observe() would leave the class absent here.
    await expect(firstPanel).toHaveClass(/panel--revealed/);
  });

  test('panel below the fold has no .panel--revealed on load', async ({ page }) => {
    const startMenu = page.locator('.pixel-panel.start-menu');
    await expect(startMenu).toHaveCount(1);
    await expect(startMenu).not.toHaveClass(/panel--revealed/);
  });

  test('scrolling a panel into view adds .panel--revealed', async ({ page }) => {
    const startMenu = page.locator('.pixel-panel.start-menu');
    await startMenu.scrollIntoViewIfNeeded();
    await expect(startMenu).toHaveClass(/panel--revealed/, { timeout: 2_000 });
  });
});

test.describe('panel reveal — reduced motion (fixture default)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.pixel-panel').first()).toBeVisible({ timeout: 10_000 });
  });

  test('every panel has .panel--revealed on load without scrolling', async ({ page }) => {
    // One round-trip: assert no panel is missing the class
    await expect(
      page.locator('.pixel-panel[data-reveal]:not(.panel--revealed)')
    ).toHaveCount(0, { timeout: 2_000 });
  });
});

test.describe('panel reveal — JS-armed safety net', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(SEED);
  });

  test('html.gp-armed is set synchronously by the head inline script', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html.gp-armed')).toHaveCount(1);
  });

  test('html.gp-reveal-fallback fires after the safety timeout', async ({ page }) => {
    await page.goto('/');
    // Inline script sets fallback after 1.5s — wait a touch longer.
    await expect(page.locator('html.gp-reveal-fallback')).toHaveCount(1, { timeout: 3_000 });
  });
});
