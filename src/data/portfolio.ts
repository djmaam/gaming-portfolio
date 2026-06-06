export const portfolio = {
  name: "MARCOS ARRIETA",
  handle: "djmaam",
  role: "Software Engineer & AI Orchestrator",
  location: "Argentina",
  about:
    "Tech enthusiast — a restless mind that always wants to solve problems. Focused on building solutions that help people and make their lives easier.",
  aboutNow:
    "Lately working with Spec-Driven Development and a lot of AI: orchestrating agents to solve problems through plans, skills and specs.",
  skills: [
    { group: "LANGUAGES", items: ["JavaScript", "TypeScript", "Kotlin", "Java", "Go", "C#"] },
    { group: "FRONTEND",  items: ["React Native", "Next.js", "Astro", "React", "Vue"] },
    { group: "BACKEND",   items: ["Node.js", "Nest.js", "Spring", "Laravel", "Python"] },
    { group: "AI / AGENTS", items: ["Claude Code", "Codex", "Antigravity", "SDD"] },
    { group: "CLOUD / OPS", items: ["AWS", "Google Cloud", "Firebase", "CI/CD", "GH Actions"] },
    { group: "DATA",      items: ["PostgreSQL", "MongoDB", "MySQL", "GraphQL"] },
  ],
  stats: [
    { label: "FRONTEND",        lvl: 95 },
    { label: "BACKEND",         lvl: 85 },
    { label: "MOBILE",          lvl: 92 },
    { label: "AI ORCHESTRATION", lvl: 88 },
    { label: "CLOUD / DEVOPS",  lvl: 80 },
  ],
  experience: [
    { year: "20XX", company: "Nera",              role: "Mobile & Web Engineer",      tech: "Next.js · React Native · NestJS · Firebase",  note: "Agtech platform built end to end." },
    { year: "20XX", company: "Telecentro · Tplay", role: "Multi-platform Engineer",   tech: "Vue.js · Cordova · Node",                      note: "Apps for Mobile, Web, Android TV, Tizen, WebOS & VIDAA OS." },
    { year: "20XX", company: "AgroPro",            role: "Full-stack Engineer",        tech: "React Native · React · Laravel · Python",      note: "Postgres, Mongo & GraphQL data layer." },
    { year: "20XX", company: "Hashme",             role: "Mobile Engineer",            tech: "React Native · Node · AWS",                    note: "Instagram metrics via Facebook SDK." },
    { year: "20XX", company: "Demedis",            role: "Mobile Engineer",            tech: "React Native · Laravel · Firebase",            note: "Realtime health application." },
  ],
  links: {
    github:   "github.com/djmaam",
    linkedin: "linkedin.com/in/djmaam",
    web:      "marcosarrieta.ar",
  },
} as const;

export type Experience = (typeof portfolio.experience)[number];
export type Skill      = (typeof portfolio.skills)[number];
export type Stat       = (typeof portfolio.stats)[number];
export type Links      = typeof portfolio.links;

// Hero sprite — 16×16 pixel map + color map (from dir-nes-epic.jsx)
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
