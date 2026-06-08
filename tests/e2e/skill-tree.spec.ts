import { test, expect } from './_fixtures';

const SEED = () => sessionStorage.setItem('gp-booted', '1');

test.describe('skill tree — collect mechanic', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SEED);
    await page.goto('/');
    await expect(page.locator('.skill-tree')).toBeVisible({ timeout: 10_000 });
  });

  test('chips start dim on first visit', async ({ page }) => {
    const chip = page.locator('.skill-tree .skill-chip[data-skill]').first();
    await expect(chip).toHaveCSS('opacity', '0.25');
  });

  test('click brightens a chip and increments the HUD skills counter', async ({ page }) => {
    const skillsHud = page.locator('#hud-skills');
    const startText = (await skillsHud.textContent())?.trim() ?? '';
    const startCount = parseInt(startText.split('/')[0] ?? '0', 10);

    const chip = page.locator('.skill-tree .skill-chip[data-skill]').first();
    await chip.click();
    await expect(chip).toHaveCSS('opacity', '1');
    await expect(chip).toHaveClass(/skill-chip--collected/);

    await expect(skillsHud).toHaveText(new RegExp(`^${startCount + 1}/`));
  });

  test('collected state persists across reload', async ({ page }) => {
    const firstChip = page.locator('.skill-tree .skill-chip[data-skill]').first();
    const skill = await firstChip.getAttribute('data-skill');
    await firstChip.click();
    await expect(firstChip).toHaveClass(/skill-chip--collected/);

    await page.reload();
    await expect(page.locator('.skill-tree')).toBeVisible({ timeout: 10_000 });

    const sameChip = page.locator(`.skill-tree .skill-chip[data-skill="${skill}"]`);
    await expect(sameChip).toHaveClass(/skill-chip--collected/);
    await expect(sameChip).toHaveCSS('opacity', '1');
  });
});
