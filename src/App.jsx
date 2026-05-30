import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import "./styles.css";
import { P } from "./data/palette";
import { T, GROUPS, ALL_MATCHES, name, fl } from "./data/teams";
import {
  R32, R16, QF, SF, FINAL,
  LEFT_R32, RIGHT_R32, LEFT_R16, RIGHT_R16, LEFT_QF, RIGHT_QF, LEFT_SF, RIGHT_SF,
} from "./data/knockout";
import { loadPicks, savePicks, loadLastUser, saveLastUser, emptyPicks } from "./data/storage";

/* Troféu line-art — baseado no media kit "Marca Retrô 26". */
const Trophy = ({ stroke, fill = "none", width, height, className, transform }) => (
  <svg width={width} height={height} viewBox="0 0 200 200" className={className}
    xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <g transform={transform} fill="none" stroke={stroke} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M62 28 H138 V52 C138 88 118 108 100 112 C82 108 62 88 62 52 Z" fill={fill} />
      <path d="M62 40 C40 40 30 50 30 64 C30 82 46 92 64 92" />
      <path d="M138 40 C160 40 170 50 170 64 C170 82 154 92 136 92" />
      <line x1="100" y1="112" x2="100" y2="138" />
      <path d="M74 138 H126 L132 156 H68 Z" fill={fill} />
      <line x1="60" y1="170" x2="140" y2="170" strokeWidth="9" />
      <path d="M84 56 C84 70 92 80 100 84 C108 80 116 70 116 56" strokeWidth="5" opacity=".8" />
    </g>
  </svg>
);

