# Portfolio Content Update — Design Spec

**Date:** 2026-06-07  
**Source:** `design_handoff_8bit_epic/UPDATE_DATA.md`  
**Approach:** Two PRs — data first, then render  
**Linear tickets to create:** GP-27a (data), GP-27b (components)

---

## Objective

Reposition the portfolio as **Software Engineer & AI Orchestrator** specializing in SDD and autonomous AI agent pipelines. Update all content, add a new Perks section, restructure the skill tree, and enrich the WorldMap experience entries — while keeping all planned gamification (GP-20→26) intact.

---

## PR1 — Data Model (`portfolio.ts`)

### New / changed top-level fields

| Field | Type | Value |
|---|---|---|
| `class` | `string` | `"AI-AUGMENTED MAGE"` |
| `about` | `string` | `"I don't just write code — I design and orchestrate the systems that automate software engineering. As a Tech Lead & AI Orchestrator, I combine the rigor of Spec-Driven Development (SDD) with autonomous agent ecosystems to take product ideas to production at unprecedented speed."` |
| `aboutNow` | `string` | `"My approach eliminates operational friction: I transform business requirements into ultra-precise specifications that AI executes, tests, and packages — always keeping the human in the loop for final quality control."` |
| `perks` | `Perk[]` | 3 items (see below) |
| `skillTreeNote` | `string` | `"⚙️ SYSTEM NOTE · STACK AGNOSTIC: Syntax is not a barrier. I use context engineering and AI to execute, migrate, and deploy solutions in any language or framework at record speed."` |
| `contact.cta` | `string` | `"Have a project in mind or looking to accelerate your team's velocity? I design solid architectures, automate development pipelines with AI, and build user-focused products. Drop me a message in the terminal below or connect through my networks. Let's talk!"` |
| `footerText` | `string` | `"© 2026 MARCOS ARRIETA · INSERT COIN TO COLLABORATE"` |

### `perks[]` — new array

```ts
export type Perk = {
  icon: string;
  name: string;
  tag: string;
  description: string;
};
```

| # | icon | name | tag |
|---|---|---|---|
| 0 | `⚙️` | `AUTONOMOUS EXECUTION LOOP` | `[PASSIVE]` |
| 1 | `📚` | `ZERO-FRICTION DOCUMENTATION` | `[BUFF]` |
| 2 | `🧠` | `PRODUCT-FIRST FOCUS` | `[+100% COGNITIVE LOAD]` |

### `skills[]` — restructured (5 groups, was 6)

LANGUAGES group dissolved — JS/TS merged into AI ORCHESTRATION items.

| Index | Group | Rarity | Ring color | Items |
|---|---|---|---|---|
| 0 | `AI ORCHESTRATION` | LEGENDARY | `#ffd24d` (yellow) | Cursor, Claude, GPT, Copilot, Codex, SDD, AI Agent Pipelines, Antigravity, JavaScript, TypeScript |
| 1 | `FRONTEND` | EPIC | `#e040fb` (pink) | Next.js, React Native, Astro, React, Vue |
| 2 | `BACKEND` | EPIC | `#e040fb` (pink) | Node.js, NestJS, Spring Boot, Python, Laravel |
| 3 | `CLOUD & INFRA` | RARE | `#4dc8ff` (cyan) | AWS, GitHub Actions (CI/CD), Firebase |
| 4 | `DATA & ANALYTICS` | COMMON | `#4dff88` (green) | PostgreSQL, MongoDB, GraphQL, Amplitude |

**Total items: 27** — GP-25 HUD `"SKILLS X/27"` stays accurate.

### `experience[]` — new fields + updated content

New fields added to `Experience` type:

```ts
export type Experience = {
  year: string;
  company: string;
  role: string;
  tech: string;
  note: string;
  lvl: number;           // new
  status: string;        // new: "NOW PLAYING" | "CAMPAIGN CLEARED"
  bullets: string[];     // new: 3 items for top 3, [] for bottom 2
};
```

| Index | Company | Role | lvl | status | bullets |
|---|---|---|---|---|---|
| 0 | Nera | Tech Lead & AI Orchestrator | 5 | NOW PLAYING | 3 bullets |
| 1 | Telecentro · Tplay | Multi-platform Engineer | 4 | CAMPAIGN CLEARED | 3 bullets |
| 2 | AgroPro | Full-stack Engineer | 3 | CAMPAIGN CLEARED | 3 bullets |
| 3 | Hashme | Mobile Engineer | 2 | CAMPAIGN CLEARED | [] |
| 4 | Demedis | Mobile Engineer | 1 | CAMPAIGN CLEARED | [] |

