// TEMA "ilustrasi": adegan bergaya ilustrasi vektor berlapis (latar + tokoh + infografis + coretan + caption besar).
// Aktif bila scenes.src.json punya  "style": "explainer"  dan  "theme": "ilustrasi".  Dipanggil dari Explainer.tsx.
// Seni (tokoh, latar, partikel, tanda coretan) ada di ilustrasi_art.tsx; blok infografis memakai blocks.tsx yang sama dengan tema lain.
//
// Field adegan (semua opsional kecuali title/start):
//   bg       "kamar" | "jalan" | "grid" | "studio"  atau  path gambar ("img/bg01.png")      (bawaan: bergantian / data.bg)
//   chars    [{ who: "nara"|"bimo"|"sari"|"doni"|nama di data.cast, x: 0-1, pose, expr, acc, hat, flip, scale, talk }]
//   stage    blok infografis yang sama dengan tema lain (compare, list, kpi, phone, icons, dialog, ...)
//   marks    [{ type: circle|underline|arrow|check|cross|magnifier, x, y (0-1), w, h, x2, y2, word | at, color }]
//   bubbles  [{ text, x, y (0-1), word | at, tone }]        badge { n, text, small }      big { text, word, color }
//   pops     objek pelengkap (sama seperti tema lain)       cam / kick / roll / cut / transition ("fade" | "whip" | "none")
//   rays, dust, fg   true/false   sinar cahaya, debu, tanaman depan buram (bawaan menurut latar)
import { AbsoluteFill, Audio, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";
import { FONT, easeIO } from "./config";
import { PopLayer } from "./overlays";
import { StageItem } from "./blocks";
import { Ctx, clamp01, fallbackWords, norm } from "./ui";
import { BG_PRESETS, DEFAULT_CAST, Dust, MarkArt, OUT, Person, Plants, Rays } from "./ilustrasi_art";
import type { PersonDef } from "./ilustrasi_art";
import type { BadgeSpec, BigSpec, BubbleSpec, CharSpec, Data, MarkSpec, Scene, W } from "./types";

const YELLOW = "#ffc933";
const FEET_Y = 1400; // garis kaki tokoh
const FADE_SEC = 0.2;
const WHIP_SEC = 0.35;
const CAM_AMP = { off: 0, soft: 0.045, dynamic: 0.085 } as const;
const KICK_SEC = 0.25;
const BG_CYCLE = ["kamar", "jalan"];

const wordTime = (ws: W[], word: string | undefined, at: number | undefined, base: number, fb: number): number => {
  if (typeof at === "number") return base + Math.max(0, at);
  const k = word ? norm(word) : "";
  const hit = k ? ws.find((w) => norm(w.w).startsWith(k)) : undefined;
  return hit ? hit.a : base + fb;
};

const groupsOfN = (words: W[], n: number): W[][] => {
  const g: W[][] = [];
  let cur: W[] = [];
  words.forEach((w) => {
    if (cur.length && (cur.length >= n || cur[0].s !== w.s)) { g.push(cur); cur = []; }
    cur.push(w);
    if (/[.?!,]$/.test(w.w)) { g.push(cur); cur = []; }
  });
  if (cur.length) g.push(cur);
  return g;
};

const strokeText = (px: number): React.CSSProperties => ({ WebkitTextStroke: `${px}px ${OUT}`, paintOrder: "stroke fill" } as React.CSSProperties);

// ---------- caption besar di bawah: 2-3 kata sekaligus, kata kunci kuning ----------
const Caption: React.FC<{ words: W[]; t: number }> = ({ words, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const groups = React.useMemo(() => groupsOfN(words, 3), [words]);
  let gi = -1;
  for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].a - 0.05) gi = i;
  if (gi < 0) return null;
  const g = groups[gi];
  if (t > g[g.length - 1].b + 0.45) return null;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1500, height: 200, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: "0 20px", textAlign: "center", fontFamily: FONT, fontSize: 78, fontWeight: 800, lineHeight: 1.12, textTransform: "uppercase", letterSpacing: 1, textShadow: "0 8px 0 rgba(0,0,0,.28)" }}>
      {g.map((w, i) => {
        const s = clamp01(spring({ frame: frame - Math.round(w.a * fps), fps, config: { damping: 13, stiffness: 240 } }));
        return (
          <span key={i} style={{ display: "inline-block", opacity: s > 0.02 ? clamp01(s * 2) : 0, transform: `translateY(${(1 - s) * 26}px) scale(${0.88 + 0.12 * s})`, color: w.hl ? YELLOW : "#ffffff", ...strokeText(11) }}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- lencana "INI NAMANYA (3) RISET PESAING" ----------
const Badge: React.FC<{ b: BadgeSpec; t0: number }> = ({ b, t0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = clamp01(spring({ frame: frame - Math.round(t0 * fps), fps, config: { damping: 13, stiffness: 190 } }));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `translateY(${(1 - s) * -90}px)`, opacity: clamp01(s * 2), fontFamily: FONT }}>
      {b.small ? <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: 1, ...strokeText(8) }}>{b.small}</div> : null}
      <div style={{ display: "flex", alignItems: "center", background: "#17346e", border: `5px solid ${OUT}`, borderRadius: 64, paddingRight: 40, boxShadow: "0 8px 0 rgba(0,0,0,.28)" }}>
        {b.n !== undefined ? (
          <div style={{ width: 86, height: 86, borderRadius: 43, background: YELLOW, border: `5px solid ${OUT}`, margin: "-8px 20px -8px -12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 800, color: OUT }}>{b.n}</div>
        ) : <div style={{ width: 30 }} />}
        <div style={{ fontSize: 50, fontWeight: 800, color: "#fff", padding: "14px 0" }}>{b.text}</div>
      </div>
    </div>
  );
};

// ---------- balon kata ----------
const Bubble: React.FC<{ b: BubbleSpec; ws: W[]; base: number; i: number }> = ({ b, ws, base, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = wordTime(ws, b.word, b.at, base, 0.5 + i * 0.3);
  const s = clamp01(spring({ frame: frame - Math.round(t0 * fps), fps, config: { damping: 9, stiffness: 200 } }));
  if (frame < Math.round(t0 * fps)) return null;
  const bg = b.tone === "yellow" ? YELLOW : "#ffffff";
  return (
    <div style={{ position: "absolute", left: (b.x ?? 0.5) * 1080, top: (b.y ?? 0.45) * 1920, transform: `translate(-50%,-100%) scale(${s}) rotate(${(i % 2 ? 1 : -1) * 2}deg)`, transformOrigin: "50% 100%", fontFamily: FONT }}>
      <div style={{ background: bg, border: `6px solid ${OUT}`, borderRadius: 34, padding: "14px 34px", fontSize: 56, fontWeight: 800, color: OUT, whiteSpace: "nowrap", boxShadow: "0 8px 0 rgba(0,0,0,.25)" }}>{b.text}</div>
      <div style={{ width: 34, height: 34, background: bg, borderRight: `6px solid ${OUT}`, borderBottom: `6px solid ${OUT}`, transform: "translate(-50%,-22px) rotate(45deg)", marginLeft: "50%", marginBottom: -12 }} />
    </div>
  );
};

// ---------- teks besar ("JADI KAYA!") ----------
const Big: React.FC<{ b: BigSpec; ws: W[]; base: number }> = ({ b, ws, base }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = wordTime(ws, b.word, undefined, base, 0.25);
  if (frame < Math.round(t0 * fps)) return null;
  const s = spring({ frame: frame - Math.round(t0 * fps), fps, config: { damping: 8, stiffness: 170 } });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 520, textAlign: "center", fontFamily: FONT, fontSize: 168, fontWeight: 800, lineHeight: 1, color: b.color || "#e5252a", transform: `scale(${Math.max(0, s)}) rotate(-4deg)`, textTransform: "uppercase", textShadow: "0 12px 0 rgba(0,0,0,.3)", ...strokeText(20) }}>
      {b.text}
    </div>
  );
};