/* Logo "26" com eco multicolor + troféu aninhado — do media kit. */
const Logo26 = () => {
  const fs = 224, cx = 300, cy = 300, step = 7;
  const trail = [P.green, P.blueSky, P.red];
  const face = P.creamWarm;
  const echoes = [];
  for (let i = trail.length; i >= 1; i--) {
    echoes.push(
      <text key={i} x={cx - step * i} y={cy + step * i} textAnchor="middle" className="num"
        fontSize={fs} fill={trail[i - 1]}>26</text>
    );
  }
  return (
    <svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg">
      <defs><style>{`.num{font-family:'Montserrat',sans-serif;font-weight:900;letter-spacing:-10px;dominant-baseline:middle;}`}</style></defs>
      <rect x="14" y="14" width="572" height="392" rx="34" fill={P.ink} />
      <g transform="translate(0,-30)">
        {echoes}
        <text x={cx} y={cy} textAnchor="middle" className="num" fontSize={fs} fill={face}>26</text>
        <g transform="translate(218,40) scale(0.62)">
          <Trophy stroke={P.creamWarm} />
        </g>
      </g>
    </svg>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [draft, setDraft] = useState(loadLastUser());
  const [tab, setTab] = useState("A");
  const [scores, setScores] = useState({});
  const [order, setOrder] = useState({});
  const [ko, setKo] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const dragRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const d = loadPicks(user);
    setScores(d.groupScores || {});
    setOrder(d.groupOrder || {});
    setKo(d.knockout || {});
    setLoading(false);
  }, [user]);

  const persist = (ns, no, nk) => {
    if (!user) return;
    clearTimeout(saveTimer.current);
    const payload = {
      ...emptyPicks(),
      displayName: user,
      groupScores: ns ?? scores,
      groupOrder: no ?? order,
      knockout: nk ?? ko,
    };
    saveTimer.current = setTimeout(() => {
      savePicks(user, payload);
      flashMsg("Salvo ✓");
    }, 450);
  };
  const flashMsg = (m) => { setToast(m); setTimeout(() => setToast(""), 1700); };
  const login = () => {
    const v = draft.trim();
    if (v.length >= 2) { setUser(v); saveLastUser(v); }
  };

  const setScore = (id, side, raw) => {
    const digits = String(raw).replace(/\D+/g, "");
    const v = digits === "" ? "" : Math.max(0, Math.min(99, parseInt(digits, 10)));
    const next = { ...scores, [id]: { ...(scores[id] || {}), [side]: v } };
    setScores(next); persist(next, order, ko);
  };

  const computeStandings = (g) => {
    const teams = GROUPS[g];
    const tbl = Object.fromEntries(teams.map((c) => [c, { c, P: 0, J: 0, GP: 0, GC: 0 }]));
    let anyScore = false;
    ALL_MATCHES.filter((m) => m.group === g).forEach((m) => {
      const s = scores[m.id];
      if (!s || s.h === "" || s.a === "" || s.h == null || s.a == null) return;
      anyScore = true;
      const h = tbl[m.home], a = tbl[m.away];
      h.J++; a.J++; h.GP += s.h; h.GC += s.a; a.GP += s.a; a.GC += s.h;
      if (s.h > s.a) h.P += 3; else if (s.h < s.a) a.P += 3; else { h.P++; a.P++; }
    });
    let sorted = teams.map((c) => tbl[c]).sort((x, y) =>
      y.P - x.P || (y.GP - y.GC) - (x.GP - x.GC) || y.GP - x.GP || x.c.localeCompare(y.c));
    const manualSel = (order[g] || []).filter((c) => teams.includes(c));
    if (manualSel.length) {
      const rest = teams.filter((c) => !manualSel.includes(c));
      sorted = [...manualSel, ...rest].map((c) => tbl[c]);
    }
    // grupo "decidido" se há placares OU uma seleção manual de quem passa
    sorted.decided = anyScore || manualSel.length > 0;
    sorted.manualSel = manualSel;
    return sorted;
  };

  // Modo "quem passa": alterna a seleção do time na ordem manual do grupo.
  const setAdvance = (g, code) => {
    const teams = GROUPS[g];
    const cur = (order[g] || []).filter((c) => teams.includes(c));
    let next;
    if (cur.includes(code)) next = cur.filter((c) => c !== code);
    else if (cur.length < 4) next = [...cur, code];
    else next = cur;
    const no = { ...order, [g]: next };
    setOrder(no); persist(scores, no, ko);
  };

  const onDragStart = (g, idx) => { dragRef.current = { g, idx }; };
  const onDrop = (g, idx) => {
    const d = dragRef.current;
    if (!d || d.g !== g || d.idx === idx) return;
    const cur = computeStandings(g).map((r) => r.c);
    const [moved] = cur.splice(d.idx, 1);
    cur.splice(idx, 0, moved);
    const next = { ...order, [g]: cur };
    setOrder(next); persist(scores, next, ko); dragRef.current = null;
  };

  const setKoScore = (id, field, raw) => {
    const digits = String(raw).replace(/\D+/g, "");
    const v = digits === "" ? "" : Math.max(0, Math.min(99, parseInt(digits, 10)));
    const cur = { ...(ko[id] || {}) };
    cur[field] = v;
    if (field === "h" || field === "a" || field === "hp" || field === "ap") delete cur.pick;
    const next = { ...ko, [id]: cur };
    setKo(next); persist(scores, order, next);
  };
  const pickWinner = (id, side) => {
    const cur = { ...(ko[id] || {}), pick: side };
    const next = { ...ko, [id]: cur };
    setKo(next); persist(scores, order, next);
  };

  const computeThirds = () => {
    const thirds = Object.keys(GROUPS).map((g) => {
      const st = computeStandings(g);
      const t = st[2];
      const played = !!st.decided;
      return { g, c: t.c, P: t.P, SG: t.GP - t.GC, GP: t.GP, J: t.J, played };
    });
    const ranked = [...thirds].sort((x, y) =>
      y.P - x.P || y.SG - x.SG || y.GP - x.GP || x.g.localeCompare(y.g));
    const anyPlayed = thirds.some((t) => t.played);
    const qualified = new Set(anyPlayed ? ranked.slice(0, 8).map((t) => t.g) : []);
    return { thirds, ranked, qualified, anyPlayed };
  };

  if (!user) {
    return (
      <div className="cw loginpage">
        <div className="loginbox">
          <Header />
          <p className="sub">Entre com um nome para guardar seus palpites.</p>
          <div className="login">
            <input className="inp" placeholder="Seu nome ou apelido…" value={draft}
              onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
            <button className="btn" onClick={login}>Jogar →</button>
          </div>
          <p className="note" style={{ marginTop: 28 }}>
            Cada nome guarda uma tabelinha própria neste navegador. Volte com o mesmo nome para continuar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cw">
      <div className="wrap">
        <TopBar user={user} tab={tab} setTab={setTab}
          onTrocar={() => { setUser(null); setDraft(""); saveLastUser(""); }} />
        {loading ? <div className="empty">Carregando sua tabelinha…</div>
          : tab === "BR" ? <Bracket user={user} standingsOf={computeStandings} thirdsData={computeThirds()} ko={ko} setKoScore={setKoScore} pickWinner={pickWinner} />
            : tab === "T3" ? <ThirdsView data={computeThirds()} />
              : <GroupView g={tab} standings={computeStandings(tab)} scores={scores}
                setScore={setScore} onDragStart={onDragStart} onDrop={onDrop} setAdvance={setAdvance} />}
      </div>
      <div className={`flash ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

function Header() {
  return (
    <div className="hd">
      <div className="eyebrow"><span className="rule" /><span className="kicker">Bolão da Copa</span><span className="rule" /></div>
      <div className="logo26"><Logo26 /></div>
      <h1 className="wordmark">Tabel<em>inha</em></h1>
    </div>
  );
}

function TopBar({ user, tab, setTab, onTrocar }) {
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brandmini">
          <Logo26 />
          <span className="wm">Tabel<em>inha</em></span>
        </div>
        <span className="userchip">{user}
          <button className="btn sm gold" onClick={onTrocar}>trocar</button>
        </span>
      </div>
      <div className="tabs compact">
        {Object.keys(GROUPS).map((g) => (
          <button key={g} className={`tab ${tab === g ? "on" : ""}`} onClick={() => setTab(g)}>{g}</button>
        ))}
        <button className={`tab thirds ${tab === "T3" ? "on" : ""}`} onClick={() => setTab("T3")}>3ºs</button>
        <button className={`tab cup ${tab === "BR" ? "on" : ""}`} onClick={() => setTab("BR")}>★ Mata-mata</button>
      </div>
    </div>
  );
}

function GroupView({ g, standings, scores, setScore, onDragStart, onDrop, setAdvance }) {
  const [over, setOver] = useState(-1);
  const [mode, setMode] = useState("res"); // "res" = placares | "pass" = quem passa
  const matches = ALL_MATCHES.filter((m) => m.group === g);
  const teams = GROUPS[g];
  const sel = standings.manualSel || [];
  const cls = (i) => (i === 0 ? "q1" : i === 1 ? "q2" : i === 2 ? "q3" : "");

  return (
    <div className="card">
      <div className="ch">
        <div className="gname">Grupo <b>{g}</b></div>
        <div className="modetoggle">
          <button className={`mt-btn ${mode === "res" ? "on" : ""}`} onClick={() => setMode("res")}>Resultados</button>
          <button className={`mt-btn ${mode === "pass" ? "on" : ""}`} onClick={() => setMode("pass")}>Quem passa</button>
        </div>
      </div>

      {mode === "pass" ? (
        <>
          <div className="passhint">Toque na ordem de classificação — as 2 primeiras avançam e a 3ª entra na disputa dos melhores 3ºs. Toque de novo p/ desmarcar.</div>
          {teams.map((c) => {
            const idx = sel.indexOf(c);
            const pcls = idx === 0 ? "q1" : idx === 1 ? "q2" : idx === 2 ? "q3" : "";
            return (
              <div key={c} className={`row passrow ${pcls}`} onClick={() => setAdvance(g, c)}>
                <div className="pos">{idx >= 0 ? idx + 1 : "·"}</div>
                <div className="team"><span className="fl">{fl(c)}</span><span className="nm">{name(c)}</span></div>
                <div className="passbadge">
                  {idx === 0 || idx === 1 ? <span className="badge-in">classificado</span>
                    : idx === 2 ? <span className="badge-3">3º lugar</span>
                      : <span className="badge-pick">tocar p/ escolher</span>}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
          <div className="hcol">
            <span>#</span><span style={{ textAlign: "left" }}>Seleção</span>
            <span>J</span><span>GP</span><span>SG</span><span>GC</span><span>Pts</span>
          </div>
          {standings.map((r, i) => {
            const sg = r.GP - r.GC;
            return (
              <div key={r.c} className={`row ${cls(i)} ${over === i ? "over" : ""}`} draggable
                onDragStart={() => onDragStart(g, i)}
                onDragOver={(e) => { e.preventDefault(); setOver(i); }}
                onDragLeave={() => setOver(-1)}
                onDrop={() => { onDrop(g, i); setOver(-1); }}>
                <div className="pos">{i + 1}</div>
                <div className="team"><span className="fl">{fl(r.c)}</span><span className="nm">{name(r.c)}</span></div>
                <div className="st">{r.J}</div>
                <div className="st">{r.GP}</div>
                <div className="st">{sg > 0 ? "+" + sg : sg}</div>
                <div className="st">{r.GC}</div>
                <div className="st pts">{r.P}</div>
              </div>
            );
          })}
          <div className="mh">Jogos — anote os placares</div>
          {matches.map((m) => {
            const s = scores[m.id] || {};
            return (
              <div key={m.id} className="match">
                <div className="mt r"><span className="nm">{name(m.home)}</span><span className="fl">{fl(m.home)}</span></div>
                <div className="score">
                  <input className="sc" type="text" inputMode="numeric" maxLength={2} value={s.h ?? ""} placeholder="-"
                    onChange={(e) => setScore(m.id, "h", e.target.value)} />
                  <span className="vs">×</span>
                  <input className="sc" type="text" inputMode="numeric" maxLength={2} value={s.a ?? ""} placeholder="-"
                    onChange={(e) => setScore(m.id, "a", e.target.value)} />
                </div>
                <div className="mt"><span className="fl">{fl(m.away)}</span><span className="nm">{name(m.away)}</span></div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ---------- resolução de slots ---------- */
function resolveSlot(label, standingsOf) {
  const m = label.match(/^([12])([A-L])$/);
  if (!m) return null;
  const pos = +m[1] - 1, g = m[2];
  const st = standingsOf(g);
  if (!st.decided) return null;
  return st[pos]?.c || null;
}
function isThird(label) { return typeof label === "string" && label.startsWith("3:"); }
function thirdOrigins(label) { return isThird(label) ? label.slice(2).split("") : null; }

function allocateThirds(thirdsData) {
  const map = {};
  if (!thirdsData || !thirdsData.anyPlayed) return map;
  const pool = thirdsData.ranked.filter((t) => thirdsData.qualified.has(t.g)).map((t) => ({ g: t.g, c: t.c }));
  const used = new Set();
  R32.forEach((mt) => {
    [["a", mt.a], ["b", mt.b]].forEach(([side, label]) => {
      const origins = thirdOrigins(label);
      if (!origins) return;
      let chosen = pool.find((t) => !used.has(t.g) && origins.includes(t.g));
      if (!chosen) chosen = pool.find((t) => !used.has(t.g));
      if (chosen) { map[`${mt.n}${side}`] = chosen.c; used.add(chosen.g); }
    });
  });
  return map;
}

function winnerOf(rec, a, b) {
  if (!a || !b || !rec) return null;
  if (rec.pick === "h") return a;
  if (rec.pick === "a") return b;
  const { h, a: av, hp, ap } = rec;
  if (h === "" || av === "" || h == null || av == null) return null;
  if (h > av) return a;
  if (av > h) return b;
  if (hp === "" || ap === "" || hp == null || ap == null) return null;
  if (hp > ap) return a;
  if (ap > hp) return b;
  return null;
}

function needPens(rec, a, b) {
  if (!a || !b || !rec) return false;
  const { h, a: av } = rec;
  return h !== "" && av !== "" && h != null && av != null && +h === +av;
}

/* ============================================================
   PÔSTER 70s — resume os palpites principais e gera um PNG
   ============================================================ */

// Resolve o chaveamento e devolve os palpites de destaque.
function summarizePicks(standingsOf, thirdsData, ko) {
  const thirdsMap = allocateThirds(thirdsData);
  const seedOf = (mt, side) => {
    const label = mt[side];
    return isThird(label) ? (thirdsMap[`${mt.n}${side}`] || null) : resolveSlot(label, standingsOf);
  };
  const W = {};
  R32.forEach((mt) => { W[mt.n] = winnerOf(ko[`m${mt.n}`], seedOf(mt, "a"), seedOf(mt, "b")); });
  [R16, QF, SF].forEach((defs) => defs.forEach((d) => { W[d.n] = winnerOf(ko[`m${d.n}`], W[d.a] ?? null, W[d.b] ?? null); }));
  const finalA = W[FINAL.a] ?? null, finalB = W[FINAL.b] ?? null;
  const champion = winnerOf(ko["m104"], finalA, finalB);
  const vice = champion ? (champion === finalA ? finalB : finalA) : null;
  const semis = [W[97], W[98], W[99], W[100]];
  return { champion, vice, finalA, finalB, semis };
}

const slugName = (s) =>
  String(s || "jogador").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "jogador";

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

// Ajusta o tamanho da fonte até o texto caber em "max" px.
function fitFont(ctx, text, max, size, tmpl) {
  let s = size; ctx.font = tmpl(s);
  while (ctx.measureText(text).width > max && s > 14) { s -= 2; ctx.font = tmpl(s); }
  return s;
}

function drawStripes(ctx, x, y, w, h) {
  const cols = [P.red, P.ocre, P.yellow, P.green, P.blueSky];
  const seg = w / cols.length;
  cols.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(x + i * seg, y, seg, h); });
}

// Camadas de "cartaz velho": sépia, vinheta, manchas, vincos, grão e moldura gasta.
function applyVintage(ctx, W, H) {
  // tom desbotado/sépia
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const sg = ctx.createLinearGradient(0, 0, 0, H);
  sg.addColorStop(0, "rgba(214,174,107,.12)");
  sg.addColorStop(.5, "rgba(255,255,255,0)");
  sg.addColorStop(1, "rgba(143,97,34,.18)");
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // vinheta escura nos cantos
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.74);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(40,26,8,.44)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // manchas de umidade/envelhecimento
  for (let i = 0; i < 16; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 22 + Math.random() * 95;
    const a = 0.04 + Math.random() * 0.07;
    const st = ctx.createRadialGradient(x, y, 0, x, y, r);
    st.addColorStop(0, `rgba(96,62,20,${a})`);
    st.addColorStop(1, "rgba(96,62,20,0)");
    ctx.fillStyle = st; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // vincos e arranhões
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const vertical = Math.random() < 0.5;
    ctx.strokeStyle = Math.random() < 0.5 ? "rgba(255,248,230,.30)" : "rgba(40,26,8,.16)";
    ctx.lineWidth = Math.random() < 0.85 ? 1 : 2;
    ctx.beginPath();
    if (vertical) { const x = Math.random() * W; ctx.moveTo(x, Math.random() * H * 0.3); ctx.lineTo(x + (Math.random() * 30 - 15), H * (0.6 + Math.random() * 0.4)); }
    else { const y = Math.random() * H; ctx.moveTo(Math.random() * W * 0.3, y); ctx.lineTo(W * (0.6 + Math.random() * 0.4), y + (Math.random() * 30 - 15)); }
    ctx.stroke();
  }
  ctx.restore();

  // grão (ruído pontilhado)
  const n = Math.floor((W * H) / 680);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.06)";
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  // moldura escura gasta
  ctx.strokeStyle = "rgba(24,24,24,.85)"; ctx.lineWidth = 10;
  ctx.strokeRect(26, 26, W - 52, H - 52);
  // tinta descascada na moldura (lascas cor de papel)
  ctx.fillStyle = P.cream;
  for (let i = 0; i < 70; i++) {
    const edge = Math.floor(Math.random() * 4); const s = 4 + Math.random() * 16;
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = 26; }
    else if (edge === 1) { x = Math.random() * W; y = H - 26; }
    else if (edge === 2) { x = 26; y = Math.random() * H; }
    else { x = W - 26; y = Math.random() * H; }
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }

  // cantos amassados
  ctx.fillStyle = "rgba(40,26,8,.18)";
  const corner = (cx, cy, dx, dy) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx, cy); ctx.lineTo(cx, cy + dy); ctx.closePath(); ctx.fill(); };
  corner(0, 0, 80, 80); corner(W, 0, -80, 80); corner(0, H, 80, -80); corner(W, H, -80, -80);
}

async function generatePoster(user, sum) {
  const W = 1080, H = 1500;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const SP = (px) => { try { ctx.letterSpacing = px + "px"; } catch { /* navegador antigo */ } };

  // fundo creme + vinheta torrada
  ctx.fillStyle = P.cream; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.08, 80, W / 2, H * 0.5, H);
  g.addColorStop(0, "rgba(237,221,184,.55)"); g.addColorStop(1, "rgba(143,97,34,.20)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  let img = null;
  try { img = await loadImage(`${import.meta.env.BASE_URL}taca.png`); } catch { /* sem imagem */ }
  try {
    await Promise.all([
      document.fonts.load("400 96px 'Anton'"),
      document.fonts.load("800 30px 'Montserrat'"),
      document.fonts.load("700 24px 'Montserrat'"),
    ]);
    await document.fonts.ready;
  } catch { /* usa fallback */ }

  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // kicker
  ctx.fillStyle = P.ocreDeep; ctx.font = "700 26px 'Montserrat'"; SP(6);
  ctx.fillText("BOLÃO DA COPA · 2026", W / 2, 72); SP(0);
  // título
  ctx.fillStyle = P.ink; ctx.font = "400 96px 'Anton'";
  ctx.fillText("TABELINHA", W / 2, 168);
  drawStripes(ctx, W / 2 - 260, 196, 520, 12);
  // subtítulo
  ctx.fillStyle = P.ink; ctx.font = "800 32px 'Montserrat'";
  ctx.fillText(`os palpites de ${user}`, W / 2, 252);

  // taça emoldurada (polaroid)
  const tw = 412, th = img ? tw * (img.height / img.width) : 560;
  const tx = (W - tw) / 2, ty = 292;
  ctx.fillStyle = P.creamWarm; ctx.fillRect(tx - 16, ty - 16, tw + 32, th + 32);
  ctx.lineWidth = 6; ctx.strokeStyle = P.ink; ctx.strokeRect(tx - 16, ty - 16, tw + 32, th + 32);
  if (img) {
    ctx.drawImage(img, tx, ty, tw, th);
    ctx.lineWidth = 3; ctx.strokeRect(tx, ty, tw, th);
  }
  let y = ty + th + 78;

  const nm = (code) => (code ? name(code) : "a definir");

  // faixa do campeão
  const bw = 840, bx = (W - bw) / 2;
  ctx.fillStyle = P.gold; ctx.fillRect(bx, y, bw, 134);
  ctx.lineWidth = 5; ctx.strokeStyle = P.ink; ctx.strokeRect(bx, y, bw, 134);
  ctx.fillStyle = P.ocreDeep; ctx.font = "700 24px 'Montserrat'"; SP(5);
  ctx.fillText("CAMPEÃO", W / 2, y + 42); SP(0);
  ctx.fillStyle = P.ink;
  fitFont(ctx, nm(sum.champion).toUpperCase(), bw - 60, 66, (s) => `400 ${s}px 'Anton'`);
  ctx.fillText(nm(sum.champion).toUpperCase(), W / 2, y + 110);
  y += 134 + 66;

  // vice
  ctx.fillStyle = P.ocreDeep; ctx.font = "700 22px 'Montserrat'"; SP(4);
  ctx.fillText("VICE-CAMPEÃO", W / 2, y); SP(0);
  ctx.fillStyle = P.ink;
  fitFont(ctx, nm(sum.vice).toUpperCase(), W - 160, 46, (s) => `400 ${s}px 'Anton'`);
  ctx.fillText(nm(sum.vice).toUpperCase(), W / 2, y + 52);
  y += 124;

  // semifinalistas (duas duplas)
  ctx.fillStyle = P.ocreDeep; ctx.font = "700 22px 'Montserrat'"; SP(4);
  ctx.fillText("SEMIFINALISTAS", W / 2, y); SP(0);
  ctx.fillStyle = P.ink; ctx.font = "800 30px 'Montserrat'";
  const l1 = `${nm(sum.semis[0])}   ·   ${nm(sum.semis[1])}`;
  const l2 = `${nm(sum.semis[2])}   ·   ${nm(sum.semis[3])}`;
  ctx.fillText(l1, W / 2, y + 46);
  ctx.fillText(l2, W / 2, y + 88);

  // rodapé
  drawStripes(ctx, W / 2 - 220, H - 96, 440, 10);
  ctx.fillStyle = "#6b655c"; ctx.font = "700 22px 'Montserrat'"; SP(3);
  ctx.fillText("EUA · MÉXICO · CANADÁ — 11 JUN A 19 JUL", W / 2, H - 50); SP(0);

  // ---- desgaste de cartaz antigo ----
  applyVintage(ctx, W, H);

  const url = c.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url; a.download = `tabelinha-${slugName(user)}.png`;
  document.body.appendChild(a); a.click(); a.remove();
}

// Escala o chaveamento para caber na largura disponível (telas largas),
// e desliga a escala quando o layout empilhado (mobile) assume.
function useBracketFit() {
  const stageRef = useRef(null);
  const bigRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width:1180px)").matches
  );
  const [fit, setFit] = useState({ s: 1, tx: 0, h: 0 });

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width:1180px)");
    const onMq = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onMq);

    const compute = () => {
      const big = bigRef.current, stage = stageRef.current;
      if (!big || !stage) return;
      if (mq.matches) { setFit({ s: 1, tx: 0, h: 0 }); return; }
      const natW = big.offsetWidth, natH = big.offsetHeight;
      const availW = stage.clientWidth - 16;
      // preenche a largura disponível (até o tamanho natural); a altura
      // rola normalmente — assim o chaveamento fica grande/legível no PC.
      const s = Math.min(1, availW / natW);
      const tx = Math.max(8, (stage.clientWidth - natW * s) / 2);
      setFit({ s, tx, h: natH * s });
    };
    if (!mq.matches) window.scrollTo({ top: 0 });
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    if (bigRef.current) ro.observe(bigRef.current);
    window.addEventListener("resize", compute);
    return () => { mq.removeEventListener("change", onMq); ro.disconnect(); window.removeEventListener("resize", compute); };
  }, []);

  return { stageRef, bigRef, isMobile, fit };
}

function Bracket({ user, standingsOf, thirdsData, ko, setKoScore, pickWinner }) {
  const { stageRef, bigRef, isMobile, fit } = useBracketFit();
  const [posterBusy, setPosterBusy] = useState(false);
  const makePoster = async () => {
    setPosterBusy(true);
    try { await generatePoster(user, summarizePicks(standingsOf, thirdsData, ko)); }
    finally { setPosterBusy(false); }
  };
  const thirdsMap = allocateThirds(thirdsData);
  const labelText = (label) => {
    if (isThird(label)) return `3º ${thirdOrigins(label).join("/")}`;
    const m = label.match(/^([12])([A-L])$/);
    return m ? `${m[1] === "1" ? "1º" : "2º"} ${m[2]}` : label;
  };
  const seedOf = (mt, side) => {
    const label = mt[side];
    if (isThird(label)) return thirdsMap[`${mt.n}${side}`] || null;
    return resolveSlot(label, standingsOf);
  };

  const W = {};
  const r32map = {};
  R32.forEach((mt) => {
    const a = seedOf(mt, "a"), b = seedOf(mt, "b");
    const rec = ko[`m${mt.n}`];
    const w = winnerOf(rec, a, b);
    r32map[mt.n] = { ...mt, a, b, la: labelText(mt.a), lb: labelText(mt.b), w };
    W[mt.n] = w;
  });
  const buildRound = (defs) => {
    const out = {};
    defs.forEach((d) => {
      const a = W[d.a] ?? null, b = W[d.b] ?? null;
      const rec = ko[`m${d.n}`];
      const w = winnerOf(rec, a, b);
      out[d.n] = { ...d, a, b, la: `Venc. ${d.a}`, lb: `Venc. ${d.b}`, w };
      W[d.n] = w;
    });
    return out;
  };
  const r16map = buildRound(R16);
  const qfmap = buildRound(QF);
  const sfmap = buildRound(SF);
  const finalA = W[FINAL.a] ?? null, finalB = W[FINAL.b] ?? null;
  const finalRec = ko["m104"];
  const champion = winnerOf(finalRec, finalA, finalB);

  const tie = (m, side) => (
    <Tie key={m.n} m={m} side={side} ko={ko} setKoScore={setKoScore} pickWinner={pickWinner} />
  );

  return (
    <div>
      <div className="koheader">
        <div className="kotitle">Rumo à <em>Taça</em></div>
        <button className="btn poster-btn" onClick={makePoster} disabled={posterBusy}>
          {posterBusy ? "Gerando…" : "📸 Gerar pôster dos palpites"}
        </button>
      </div>

      <div className="kowrap">
        <div className="kostage" ref={stageRef} style={isMobile ? undefined : { height: fit.h }}>
        <div className="kobig" ref={bigRef}
          style={isMobile ? undefined : {
            position: "absolute", top: 0, left: 0, transformOrigin: "top left",
            transform: `translateX(${fit.tx}px) scale(${fit.s})`,
          }}>
          <div className="kohalf left">
            <div className="kocol c0"><div className="colhint">16 avos</div>{LEFT_R32.map((n) => tie(r32map[n], "L"))}</div>
            <div className="kocol c1"><div className="colhint">Oitavas</div>{LEFT_R16.map((n) => tie(r16map[n], "L"))}</div>
            <div className="kocol c2"><div className="colhint">Quartas</div>{LEFT_QF.map((n) => tie(qfmap[n], "L"))}</div>
            <div className="kocol c3"><div className="colhint">Semi</div>{tie(sfmap[LEFT_SF], "L")}</div>
          </div>

          <div className="cup">
            <div className="poster">
              <span className="pin" />
              <div className="frame"><img src={`${import.meta.env.BASE_URL}taca.png`} alt="Taça da Copa do Mundo — pôster retrô" loading="lazy" /></div>
              <div className="plabel"><span className="tag">{champion ? name(champion) : "A Taça"}</span><span className="dt">Final · 19 jul</span></div>
            </div>
            <div className="finalbox">
              <div className="ft">A Grande Final</div>
              <FinalSlot code={finalA} side="h" id="m104" ko={ko} pickWinner={pickWinner} other={finalB} />
              <div className="finrow">
                <input className="sc fin" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={ko.m104?.h ?? ""} onChange={(e) => setKoScore("m104", "h", e.target.value)} />
                <span className="vs">×</span>
                <input className="sc fin" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={ko.m104?.a ?? ""} onChange={(e) => setKoScore("m104", "a", e.target.value)} />
              </div>
              {needPens(ko.m104, finalA, finalB) && (
                <div className="pens">pênaltis
                  <input className="sc pk" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={ko.m104?.hp ?? ""} onChange={(e) => setKoScore("m104", "hp", e.target.value)} />
                  <span className="vs">×</span>
                  <input className="sc pk" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={ko.m104?.ap ?? ""} onChange={(e) => setKoScore("m104", "ap", e.target.value)} />
                </div>
              )}
              <FinalSlot code={finalB} side="a" id="m104" ko={ko} pickWinner={pickWinner} other={finalA} />
              {champion && <div className="champ">🏆 {name(champion)} campeã!</div>}
            </div>
          </div>

          <div className="kohalf right">
            <div className="kocol c3"><div className="colhint">Semi</div>{tie(sfmap[RIGHT_SF], "R")}</div>
            <div className="kocol c2"><div className="colhint">Quartas</div>{RIGHT_QF.map((n) => tie(qfmap[n], "R"))}</div>
            <div className="kocol c1"><div className="colhint">Oitavas</div>{RIGHT_R16.map((n) => tie(r16map[n], "R"))}</div>
            <div className="kocol c0"><div className="colhint">16 avos</div>{RIGHT_R32.map((n) => tie(r32map[n], "R"))}</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function Tie({ m, ko, setKoScore, pickWinner }) {
  const id = `m${m.n}`;
  const rec = ko[id] || {};
  const w = m.w;
  const ready = m.a && m.b;
  const slot = (code, label, which) => {
    const isWin = w && w === code;
    return (
      <div className={`slot ${isWin ? "win" : ""} ${code ? "clk" : ""}`}
        onClick={() => code && ready && pickWinner(id, which)}>
        <span className="fl">{code ? fl(code) : "🏳️"}</span>
        <span className={`nm ${code ? "" : "ph"}`}>{code ? name(code) : label}</span>
        {isWin && <span className="chk">✓</span>}
      </div>
    );
  };
  return (
    <div className={`tie ko ${ready ? "" : "pending"}`}>
      {slot(m.a, m.la, "h")}
      <div className="koscore">
        <input className="sc mini" type="text" inputMode="numeric" maxLength={2} placeholder="-" disabled={!ready}
          value={rec.h ?? ""} onChange={(e) => setKoScore(id, "h", e.target.value)} />
        <span className="vs">×</span>
        <input className="sc mini" type="text" inputMode="numeric" maxLength={2} placeholder="-" disabled={!ready}
          value={rec.a ?? ""} onChange={(e) => setKoScore(id, "a", e.target.value)} />
        {needPens(rec, m.a, m.b) && (
          <span className="penmini">
            <input className="sc pk" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={rec.hp ?? ""} onChange={(e) => setKoScore(id, "hp", e.target.value)} />
            <span className="pkx">pên</span>
            <input className="sc pk" type="text" inputMode="numeric" maxLength={2} placeholder="-" value={rec.ap ?? ""} onChange={(e) => setKoScore(id, "ap", e.target.value)} />
          </span>
        )}
      </div>
      {slot(m.b, m.lb, "a")}
    </div>
  );
}

function FinalSlot({ code, side, id, ko, pickWinner, other }) {
  const rec = ko[id] || {};
  const w = winnerOf(rec, side === "h" ? code : other, side === "h" ? other : code);
  const isWin = w && w === code;
  const ready = code && other;
  return (
    <div className={`fin-slot ${code ? "" : "ph"} ${isWin ? "win" : ""} ${code ? "clk" : ""}`}
      onClick={() => code && ready && pickWinner(id, side)}>
      {code ? (<><span className="fl">{fl(code)}</span> {name(code)}{isWin && " ✓"}</>)
        : (side === "h" ? "Finalista da esquerda" : "Finalista da direita")}
    </div>
  );
}

function ThirdsView({ data }) {
  const { ranked, qualified, anyPlayed } = data;
  return (
    <div className="t3wrap">
      <div className="koheader"><div className="kotitle">Os 8 melhores <em>3ºs</em></div></div>
      <p className="note">
        <b>Regra da FIFA.</b> Entre os 12 terceiros colocados, os <b>8 melhores</b> avançam ao mata-mata
        (critérios: pontos, saldo de gols, gols marcados). Eles preenchem os slots de terceiro do
        chaveamento automaticamente, conforme as origens permitidas de cada confronto.
      </p>
      {!anyPlayed ? (
        <div className="empty">Preencha os jogos dos grupos para ver os terceiros colocados.</div>
      ) : (
        <div className="card t3card">
          <div className="ch"><div className="gname">Classificação dos <b>3ºs</b></div>
            <div className="hint">8 primeiros avançam</div></div>
          <div className="hcol t3h">
            <span>#</span><span style={{ textAlign: "left" }}>Seleção</span><span>Gr.</span>
            <span>Pts</span><span>SG</span><span>GP</span><span></span>
          </div>
          {ranked.map((t, i) => {
            const q = qualified.has(t.g);
            return (
              <div key={t.g} className={`row t3row ${q ? "q3" : "out3"}`}>
                <div className="pos">{i + 1}</div>
                <div className="team"><span className="fl">{fl(t.c)}</span><span className="nm">{name(t.c)}</span></div>
                <div className="st" style={{ fontWeight: 800 }}>{t.g}</div>
                <div className="st pts">{t.P}</div>
                <div className="st">{t.SG > 0 ? "+" + t.SG : t.SG}</div>
                <div className="st">{t.GP}</div>
                <div className="st">{q ? <span className="badge-in">classificado</span> : <span className="badge-out">fora</span>}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