Hashme and Demedis keep `role`, `tech`, `note` — no bullets. WorldMap renders them minimally. 5 nodes preserved — GP-22 and GP-25 (`NODES X/5`) unaffected.

### Tests (`src/data/__tests__/portfolio.test.ts`)

- All new fields present with correct types
- `perks` has exactly 3 items, each with `icon/name/tag/description`
- `experience[0..2]` each have exactly 3 bullets, `lvl`, `status`
- `experience[3..4]` have `bullets.length === 0`, still have `lvl`/`status`
- `skills[0].group === "AI ORCHESTRATION"`
- Total skill items across all groups === 27
- `footerText`, `skillTreeNote`, `contact.cta` all non-empty strings

---

## PR2 — Component Updates + New Component

### Page layout change

`src/pages/index.astro` — insert `<PerksPanel />` after `<QuestLog />`:

```
HUD Bar → Title Block → CharacterCard + AbilityStats → QuestLog → PerksPanel (NEW) → SkillTree → WorldMap → StartMenu
```

### New: `src/components/PerksPanel.astro`

- `PixelPanel` accent = pink (`#ff4d8b`)
- Label: `✦ PERKS & STAT MODIFIERS`
- Maps `portfolio.perks[]` — each row: icon + name + tag badge + description
- Per-perk accent colors: AUTONOMOUS = yellow, DOCUMENTATION = green, PRODUCT = cyan
- No animations — reduced-motion safe by default
- Gamification hook: compatible with GP-20 scroll entrance (panel gets `.pixel-panel` class like all others)

### Updated: `src/components/CharacterCard.astro`

- Render `portfolio.class` as small label below role (Press Start 2P 7px, purple)

### Updated: `src/components/SkillTree.astro`

- Rarity map: 5 entries (was 6). Index 0 → LEGENDARY (yellow `#ffd24d`)
- Render `portfolio.skillTreeNote` as small caption below the skill grid
- GP-24 collect mechanic: 27 chips total, rarity ring colors update accordingly

### Updated: `src/components/WorldMap.astro`

- Render `[LVL X]` prefix in node label from `experience[i].lvl`
- Render `status` badge (`NOW PLAYING` / `CAMPAIGN CLEARED`) in card header
- Render `bullets[]` as `<ul>` inside card — only when `bullets.length > 0`
- Hashme/Demedis: no bullet list, just role + tech + note (existing layout)
- GP-22 compatibility: progressive disclosure hides card content until visited — bullets are part of revealed content, no conflict

### Updated: `src/components/StartMenu.astro`

- Replace hardcoded CTA body text with `portfolio.contact.cta`

### Updated: `src/layouts/Base.astro`

- Replace `© 20XX` footer text with `portfolio.footerText`

### Not changed: `src/components/QuestLog.astro`

Already reads `portfolio.about` and `portfolio.aboutNow` verbatim — PR1 data update handles content automatically.

### Tests

- `src/components/__tests__/PerksPanel.test.tsx` — renders 3 rows; each shows icon, name, tag
- `src/components/__tests__/SkillTree.test.tsx` — index 0 group gets legendary ring; `skillTreeNote` renders
- `src/game/__tests__/WorldMap.test.ts` — top 3 nodes render bullet lists; bottom 2 render no bullets; all 5 show `lvl` + `status`
- `src/components/__tests__/CharacterCard.test.tsx` — `portfolio.class` value appears in output

---

## Gamification Compatibility Matrix

| Issue | Status | Impact |
|---|---|---|
| GP-19 (real years) | Backlog | Unaffected — `year` field unchanged |
| GP-20 (scroll entrance) | Backlog | PerksPanel gets `.pixel-panel` — entrance animation applies automatically |
| GP-21 (animated stat bars) | Backlog | `portfolio.stats` unchanged |
| GP-22 (WorldMap progressive disclosure) | Backlog/Urgent | 5 nodes preserved; bullets = revealed content |
| GP-23 (QuestLog typewriter) | Backlog | `about`/`aboutNow` strings updated, component structure unchanged |
| GP-24 (SkillTree collect) | Backlog | 27 chips total preserved; rarity colors shift at index 0 |
| GP-25 (HUD live stats) | Backlog | `NODES X/5` and `SKILLS X/27` both still accurate |
| GP-26 (CRT ambient) | Backlog | Unaffected |
