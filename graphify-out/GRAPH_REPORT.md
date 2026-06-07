# Graph Report - .  (2026-06-06)

## Corpus Check
- Corpus is ~16,440 words - fits in a single context window. You may not need a graph.

## Summary
- 163 nodes · 217 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 6,120 input · 2,210 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Architecture & Docs|Architecture & Docs]]
- [[_COMMUNITY_Astro Components|Astro Components]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Portfolio Content & Skills|Portfolio Content & Skills]]
- [[_COMMUNITY_Job Cards & Contact UI|Job Cards & Contact UI]]
- [[_COMMUNITY_Design Reference Overview|Design Reference Overview]]
- [[_COMMUNITY_Game Engine Layer|Game Engine Layer]]
- [[_COMMUNITY_Design Spec Features|Design Spec Features]]
- [[_COMMUNITY_World Map Job Entries|World Map Job Entries]]
- [[_COMMUNITY_Hero & Stats UI|Hero & Stats UI]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Base Layout|Base Layout]]
- [[_COMMUNITY_Portfolio Data Reference|Portfolio Data Reference]]
- [[_COMMUNITY_Brand Icon|Brand Icon]]

## God Nodes (most connected - your core abstractions)
1. `DESIGN_SPEC.md — Exact Visual Specification` - 15 edges
2. `GAME_SPEC.md — Playable Layer Specification` - 9 edges
3. `portfolio` - 7 edges
4. `CLAUDE.md — Project Architecture Guide` - 7 edges
5. `Skill Tree Panel — 6-category grid of tech skills with rarity badges` - 7 edges
6. `Rarity badge system — LEGENDARY, EPIC, RARE, COMMON tiers on skill categories` - 7 edges
7. `../components/AbilityStats.astro` - 6 edges
8. `./PixelPanel.astro` - 6 edges
9. `../components/SkillTree.astro` - 6 edges
10. `../components/StartMenu.astro` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Game State Machine — BOOT → TITLE → EXPLORE` --semantically_similar_to--> `Game States — BOOT → TITLE → EXPLORE ⇄ DIALOG state machine`  [INFERRED] [semantically similar]
  CLAUDE.md → design_handoff_8bit_epic/GAME_SPEC.md
- `Rendering Model — Astro SSR + React Island` --semantically_similar_to--> `SSR Progressive Enhancement — game layered over fully-rendered static content`  [INFERRED] [semantically similar]
  CLAUDE.md → design_handoff_8bit_epic/GAME_SPEC.md
- `WorldMap Mini-game — hero movement, proximity, dialog` --semantically_similar_to--> `World-Map Mini-game — hero walkable career timeline`  [INFERRED] [semantically similar]
  CLAUDE.md → design_handoff_8bit_epic/GAME_SPEC.md
- `Data Layer — portfolio.ts single source of truth` --conceptually_related_to--> `Resume-to-Game Concept Mapping — RPG framing of portfolio content`  [INFERRED]
  CLAUDE.md → design_handoff_8bit_epic/README.md
- `Styling — tokens.css CSS custom properties` --implements--> `Color Palette — bg0/bg1/panel/ink/dim/red/blue/green/yellow/purple/cyan tokens`  [INFERRED]
  CLAUDE.md → design_handoff_8bit_epic/DESIGN_SPEC.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Six UI Panels collectively compose the full portfolio layout** — concept_hud_bar, concept_title_block, concept_character_stats, concept_quest_log, concept_skill_tree, concept_world_map_panel, concept_start_menu [EXTRACTED 1.00]
- **Game state machine, game module pattern, and SSR progressive enhancement together define the client-side game architecture** — claude_md_game_state_machine, claude_md_game_module_pattern, concept_ssr_progressive_enhancement [EXTRACTED 0.95]
- **Color palette, typography, and pixel panel treatment form the unified design token system** — concept_color_palette, concept_typography, concept_pixel_panel [EXTRACTED 1.00]

## Communities (16 total, 2 thin omitted)

### Community 0 - "Architecture & Docs"
Cohesion: 0.09
Nodes (33): CLAUDE.md — Project Architecture Guide, Data Layer — portfolio.ts single source of truth, Game Module Pattern — mount(): () => void, Game State Machine — BOOT → TITLE → EXPLORE, Planned Features — GP-20 through GP-26, Rendering Model — Astro SSR + React Island, Styling — tokens.css CSS custom properties, WorldMap Mini-game — hero movement, proximity, dialog (+25 more)

### Community 1 - "Astro Components"
Cohesion: 0.14
Nodes (22): ../components/AbilityStats.astro, CELL_COLORS, ../components/CharacterCard.astro, ../components/HudBar.astro, ./PixelPanel.astro, ../components/QuestLog.astro, ../components/SkillTree.astro, RARITY (+14 more)

### Community 2 - "Project Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, astro, @astrojs/react, @astrojs/sitemap, react, react-dom, @types/react, @types/react-dom (+10 more)

### Community 3 - "Portfolio Content & Skills"
Cohesion: 0.21
Nodes (15): Job entry: AgroPro — Full-stack Engineer, Cleared, React Native/React/Laravel/Python, AI / Agents skill category (RARE) — Claude Code, Codex, Antigravity, SDD, Backend skill category (EPIC) — Node.js, Nest.js, Spring, Laravel, Python, Cleared badge — marks completed/past jobs on world map timeline, Cloud / OPS skill category (RARE) — AWS, Google Cloud, Firebase, CI/CD, GH Actions, Data skill category (COMMON) — PostgreSQL, MongoDB, MySQL, GraphQL, Frontend skill category (EPIC) — React Native, Next.js, Astro, React, Vue, Languages skill category (LEGENDARY) — JavaScript, TypeScript, Kotlin, Java, Go, C# (+7 more)

### Community 4 - "Job Cards & Contact UI"
Cohesion: 0.25
Nodes (11): AgroPro Job Card — Full-stack Engineer, CLEARED Badge — 20XX status indicator, Contact Panel — START MENU / GET IN TOUCH, Demedis Job Card — Mobile Engineer, GitHub Link — github.com/djmaam, Hashme Job Card — Mobile Engineer, 04-epic.png — Design Screenshot (bottom section), LinkedIn Link — linkedin.com/in/djmaam (+3 more)

### Community 5 - "Design Reference Overview"
Cohesion: 0.27
Nodes (10): Backend Category — Node.js, Nest.js, Spring, Laravel, Python (EPIC tier), Frontend Category — React Native, Next.js, Astro, React, Vue (EPIC tier), Hero Panel — @djmaam, CLASS: FULL-STACK MAGE, HOME: ARGENTINA, 02-epic.png — 8-Bit Epic Design Screenshot (Full Portfolio View), Languages Category — JavaScript, TypeScript, Kotlin, Java, Go, C# (LEGENDARY tier), 8-bit pixel art UI design language — dark navy background, pixel-border panels, Press Start 2P font, Quest Log — WHO AM I section with bio text and current focus on AI/Spec-Driven Development, Skill bar progress indicators — color-coded segmented bars for AI Orchestration and Cloud/DevOps (+2 more)

### Community 6 - "Game Engine Layer"
Cohesion: 0.31
Nodes (4): GameLayer(), mount(), GameState, useGameState()

### Community 7 - "Design Spec Features"
Cohesion: 0.25
Nodes (8): Audio System — SFX pool + toggleable BGM, muted by default, Contact Form — Start-Menu dialogue, RPG validation, XP reward, Deploy Strategy — static or SSR, marcosarrieta.ar domain, Menu Cursor Navigation — ► blinking cursor in Start Menu, Proposed Astro Project Structure — src layout, SEO and Social Meta — OG card, sitemap, canonical URL, Panel G — Start Menu / Get in Touch (cursor nav + contact), ARCHITECTURE.md — Astro Build, Audio, Contact, Deploy

### Community 8 - "World Map Job Entries"
Cohesion: 0.36
Nodes (8): CLEARED badge UI element — green checkmark + 20XX year, shown on completed job nodes, Contact / START MENU panel — GitHub, LinkedIn, Website links styled as menu items, Demedis — Mobile Engineer job entry (React Native, Laravel, Firebase; Realtime health application), Footer — '© 20XX MARCOS ARRIETA · INSERT COIN TO CONTINUE' tagline, Hashme — Mobile Engineer job entry (React Native, Node, AWS; Instagram metrics via Facebook SDK), Pixel-art double-border panel frame — used for both job list and contact section, 05-epic.png — Bottom section of 8-bit portfolio design showing job entries and contact panel, World-map timeline job card visual — pixel-art numbered node badges with CLEARED status badges

### Community 9 - "Hero & Stats UI"
Cohesion: 0.38
Nodes (7): Ability Stats Panel — Frontend LV19, Backend LV17, Mobile LV18, AI Orchestration LV18, Cloud/DevOps LV16, Pixel Art Hero Portrait (Player 1 / @djmaam), HUD Bar — 1UP, HP, XP Stats, 8-Bit Epic Full Page Screenshot — dark RPG theme, pixel font, two-panel layout, Press Start CTA Prompt, Segmented RPG-style Stat Bars (green/yellow/red segments per skill), Title Block — Marcos Arrieta, Software Engineer & AI Orchestrator

### Community 10 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, jsxImportSource, exclude, extends, include

### Community 11 - "Base Layout"
Cohesion: 0.50
Nodes (4): ../layouts/Base.astro, canonicalURL, ogImage, stars

## Knowledge Gaps
- **51 isolated node(s):** `PORTFOLIO`, `name`, `type`, `version`, `node` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DESIGN_SPEC.md — Exact Visual Specification` connect `Architecture & Docs` to `Design Spec Features`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Design Handoff README — 8-bit EPIC Overview` connect `Architecture & Docs` to `Design Spec Features`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `GAME_SPEC.md — Playable Layer Specification` connect `Architecture & Docs` to `Design Spec Features`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `PORTFOLIO`, `name`, `type` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture & Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._
- **Should `Astro Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14461538461538462 - nodes in this community are weakly interconnected._
- **Should `Project Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._