export interface Perk {
  icon: string;
  name: string;
  tag: string;
  description: string;
}

export interface Experience {
  year: string;
  company: string;
  role: string;
  tech: string;
  note: string;
  lvl: number;
  status: 'NOW PLAYING' | 'CAMPAIGN CLEARED';
  bullets: string[];
}

export const portfolio = {
  name: "MARCOS ARRIETA",
  handle: "djmaam",
  role: "Software Engineer & AI Orchestrator",
  class: "AI-AUGMENTED MAGE",
  location: "Argentina",
  about:
    "I don't just write code — I design and orchestrate the systems that automate software engineering. As a Tech Lead & AI Orchestrator, I combine the rigor of Spec-Driven Development (SDD) with autonomous agent ecosystems to take product ideas to production at unprecedented speed.",
  aboutNow:
    "My approach eliminates operational friction: I transform business requirements into ultra-precise specifications that AI executes, tests, and packages — always keeping the human in the loop for final quality control.",
  skillTreeNote:
    "⚙️ SYSTEM NOTE · STACK AGNOSTIC: Syntax is not a barrier. I use context engineering and AI to execute, migrate, and deploy solutions in any language or framework at record speed.",
  footerText: "© 2026 MARCOS ARRIETA · INSERT COIN TO COLLABORATE",
  contact: {
    cta: "Have a project in mind or looking to accelerate your team's velocity? I design solid architectures, automate development pipelines with AI, and build user-focused products. Drop me a message in the terminal below or connect through my networks. Let's talk!",
  },
  perks: [
    {
      icon: "⚙️",
      name: "AUTONOMOUS EXECUTION LOOP",
      tag: "[PASSIVE]",
      description:
        "Bug resolution and new feature implementation are no longer bottlenecks. What takes a common developer hours, my AI pipeline executes trivially in minutes.",
    },
    {
      icon: "📚",
      name: "ZERO-FRICTION DOCUMENTATION",
      tag: "[BUFF]",
      description:
        "Architecture and code documentation fully automated via structured context engineering. Clean, clear, always up-to-date repos without sacrificing dev time.",
    },
    {
      icon: "🧠",
      name: "PRODUCT-FIRST FOCUS",
      tag: "[+100% COGNITIVE LOAD]",
      description:
        "By delegating 90% of manual execution to AI, I invest time where it creates real value: planning solution scalability, optimizing UX, and designing future architecture.",
    },
  ] as Perk[],
  skills: [
    { group: "AI ORCHESTRATION", items: ["Cursor", "Claude", "GPT", "Copilot", "Codex", "SDD", "AI Agent Pipelines", "Antigravity", "JavaScript", "TypeScript"] },
    { group: "FRONTEND",         items: ["Next.js", "React Native", "Astro", "React", "Vue"] },
    { group: "BACKEND",          items: ["Node.js", "NestJS", "Spring Boot", "Python", "Laravel"] },
    { group: "CLOUD & INFRA",    items: ["AWS", "GitHub Actions (CI/CD)", "Firebase"] },
    { group: "DATA & ANALYTICS", items: ["PostgreSQL", "MongoDB", "GraphQL", "Amplitude"] },
  ],
  stats: [
    { label: "FRONTEND",         lvl: 95 },
    { label: "BACKEND",          lvl: 85 },
    { label: "MOBILE",           lvl: 92 },
    { label: "AI ORCHESTRATION", lvl: 88 },
    { label: "CLOUD / DEVOPS",   lvl: 80 },
  ],
  experience: [
    {
      year: "20XX",
      company: "Nera",
      role: "Tech Lead & AI Orchestrator",
      tech: "Next.js · React Native · NestJS · Firebase · AI Agent Pipelines",
      note: "Fintech & lending platform for the agricultural sector.",
      lvl: 5,
      status: "NOW PLAYING" as const,
      bullets: [
        "Lead technical development of the definitive financial and lending ecosystem for the agricultural sector, integrating credit solutions with the country's major banks.",
        "Co-created the company's internal automated development methodology: a flow that extracts user stories (Linear/Jira), generates technical specs, and spins up ephemeral GitHub workspaces for autonomous code execution and E2E testing with Playwright.",
        "Collaborate strategically with Product and Design, translating business metrics into stable, scalable, data-driven technical solutions.",
      ],
    },
    {
      year: "20XX",
      company: "Telecentro · Tplay",
      role: "Multi-platform Engineer",
      tech: "Vue.js · Cordova · Node · Native Bridges (Kotlin & Swift)",
      note: "Apps for Mobile, Web, Android TV, Tizen, WebOS & VIDAA OS.",
      lvl: 4,
      status: "CAMPAIGN CLEARED" as const,
      bullets: [
        "Structured and maintained the company's mass streaming platform, delivering on-demand content to thousands of users across Web, Mobile, Android TV, Tizen, WebOS, and VIDAA OS.",
        "Resolved high-complexity integrations with multiple DRM providers and external encryption services to secure real-time streaming distribution.",
        "Developed custom native modules in Kotlin and Swift to optimize video player performance within the hybrid environment.",
      ],
    },
    {
      year: "20XX",
      company: "AgroPro",
      role: "Full-stack Engineer",
      tech: "React Native · React · Laravel · Python · Postgres · GraphQL",
      note: "Postgres, Mongo & GraphQL data layer.",
      lvl: 3,
      status: "CAMPAIGN CLEARED" as const,
      bullets: [
        "Co-built from scratch the pioneering end-to-end management platform for agronomic producers in Argentina, digitalizing traditional paper-based workflows into a transactional environment.",
        "Designed an offline-first hybrid sync engine in the mobile app to enable loading and validation of critical work orders in rural areas with zero connectivity.",
        "Implemented algorithms to automate process improvement suggestions based on the producer's operational business data.",
      ],
    },
    {
      year: "20XX",
      company: "Hashme",
      role: "Mobile Engineer",
      tech: "React Native · Node · AWS",
      note: "Instagram metrics via Facebook SDK.",
      lvl: 2,
      status: "CAMPAIGN CLEARED" as const,
      bullets: [],
    },
    {
      year: "20XX",
      company: "Demedis",
      role: "Mobile Engineer",
      tech: "React Native · Laravel · Firebase",
      note: "Realtime health application.",
      lvl: 1,
      status: "CAMPAIGN CLEARED" as const,
      bullets: [],
    },
  ] as Experience[],
  links: {
    github:   "github.com/djmaam",
    linkedin: "linkedin.com/in/djmaam",
    web:      "marcosarrieta.ar",
  },
};

export type Skill = (typeof portfolio.skills)[number];
export type Stat  = (typeof portfolio.stats)[number];
export type Links = typeof portfolio.links;

// Hero sprite — 16×16 pixel map + color map
export const SP = [
  "................",
  ".....IIIIII.....",
  "....IHHHHHHII...",
  "...IHHHHHHHHHI..",
  "...IHSSSSSSSHI..",
  "...ISSSSSSSSSI..",
  "...ISWBSSSBWSI..",
  "...ISWBSSSBWSI..",
  "...ISSSSSSSSSI..",
  "...ISSKKKKKSSI..",
  "....ISSSSSSSI...",
  "...RRBBBBBBRR...",
  "..RRBBBLLBBBRR..",
  "..DDBBBLLBBBDD..",
  "..DD.PPPPPP.DD..",
  "...G.PP..PP.G...",
] as const;

export const cmap: Record<string, string> = {
  I: "#100a24",
  H: "#6b3fb0",
  S: "#f0c89a",
  W: "#ffffff",
  B: "#16102e",
  K: "#c77777",
  R: "#ff4d68",
  L: "#ffd24d",
  D: "#3a2f6e",
  P: "#2b2550",
  G: "#1b1530",
  ".": "transparent",
};
