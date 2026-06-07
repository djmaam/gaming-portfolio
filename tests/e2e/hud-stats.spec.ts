import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('gp-booted', '1');
    sessionStorage.removeItem('gp-visited-nodes');
    sessionStorage.removeItem('gp-collected-skills');
  });
  await page.goto('/');
  await expect(page.locator('#hud-nodes')).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(
    () => document.querySelector('.wm-card[data-job-index="1"]')?.classList.contains('wm-card--hidden'),
    { timeout: 10_000 }
  );
});

test.describe('HUD live game stats', () => {
  test('fresh session shows zero counts and LV.1', async ({ page }) => {
    await expect(page.locator('#hud-nodes')).toHaveText('0/5');
    await expect(page.locator('#hud-skills')).toHaveText('0/27');
    await expect(page.locator('#hud-level')).toHaveText('LV.1');
  });

  test('visiting a node via dialog increments NODES counter', async ({ page }) => {
    // Click node 0 (NOW PLAYING, always active) → opens dialog → markVisited fires
    // for node 0 is no-op (counter unchanged). Navigate to node 1 in-dialog → counter ticks.
    await page.locator('.wm-node[data-job-index="0"]').click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#hud-nodes')).toHaveText('1/5');
  });

  test('HUD restores counts from sessionStorage on reload', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        sessionStorage.setItem('gp-booted', '1');
        sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2]));
      });
      await page.goto('/');
      await expect(page.locator('#hud-nodes')).toHaveText('2/5');
    } finally {
      await ctx.close();
    }
  });

  test('level updates after crossing threshold', async ({ browser }) => {
    // 4 nodes visited → floor((4*3 + 0*0.5)/5) = floor(2.4) = 2 → LV.2
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        sessionStorage.setItem('gp-booted', '1');
        sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2, 3, 4]));
      });
      await page.goto('/');
      await expect(page.locator('#hud-level')).toHaveText('LV.2');
    } finally {
      await ctx.close();
    }
  });

  test('custom event dispatch updates HUD in real time', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('gp:stat-update', { detail: { nodes: 3, skills: 10 } }));
    });
    await expect(page.locator('#hud-nodes')).toHaveText('3/5');
    await expect(page.locator('#hud-skills')).toHaveText('10/27');
    // floor((3*3 + 10*0.5)/5) = floor(2.8) = 2
    await expect(page.locator('#hud-level')).toHaveText('LV.2');
  });
});