// ---------- tanda coretan yang digambar saat kata diucapkan ----------
const Marks: React.FC<{ marks: MarkSpec[]; ws: W[]; base: number; t: number; frame: number }> = ({ marks, ws, base, t, frame }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {marks.map((m, i) => {
      const t0 = wordTime(ws, m.word, m.at, base, 0.4 + i * 0.35);
      if (t < t0) return null;
      const p = clamp01((t - t0) / (m.type === "magnifier" ? 0.9 : 0.45));
      return (
        <MarkArt key={i} type={m.type} x={m.x * 1080} y={m.y * 1920} w={(m.w ?? 0.3) * 1080} h={m.h !== undefined ? m.h * 1920 : undefined}
          x2={m.x2 !== undefined ? m.x2 * 1080 : undefined} y2={m.y2 !== undefined ? m.y2 * 1920 : undefined} p={p} f={frame} color={m.color} />
      );
    })}
  </svg>
);

// ---------- kamera pelan (zoom) + guncangan pada kata pemicu ----------
const camFor = (data: Data, s: Scene, i: number, ws: W[], t: number, frame: number, p: number): React.CSSProperties => {
  const mode = data.camMode ?? "soft";
  const amp = CAM_AMP[mode];
  const how = s.cam ?? (mode === "off" ? "none" : i % 2 === 0 ? "push" : "pull");
  const k = how === "push" ? p : how === "pull" ? 1 - p : 0;
  let kd = 0;
  if (s.kick) {
    const key = typeof s.kick === "string" ? norm(s.kick) : "";
    const hit = key ? ws.find((w) => norm(w.w).startsWith(key)) : ws.find((w) => w.hl);
    const lf = t - (hit ? hit.a : s.start + 0.12);
    if (lf >= 0 && lf < KICK_SEC) kd = Math.pow(1 - lf / KICK_SEC, 2);
  }
  const z = 1 + amp * k + 0.035 * kd;
  const tx = (i % 2 ? -1 : 1) * k * amp * 200 + Math.sin(frame * 2.7) * 14 * kd;
  const ty = Math.cos(frame * 3.1) * 10 * kd;
  return { position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "50% 72%", transform: `translate(${tx}px, ${ty}px) scale(${z})` };
};

