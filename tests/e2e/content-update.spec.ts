import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'dark' });

test.beforeEach(async ({ page }) => {
  // Pre-seed all nodes as visited so progressive disclosure doesn't hide content
  // reduce-motion → bypass GP-20 panel reveal (panels visible without scroll)
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    sessionStorage.setItem('gp-visited-nodes', JSON.stringify([1, 2, 3, 4]));
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('CharacterCard shows AI-AUGMENTED MAGE class', async ({ page }) => {
  await expect(page.locator('.char-card__class')).toContainText('AI-AUGMENTED MAGE');
});

test('PerksPanel renders after QuestLog', async ({ page }) => {
  const questLog = page.locator('.pixel-panel').filter({ hasText: 'QUEST LOG' });
  const perksPanel = page.locator('.pixel-panel').filter({ hasText: 'PERKS & STAT MODIFIERS' });
  await expect(questLog).toBeVisible();
  await expect(perksPanel).toBeVisible();

  const questBox = await questLog.boundingBox();
  const perksBox = await perksPanel.boundingBox();
  expect(perksBox!.y).toBeGreaterThan(questBox!.y);
});

test('PerksPanel renders 3 perk rows', async ({ page }) => {
  const panel = page.locator('.pixel-panel').filter({ hasText: 'PERKS & STAT MODIFIERS' });
  await expect(panel.locator('.perk-row')).toHaveCount(3);
});

test('each perk row shows icon, name, tag', async ({ page }) => {
  const rows = page.locator('.perk-row');
  const icons = ['⚙️', '📚', '🧠'];
  const names = ['AUTONOMOUS EXECUTION LOOP', 'ZERO-FRICTION DOCUMENTATION', 'PRODUCT-FIRST FOCUS'];

  for (let i = 0; i < 3; i++) {
    await expect(rows.nth(i)).toContainText(icons[i]);
    await expect(rows.nth(i)).toContainText(names[i]);
  }
});

test('SkillTree first group is AI ORCHESTRATION', async ({ page }) => {
  const firstCard = page.locator('.skill-card').first();
  await expect(firstCard).toContainText('AI ORCHESTRATION');
  await expect(firstCard).toContainText('LEGENDARY');
});

test('SkillTree note caption renders', async ({ page }) => {
  await expect(page.locator('.skill-tree__note')).toContainText('STACK AGNOSTIC');
});

test('WorldMap all 5 entries show LVL number', async ({ page }) => {
  for (let lvl = 1; lvl <= 5; lvl++) {
    await expect(page.locator('.wm-card__lvl').filter({ hasText: `LVL ${lvl}` })).toBeVisible();
  }
});

test('WorldMap all 5 entries show status badge', async ({ page }) => {
  await expect(page.locator('.wm-card__status').filter({ hasText: 'NOW PLAYING' })).toBeVisible();
  const cleared = page.locator('.wm-card__status').filter({ hasText: 'CAMPAIGN CLEARED' });
  await expect(cleared).toHaveCount(4);
});

test('WorldMap top 3 entries have bullet lists', async ({ page }) => {
  const cards = page.locator('.wm-card');
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).locator('.wm-card__bullets')).toBeVisible();
    const bullets = cards.nth(i).locator('.wm-card__bullet');
    await expect(bullets).toHaveCount(3);
  }
});

test('WorldMap entries 4 and 5 have no bullet list', async ({ page }) => {
  const cards = page.locator('.wm-card');
  await expect(cards.nth(3).locator('.wm-card__bullets')).not.toBeAttached();
  await expect(cards.nth(4).locator('.wm-card__bullets')).not.toBeAttached();
});

test('footer shows INSERT COIN TO COLLABORATE', async ({ page }) => {
  await expect(page.locator('.site-footer')).toContainText('INSERT COIN TO COLLABORATE');
});

test('StartMenu shows contact CTA text', async ({ page }) => {
  await expect(page.locator('.start-menu__cta')).toContainText("accelerate your team's velocity");
});
