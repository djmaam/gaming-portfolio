import { test as base, expect } from '@playwright/test';

/**
 * Shared Playwright fixture: emulates `prefers-reduced-motion: reduce` on
 * every page by default so existing specs (worldmap-dialog, hud-stats,
 * progressive-disclosure, content-update) bypass the GP-20 reveal CSS and
 * assert content visibility without needing to scroll panels into view.
 *
 * Why a fixture instead of `playwright.config.ts > use.reducedMotion`:
 * Playwright 1.60's project-level `reducedMotion` option does NOT
 * propagate to `window.matchMedia` reliably — only `page.emulateMedia()`
 * does. This fixture wraps every test's page so the call site doesn't
 * have to remember it.
 *
 * For tests that need motion ALLOWED (e.g., panel-reveal.spec.ts), call
 * `page.emulateMedia({ reducedMotion: 'no-preference' })` in beforeEach.
 *
 * For tests that spawn a fresh `browser.newContext()`, the fixture has
 * no reach — call `await page.emulateMedia({ reducedMotion: 'reduce' })`
 * on the new page explicitly.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await use(page);
  },
});

export { expect };
