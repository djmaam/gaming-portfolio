import { describe, it, expect } from 'vitest';
import { portfolio } from '../portfolio';

describe('portfolio shape', () => {
  it('has class field', () => {
    expect((portfolio as any).class).toBe('AI-AUGMENTED MAGE');
  });

  it('has skillTreeNote', () => {
    expect((portfolio as any).skillTreeNote).toBeTruthy();
  });

  it('has footerText', () => {
    expect((portfolio as any).footerText).toBeTruthy();
  });

  it('has contact.cta', () => {
    expect((portfolio as any).contact?.cta).toBeTruthy();
  });
});

describe('perks', () => {
  it('has exactly 3 perks', () => {
    expect((portfolio as any).perks).toHaveLength(3);
  });

  it('each perk has icon, name, tag, description', () => {
    (portfolio as any).perks.forEach((p: any) => {
      expect(typeof p.icon).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.tag).toBe('string');
      expect(typeof p.description).toBe('string');
    });
  });
});

describe('skills', () => {
  it('has exactly 5 groups', () => {
    expect(portfolio.skills).toHaveLength(5);
  });

  it('first group is AI ORCHESTRATION', () => {
    expect(portfolio.skills[0].group).toBe('AI ORCHESTRATION');
  });

  it('total skill items across all groups is 27', () => {
    const total = portfolio.skills.reduce((acc, g) => acc + g.items.length, 0);
    expect(total).toBe(27);
  });
});

describe('experience', () => {
  it('entries 0-2 have 3 bullets each', () => {
    [0, 1, 2].forEach(i => {
      expect((portfolio.experience[i] as any).bullets).toHaveLength(3);
    });
  });

  it('entries 3-4 have empty bullets', () => {
    [3, 4].forEach(i => {
      expect((portfolio.experience[i] as any).bullets).toHaveLength(0);
    });
  });

  it('all entries have lvl > 0', () => {
    portfolio.experience.forEach(e => {
      expect((e as any).lvl).toBeGreaterThan(0);
    });
  });

  it('all entries have valid status', () => {
    const valid = ['NOW PLAYING', 'CAMPAIGN CLEARED'];
    portfolio.experience.forEach(e => {
      expect(valid).toContain((e as any).status);
    });
  });

  it('entry 0 role is Tech Lead & AI Orchestrator', () => {
    expect(portfolio.experience[0].role).toBe('Tech Lead & AI Orchestrator');
  });
});
