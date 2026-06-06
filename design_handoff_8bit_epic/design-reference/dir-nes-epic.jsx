// Direction D — 8-BIT EPIC · full game screen
function NesEpicPortfolio() {
  const P = window.PORTFOLIO;
  const C = {
    bg0: "#070611", bg1: "#120a2a", panel: "#171033", panelHi: "#1f1644",
    ink: "#eef0ff", dim: "#8a86c4", faint: "#4a447e",
    red: "#ff4d68", blue: "#4d8bff", green: "#5fe08a", yellow: "#ffd24d",
    purple: "#b06bff", cyan: "#46e6e0", orange: "#ff9442", pink: "#ff7ad9",
  };
  const px = "'Press Start 2P', monospace";
  const body = "'Silkscreen', monospace";

  // ---- 16x16 hero sprite ----
  const SP = [
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
  ];
  const cmap = {
    I: "#100a24", H: "#6b3fb0", S: "#f0c89a", W: "#ffffff", B: "#16102e",
    K: "#c77", R: C.red, L: C.yellow, D: "#3a2f6e", P: "#2b2550", G: "#1b1530",
    ".": "transparent",
  };

  // ---- helpers ----
  const Panel = ({ col, label, children, style }) => (
    <div style={{ position: "relative", background: C.panel, padding: "16px 18px",
      boxShadow: `0 0 0 3px ${C.bg0}, 0 0 0 6px ${col}, 0 6px 0 6px rgba(0,0,0,.4)`, ...style }}>
      {label && (
        <div style={{ fontFamily: px, fontSize: 8, color: col, marginBottom: 14, letterSpacing: 1,
          display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, background: col, display: "inline-block" }} />{label}
        </div>
      )}
      {children}
    </div>
  );

  const stars = (window.__epicStars ||= Array.from({ length: 54 }, () => ({
    x: +(Math.random() * 100).toFixed(2), y: +(Math.random() * 100).toFixed(2),
    d: +(Math.random() * 3).toFixed(2), big: Math.random() < 0.22,
  })));

  const rarity = [
    { tag: "LEGENDARY", col: C.yellow }, { tag: "EPIC", col: C.purple },
    { tag: "EPIC", col: C.purple }, { tag: "RARE", col: C.cyan },
    { tag: "RARE", col: C.cyan }, { tag: "COMMON", col: C.green },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden",
      fontFamily: body, color: C.ink,
      background: `radial-gradient(120% 80% at 50% -10%, ${C.bg1} 0%, ${C.bg0} 60%)` }}>

      {/* starfield */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {stars.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x + "%", top: s.y + "%",
            width: s.big ? 4 : 2, height: s.big ? 4 : 2,
            background: i % 7 === 0 ? C.cyan : i % 5 === 0 ? C.pink : "#fff",
            opacity: 0.5, animation: `twinkle ${2 + (i % 4)}s steps(2) ${s.d}s infinite` }} />
        ))}
      </div>
      {/* scanlines + vignette */}
      <div style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none",
        background: "repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.18) 3px 4px)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none",
        boxShadow: "inset 0 0 120px 24px rgba(0,0,0,.7)" }} />

      <div style={{ position: "relative", zIndex: 4, padding: "22px 26px 30px" }}>

        {/* ===== TOP HUD BAR ===== */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22,
          fontFamily: px, fontSize: 9 }}>
          <span style={{ color: C.green }}>1UP</span>
          <span style={{ color: C.red }}>HP</span>
          <div style={{ flex: "0 0 120px", height: 12, background: "#231a44", boxShadow: `0 0 0 2px ${C.faint}` }}>
            <div style={{ width: "92%", height: "100%", background: `repeating-linear-gradient(90deg, ${C.red} 0 8px, #d83b54 8px 12px)`,
              backgroundSize: "12px 100%", animation: "barber .6s linear infinite" }} />
          </div>
          <span style={{ color: C.cyan }}>XP</span>
          <div style={{ flex: 1, height: 12, background: "#231a44", boxShadow: `0 0 0 2px ${C.faint}` }}>
            <div style={{ width: "78%", height: "100%", background: `repeating-linear-gradient(90deg, ${C.cyan} 0 8px, #2bb8b2 8px 12px)`,
              backgroundSize: "12px 100%", animation: "barber .6s linear infinite" }} />
          </div>
          <span style={{ color: C.yellow }}>★99</span>
          <span style={{ color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: C.yellow, display: "inline-block",
              boxShadow: `inset -2px -2px 0 ${C.orange}` }} />x∞
          </span>
        </div>

        {/* ===== TITLE ===== */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontFamily: px, fontSize: 11, color: C.cyan, letterSpacing: 3, marginBottom: 16 }}>★ ★ ★</div>
          <h1 style={{ margin: 0, fontFamily: px, fontSize: 40, lineHeight: 1.15, letterSpacing: 2, color: C.ink,
            textShadow: `4px 4px 0 ${C.purple}, 8px 8px 0 ${C.bg0}` }}>MARCOS<br />ARRIETA</h1>
          <div style={{ fontFamily: px, fontSize: 9, color: C.green, marginTop: 18, lineHeight: 1.6, letterSpacing: 1 }}>
            SOFTWARE&nbsp;ENGINEER &amp; AI&nbsp;ORCHESTRATOR
          </div>
          <div style={{ fontFamily: px, fontSize: 9, color: C.yellow, marginTop: 16,
            animation: "blink 1.1s steps(1) infinite" }}>▶ PRESS START ◀</div>
        </div>

        {/* ===== CHARACTER + STATS ===== */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, marginBottom: 20 }}>
          {/* character card */}
          <Panel col={C.green} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontFamily: px, fontSize: 8, color: C.green, alignSelf: "flex-start" }}>▶ PLAYER 1</div>
            <div style={{ position: "relative", animation: "floaty 2.4s ease-in-out infinite" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 12px)", gridTemplateRows: "repeat(16, 12px)" }}>
                {SP.flatMap((row, y) => row.split("").map((c, x) => (
                  <div key={`${x}-${y}`} style={{ background: cmap[c] || "transparent" }} />
                )))}
              </div>
            </div>
            <div style={{ width: 120, height: 14, background: "radial-gradient(ellipse, rgba(0,0,0,.55), transparent 70%)", marginTop: -6 }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: px, fontSize: 10, color: C.ink }}>@{P.handle}</div>
              <div style={{ fontSize: 15, color: C.yellow, marginTop: 8 }}>CLASS · FULL-STACK MAGE</div>
              <div style={{ fontSize: 14, color: C.dim }}>HOME · {P.location.toUpperCase()}</div>
            </div>
          </Panel>

          {/* stats */}
          <Panel col={C.red} label="ABILITY STATS">
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {P.stats.map((s) => {
                const blocks = Math.round(s.lvl / 10);
                return (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: C.ink }}>{s.label}</span>
                      <span style={{ color: C.yellow, fontFamily: px, fontSize: 8 }}>LV{Math.round(s.lvl / 5)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 14,
                          background: i < blocks ? (i < 6 ? C.green : i < 8 ? C.yellow : C.red) : "#241b46",
                          boxShadow: i < blocks ? "inset -2px -2px 0 rgba(0,0,0,.3)" : "none" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* ===== QUEST DIALOGUE (about) ===== */}
        <Panel col={C.blue} label="QUEST LOG · WHO AM I" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 auto", fontFamily: px, fontSize: 22, color: C.blue, marginTop: 2 }}>‹›</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 18, lineHeight: 1.55, color: C.ink }}>{P.about}</div>
              <div style={{ fontSize: 16, lineHeight: 1.55, color: C.yellow }}>
                ► {P.aboutNow}<span style={{ color: C.ink, animation: "blink 1s steps(1) infinite" }}> ▼</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* ===== SKILL TREE (inventory) ===== */}
        <Panel col={C.purple} label="SKILL TREE · INVENTORY" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {P.skills.map((s, i) => (
              <div key={s.group} style={{ background: C.panelHi, padding: "11px 12px",
                boxShadow: `0 0 0 2px ${rarity[i].col}`, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: rarity[i].col }}>◆ {s.group}</span>
                  <span style={{ fontFamily: px, fontSize: 6, color: rarity[i].col }}>{rarity[i].tag}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 6px" }}>
                  {s.items.map((it) => (
                    <span key={it} style={{ fontSize: 12.5, color: C.ink, background: "#0f0a26",
                      padding: "2px 6px", boxShadow: `0 0 0 1px ${C.faint}` }}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ===== WORLD MAP (experience) ===== */}
        <Panel col={C.yellow} label="WORLD MAP · CAREER STAGES" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {P.experience.map((e, i) => (
              <div key={e.company} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
                {/* node + connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 54 }}>
                  <div style={{ width: 40, height: 40, background: i === 0 ? C.green : C.panelHi,
                    boxShadow: `0 0 0 3px ${C.bg0}, 0 0 0 5px ${i === 0 ? C.green : C.faint}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: px, fontSize: 9, color: i === 0 ? C.bg0 : C.dim,
                    animation: i === 0 ? "pulseGlow 1.8s ease-in-out infinite" : "none" }}>
                    {String(P.experience.length - i)}
                  </div>
                  {i < P.experience.length - 1 && (
                    <div style={{ flex: 1, width: 4, minHeight: 26,
                      background: `repeating-linear-gradient(${C.faint} 0 5px, transparent 5px 10px)` }} />
                  )}
                </div>
                {/* card */}
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontFamily: px, fontSize: 11, color: C.ink }}>{e.company}</span>
                    <span style={{ fontFamily: px, fontSize: 7, color: i === 0 ? C.green : C.yellow }}>
                      {i === 0 ? "▶ NOW PLAYING" : "✓ CLEARED · " + e.year}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, color: C.cyan, marginTop: 7 }}>{e.role}</div>
                  <div style={{ fontSize: 13, color: C.dim, marginTop: 3 }}>{e.tech}</div>
                  <div style={{ fontSize: 13, color: C.faint, marginTop: 3 }}>{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ===== START MENU (contact) ===== */}
        <Panel col={C.cyan} label="START MENU · GET IN TOUCH">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[["GITHUB", P.links.github, C.green], ["LINKEDIN", P.links.linkedin, C.blue], ["WEBSITE", P.links.web, C.pink]].map(([k, v, col], i) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 12,
                background: i === 0 ? C.panelHi : "transparent", padding: "8px 10px",
                boxShadow: i === 0 ? `0 0 0 2px ${col}` : "none" }}>
                <span style={{ fontFamily: px, fontSize: 9, color: i === 0 ? C.yellow : "transparent",
                  animation: i === 0 ? "blink 1s steps(1) infinite" : "none" }}>►</span>
                <span style={{ fontFamily: px, fontSize: 9, color: col, minWidth: 110 }}>{k}</span>
                <span style={{ fontSize: 16, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ textAlign: "center", marginTop: 22, fontFamily: px, fontSize: 7, color: C.faint, letterSpacing: 1 }}>
          © 20XX MARCOS ARRIETA · INSERT COIN TO CONTINUE
        </div>
      </div>
    </div>
  );
}
window.NesEpicPortfolio = NesEpicPortfolio;