const slotsFor = (n: number) => (n <= 1 ? [0.5] : n === 2 ? [0.3, 0.7] : [0.2, 0.5, 0.8]);
const scaleFor = (n: number) => (n <= 1 ? 1.4 : n === 2 ? 1.18 : 1.0);
const charKey = (c: CharSpec, x: number) => `${c.who || "nara"}@${Math.round(x * 10)}`;

export const IlustrasiStory: React.FC<{ name: string; data: Data }> = ({ name, data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;
  const accent = data.accent || YELLOW;

  let idx = 0;
  data.scenes.forEach((s, i) => { if (t >= s.start - 1e-6) idx = i; });
  const sc = data.scenes[idx];
  const base = sc.start;
  const isWhip = idx > 0 && sc.transition === "whip" && !sc.cut;
  const fade = idx > 0 && !sc.cut && !isWhip ? clamp01((t - base) / FADE_SEC) : 1;
  const wq = isWhip ? clamp01((t - base) / WHIP_SEC) : 1;
  const we = easeIO(wq);

  const allWords: W[] = data.words && data.words.length ? data.words : data.scenes.flatMap((s, i) => fallbackWords(s.title, s.start, i));
  const wordsOf = (i: number): W[] => {
    const fw = allWords.filter((w) => w.s === i);
    return fw.length ? fw : fallbackWords(data.scenes[i].title, data.scenes[i].start, i);
  };
  const talkNow = data.env ? data.env[Math.min(data.env.length - 1, frame)] ?? 0 : 0;
  const bgCycle = (data.backgrounds || []).filter((n) => BG_PRESETS[n]);

  const layer = (i: number, wrap: React.CSSProperties, op: number) => {
    const s = data.scenes[i];
    const prev = i > 0 ? data.scenes[i - 1] : undefined;
    const ws = wordsOf(i);
    const sceneEnd = i + 1 < data.scenes.length ? data.scenes[i + 1].start : total;
    const p = clamp01((t - s.start) / Math.max(0.5, sceneEnd - s.start));
    const bgName = s.bg || (bgCycle.length ? bgCycle[i % bgCycle.length] : BG_CYCLE[Math.floor(i / 3) % BG_CYCLE.length]);
    const Preset = BG_PRESETS[bgName];
    const isImg = !Preset && /[./]/.test(bgName);
    const chars = s.chars || [];
    const xs = slotsFor(chars.length);
    const cs = scaleFor(chars.length);
    const speaker = s.speaker ?? 0;
    const showRays = s.rays ?? (bgName === "kamar" || bgName === "studio");
    const showFg = s.fg ?? (bgName === "kamar" || bgName === "jalan");
    const showDust = s.dust ?? bgName !== "grid";
    const hasChars = chars.length > 0;
    const blocks = s.stage || [];
    const ctx = { ws, base: s.start, t, accent, name, ink: "#16161a", mute: "#6b665c", theme: "clean" as const };
    const stageBox: React.CSSProperties = hasChars
      ? { position: "absolute", left: 60, right: 60, top: 120, height: 650, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, transform: `scale(${s.stageScale ?? 0.78})`, transformOrigin: "50% 0%" }
      : { position: "absolute", left: 60, right: 60, top: 140, bottom: 560, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, transform: s.stageScale ? `scale(${s.stageScale})` : undefined };
    const ent = clamp01(spring({ frame: frame - Math.round(s.start * fps), fps, config: { damping: 14 } }));
    return (
      <Ctx.Provider key={"L" + i} value={ctx}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden", background: "#1a1740", opacity: op, ...wrap }}>
          <div style={camFor(data, s, i, ws, t, frame, p)}>
            {Preset ? <Preset f={frame} /> : isImg ? <Img src={staticFile(`${name}/${bgName}`)} style={{ width: 1080, height: 1920, objectFit: "cover" }} /> : <BG_PRESETS.kamar f={frame} />}
            {showRays ? <Rays f={frame} /> : null}
            {showDust ? <Dust f={frame} /> : null}
            {chars.map((c, ci) => {
              const x = c.x ?? xs[ci];
              const def: PersonDef = { ...(data.cast?.[c.who || "nara"] || DEFAULT_CAST[c.who || "nara"] || DEFAULT_CAST.nara), ...(c.hat ? { hat: c.hat } : {}) };
              const sc2 = (c.scale ?? 1) * cs;
              const persist = !!prev && (prev.chars || []).some((pc, pi) => charKey(pc, pc.x ?? slotsFor((prev.chars || []).length)[pi]) === charKey(c, x));
              const e = persist ? 1 : ent;
              const flip = c.flip ?? (chars.length > 1 && x > 0.55);
              const talk = c.talk === true || (c.talk === undefined && ci === speaker) ? talkNow : 0;
              return (
                <div key={ci} style={{ position: "absolute", left: x * 1080 - 200 * sc2, top: FEET_Y - 600 * sc2 + (1 - e) * 380, width: 400, height: 640, transformOrigin: "0 0", transform: `scale(${sc2})`, opacity: clamp01(e * 2.5) }}>
                  <Person def={def} pose={c.pose} expr={c.expr} acc={c.acc} f={frame} talk={talk} flip={flip} seed={ci + i} />
                </div>
              );
            })}
            {showFg ? <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, filter: "blur(9px)" }}><Plants f={frame} /></div> : null}
          </div>
          {blocks.length ? <div style={stageBox}>{blocks.map((b, bi) => <StageItem key={bi} b={b} i={bi} />)}</div> : null}
          {s.marks && s.marks.length ? <Marks marks={s.marks} ws={ws} base={s.start} t={t} frame={frame} /> : null}
          {s.pops && s.pops.length ? <PopLayer pops={s.pops} defaultY={hasChars ? 420 : 300} scale={1.3} /> : null}
          {(s.bubbles || []).map((b, bi) => <Bubble key={bi} b={b} ws={ws} base={s.start} i={bi} />)}
          {s.big ? <Big b={s.big} ws={ws} base={s.start} /> : null}
          {s.badge ? <Badge b={s.badge} t0={s.start + 0.05} /> : null}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: "radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(10,5,30,.38) 100%)" }} />
        </div>
      </Ctx.Provider>
    );
  };

  const ctaStart = durationInFrames - Math.round(2 * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1740", fontFamily: FONT }}>
      <Audio src={staticFile(name + "/mix.wav")} />
      {idx > 0 && (fade < 1 || isWhip) ? layer(idx - 1, isWhip ? { transform: `translateX(${-1080 * we}px)`, filter: `blur(${12 * Math.sin(Math.PI * wq)}px)` } : {}, 1) : null}
      {layer(idx, isWhip ? { transform: `translateX(${1080 * (1 - we)}px)`, filter: `blur(${12 * Math.sin(Math.PI * wq)}px)` } : {}, isWhip ? 1 : fade)}
      {isWhip && wq < 1 ? (
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.sin(Math.PI * wq) * 0.8 }}>
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={0} y={180 + i * 190} width={1080} height={5 + (i % 3) * 3} fill="#ffffff" opacity={0.55} transform={`translate(${((i * 331 + frame * 90) % 1400) - 300},0) scale(0.7,1)`} />)}
        </svg>
      ) : null}
      <Caption words={allWords} t={t} />
      {data.cta && data.showCta !== false && frame >= ctaStart ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 150 }}>
          <div style={{ padding: "20px 54px", borderRadius: 60, background: accent, color: OUT, fontWeight: 800, fontSize: 48, fontFamily: FONT, border: `5px solid ${OUT}`, boxShadow: "0 8px 0 rgba(0,0,0,.3)" }}>{data.cta}</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
