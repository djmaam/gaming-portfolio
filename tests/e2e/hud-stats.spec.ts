import { test, expect } from './_fixtures';

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
  test('fresh session shows 1/5 (node 0 auto-seeded) and LV.1', async ({ page }) => {
    // worldMap.mount() auto-seeds node 0 (NOW PLAYING is always revealed) so
    // the HUD denominator and numerator agree from the start.
    await expect(page.locator('#hud-nodes')).toHaveText('1/5');
    await expect(page.locator('#hud-skills')).toHaveText('0/27');
    await expect(page.locator('#hud-level')).toHaveText('LV.1');
  });

  test('visiting a new node via dialog increments NODES counter', async ({ page }) => {
    await page.locator('.wm-node[data-job-index="0"]').click();
    await expect(page.locator('.wm-dialog-panel')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('ArrowRight');
    // Auto-seeded 0 + newly visited 1 → 2/5
    await expect(page.locator('#hud-nodes')).toHaveText('2/5');
  });

  test('HUD restores counts from sessionStorage on reload', async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        sessionStorage.setItem('gp-booted', '1');
        sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2]));
      });
      await page.goto('/');
      // worldMap merges seeded [1,2] with auto-seed 0 → {0,1,2} → 3/5
      await expect(page.locator('#hud-nodes')).toHaveText('3/5');
    } finally {
      await ctx.close();
    }
  });

  test('level updates after crossing threshold', async ({ browser }) => {
    // Seeded [1,2,3,4] + auto-seed 0 → 5 visited → floor(5*3/5)=3 → LV.3
    const ctx = await browser.newContext();
    try {
      const page = await ctx.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        sessionStorage.setItem('gp-booted', '1');
        sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2, 3, 4]));
      });
      await page.goto('/');
      await expect(page.locator('#hud-level')).toHaveText('LV.3');
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

  test('NaN dispatch is ignored — HUD stays at last good value', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('gp:stat-update', { detail: { nodes: NaN, skills: -1 } }));
    });
    // Fresh session: auto-seed gives 1/5. NaN + negative get filtered → unchanged.
    await expect(page.locator('#hud-nodes')).toHaveText('1/5');
    await expect(page.locator('#hud-level')).not.toHaveText(/NaN/);
  });
});
