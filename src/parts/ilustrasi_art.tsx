// SENI VEKTOR tema "ilustrasi": karakter (bagian bergerak: kedip, mulut, lengan, napas), latar bawaan, partikel debu, sinar cahaya,
// tanaman depan, dan tanda coretan (lingkaran, garis bawah, panah, centang, silang, kaca pembesar).
// Semua berupa fungsi MURNI (tanpa hook Remotion): hasil hanya bergantung pada props, jadi bisa dirender ke gambar untuk uji.
// Layar 1080x1920. Dipakai oleh src/parts/ilustrasi.tsx.
import React from "react";

export type PersonDef = {
  hair?: string; skin?: string; outfit?: string; trim?: string; shoes?: string;
  hairStyle?: "bun" | "bob" | "short" | "spiky" | "cap";
  dress?: boolean; // true = gaun, false = kemeja + celana
  glasses?: boolean; flower?: boolean; hat?: "detective" | "cap" | "none";
};
export type Pose = "idle" | "point" | "wave" | "think" | "cheer" | "hold" | "explain" | "shock" | "sad" | "search";
export type Expr = "neutral" | "happy" | "shock" | "sad" | "think" | "smile";

export const OUT = "#2a2140";
export const DEFAULT_CAST: Record<string, PersonDef> = {
  nara: { hair: "#6b3f2a", skin: "#f7cdaa", outfit: "#f2c230", trim: "#fff3c9", shoes: "#8a5a3b", hairStyle: "bun", dress: true, flower: true },
  bimo: { hair: "#2b2220", skin: "#e2a982", outfit: "#c0392b", trim: "#f5d0c8", shoes: "#2b2220", hairStyle: "short", dress: false, glasses: true },
  sari: { hair: "#1f1a1a", skin: "#c98b64", outfit: "#2a9d8f", trim: "#c8f0e8", shoes: "#3b2a22", hairStyle: "bob", dress: true },
  doni: { hair: "#4a3322", skin: "#f1c19c", outfit: "#3b6fd8", trim: "#d3e0fb", shoes: "#2b2220", hairStyle: "spiky", dress: false },
};

const d2r = (d: number) => (d * Math.PI) / 180;
const hand = (px: number, py: number, deg: number, len: number) => ({ x: px - Math.sin(d2r(deg)) * (len + 14), y: py + Math.cos(d2r(deg)) * (len + 14) });

// sudut lengan (derajat; 0 = ke bawah, + = berputar searah jarum jam) untuk tiap pose; R = lengan kanan di layar
const armsFor = (pose: Pose, f: number): { r: [number, number]; l: [number, number] } => {
  const w = Math.sin(f / 4);
  switch (pose) {
    case "point": return { r: [-98 + Math.sin(f / 9) * 3, 110], l: [8, 95] };
    case "wave": return { r: [-152 + w * 16, 96], l: [8, 95] };
    case "think": return { r: [136, 56], l: [10, 95] };
    case "cheer": return { r: [-158 + w * 5, 100], l: [158 - w * 5, 100] };
    case "hold": return { r: [66, 78], l: [-66, 78] };
    case "explain": return { r: [-62 + Math.sin(f / 11) * 6, 100], l: [28, 92] };
    case "shock": return { r: [-34 + Math.sin(f * 2.1) * 2, 96], l: [34 - Math.sin(f * 2.1) * 2, 96] };
    case "search": return { r: [-78 + Math.sin(f / 13) * 6, 82], l: [40, 80] };
    case "sad": return { r: [4, 96], l: [-4, 96] };
    default: return { r: [-7 + Math.sin(f / 30) * 2, 95], l: [7 - Math.sin(f / 30) * 2, 95] };
  }
};

const Arm: React.FC<{ px: number; py: number; deg: number; len: number; sleeve: string; skin: string }> = ({ px, py, deg, len, sleeve, skin }) => (
  <g transform={`translate(${px},${py}) rotate(${deg})`}>
    <line x1={0} y1={0} x2={0} y2={len} stroke={OUT} strokeWidth={36} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={len} stroke={sleeve} strokeWidth={27} strokeLinecap="round" />
    <circle cx={0} cy={len + 12} r={16} fill={skin} stroke={OUT} strokeWidth={5} />
  </g>
);

const Brow: React.FC<{ x: number; y: number; tilt: number; lift: number; flip?: boolean }> = ({ x, y, tilt, lift, flip }) => (
  <path d={`M ${x - 17} ${y - lift + tilt * (flip ? -1 : 1)} Q ${x} ${y - lift - 6} ${x + 17} ${y - lift - tilt * (flip ? -1 : 1)}`} stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
);

export const Person: React.FC<{
  def: PersonDef; pose?: Pose; expr?: Expr; f: number; talk?: number; flip?: boolean; seed?: number; acc?: "magnifier" | "phone" | "none";
}> = ({ def, pose = "idle", expr = "neutral", f, talk = 0, flip, seed = 0, acc = "none" }) => {
  const skin = def.skin || "#f7cdaa", hair = def.hair || "#3b2a22", outfit = def.outfit || "#f2c230", trim = def.trim || "#ffffff", shoes = def.shoes || "#5a3a28";
  const ff = f + seed * 17;
  const breathe = 1 + Math.sin(ff / 22) * 0.012;
  const bob = Math.sin(ff / 22) * 3;
  const blinkPhase = (ff + seed * 31) % 110;
  const blink = blinkPhase < 5 ? Math.abs(blinkPhase - 2.5) / 2.5 : 1; // 0..1, 1 = terbuka
  const arms = armsFor(pose, ff);
  const tilt = pose === "sad" ? 5 : pose === "think" ? -4 : Math.sin(ff / 40) * 1.2;
  const eyeY = 10, eyeX = 36;
  const open = Math.min(1, Math.max(0, talk));
  const lookX = expr === "think" ? -7 : 0, lookY = expr === "think" ? -6 : 0;
  const hp = hand(250, 355, arms.r[0], arms.r[1]);
  const mouth =
    open > 0.12 ? (
      <g>
        <ellipse cx={0} cy={52} rx={13 + open * 5} ry={4 + open * 15} fill="#5b1f2e" stroke={OUT} strokeWidth={4} />
        <ellipse cx={0} cy={52 + 2 + open * 9} rx={8} ry={3 + open * 3} fill="#e8798a" />
      </g>
    ) : expr === "shock" ? (
      <ellipse cx={0} cy={54} rx={11} ry={15} fill="#5b1f2e" stroke={OUT} strokeWidth={4} />
    ) : expr === "sad" ? (
      <path d="M -15 62 Q 0 46 15 62" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : expr === "happy" ? (
      <path d="M -22 46 Q 0 78 22 46 Z" fill="#5b1f2e" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    ) : (
      <path d="M -16 50 Q 0 64 16 50" stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />
    );
  const eyes = (sx: number) =>
    expr === "happy" ? (
      <path d={`M ${sx - 13} ${eyeY + 4} Q ${sx} ${eyeY - 14} ${sx + 13} ${eyeY + 4}`} stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
    ) : (
      <g transform={`translate(${sx + lookX},${eyeY + lookY}) scale(1,${expr === "shock" ? 1 : blink})`}>
        <ellipse cx={0} cy={0} rx={expr === "shock" ? 15 : 11} ry={expr === "shock" ? 19 : 14} fill={expr === "shock" ? "#fff" : OUT} stroke={OUT} strokeWidth={expr === "shock" ? 4 : 0} />
        {expr === "shock" ? <circle cx={0} cy={0} r={6} fill={OUT} /> : <circle cx={-3.5} cy={-5} r={4} fill="#fff" />}
      </g>
    );

  return (
    <svg viewBox="0 0 400 640" width={400} height={640} style={{ overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
      <ellipse cx={200} cy={606} rx={112} ry={15} fill="rgba(20,10,40,.22)" />
      <g transform={`translate(200,600) scale(1,${breathe}) translate(-200,-600)`}>
        {/* kaki dan sepatu */}
        {[165, 209].map((x) => (
          <g key={x}>
            <rect x={x} y={470} width={26} height={118} rx={12} fill={def.dress ? skin : outfit} stroke={OUT} strokeWidth={5} />
            <path d={`M ${x - 8} 598 Q ${x - 8} 578 ${x + 13} 578 Q ${x + 36} 578 ${x + 36} 598 Z`} fill={shoes} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
          </g>
        ))}
        {!def.dress ? <rect x={150} y={455} width={100} height={46} rx={14} fill="#2d3a63" stroke={OUT} strokeWidth={5} /> : null}
        {/* lengan belakang (kiri layar) */}
        <Arm px={150} py={355} deg={arms.l[0]} len={arms.l[1]} sleeve={outfit} skin={skin} />
        {/* badan */}
        {def.dress ? (
          <path d="M 152 338 L 248 338 Q 262 400 292 492 Q 200 520 108 492 Q 138 400 152 338 Z" fill={outfit} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
        ) : (
          <rect x={146} y={336} width={108} height={146} rx={30} fill={outfit} stroke={OUT} strokeWidth={6} />
        )}
        <path d="M 176 338 Q 200 366 224 338" fill={trim} stroke={OUT} strokeWidth={5} />
        {def.dress ? <path d="M 124 470 Q 200 490 276 470" stroke={trim} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} /> : null}
        {/* leher */}
        <rect x={184} y={304} width={32} height={40} rx={10} fill={skin} stroke={OUT} strokeWidth={5} />
        {/* lengan depan (kanan layar) */}
        <Arm px={250} py={355} deg={arms.r[0]} len={arms.r[1]} sleeve={outfit} skin={skin} />
        {acc === "magnifier" ? (
          <g transform={`translate(${hp.x},${hp.y}) rotate(${pose === "search" ? -20 + Math.sin(ff / 9) * 12 : -20})`}>
            <line x1={0} y1={0} x2={0} y2={-34} stroke="#8a5a3b" strokeWidth={14} strokeLinecap="round" />
            <line x1={0} y1={-30} x2={0} y2={-52} stroke={OUT} strokeWidth={4} strokeLinecap="round" opacity={0} />
            <circle cx={0} cy={-84} r={40} fill="rgba(190,225,255,.45)" stroke={OUT} strokeWidth={8} />
            <circle cx={0} cy={-84} r={40} fill="none" stroke="#9aa8c9" strokeWidth={3} />
            <path d="M -22 -96 Q -14 -112 2 -114" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
          </g>
        ) : null}
        {acc === "phone" ? (
          <g transform={`translate(${hp.x - 22},${hp.y - 70})`}>
            <rect x={0} y={0} width={46} height={82} rx={9} fill="#1c2a55" stroke={OUT} strokeWidth={5} />
            <rect x={6} y={8} width={34} height={58} rx={4} fill="#7fd6ff" />
          </g>
        ) : null}
        {/* kepala */}
        <g transform={`translate(200,${232 + bob}) rotate(${tilt})`}>
          {def.hairStyle === "bob" ? <path d="M -104 -6 Q -112 100 -78 112 L 78 112 Q 112 100 104 -6 Q 100 -112 0 -112 Q -100 -112 -104 -6 Z" fill={hair} stroke={OUT} strokeWidth={6} strokeLinejoin="round" /> : null}
          {def.hairStyle === "bun" ? <circle cx={0} cy={-104} r={36} fill={hair} stroke={OUT} strokeWidth={6} /> : null}
          {def.flower ? <g transform="translate(-6,-130)">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-10} rx={7} ry={10} fill="#fff" stroke={OUT} strokeWidth={3} transform={`rotate(${a})`} />)}<circle r={6} fill="#f2c230" stroke={OUT} strokeWidth={3} /></g> : null}
          <circle cx={-98} cy={14} r={15} fill={skin} stroke={OUT} strokeWidth={5} />
          <circle cx={98} cy={14} r={15} fill={skin} stroke={OUT} strokeWidth={5} />
          <ellipse cx={0} cy={0} rx={98} ry={90} fill={skin} stroke={OUT} strokeWidth={6} />
          {/* poni / rambut depan */}
          {def.hairStyle === "spiky" ? (
            <path d="M -98 -14 L -90 -78 L -62 -52 L -44 -106 L -16 -64 L 8 -112 L 30 -64 L 60 -98 L 72 -52 L 98 -76 L 98 -14 Q 60 -44 0 -52 Q -60 -44 -98 -14 Z" fill={hair} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
          ) : def.hairStyle === "short" || def.hairStyle === "cap" ? (
            <path d="M -98 -6 Q -104 -98 0 -98 Q 104 -98 98 -6 Q 70 -58 18 -52 Q -40 -48 -98 -6 Z" fill={hair} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
          ) : (
            <path d="M -98 -2 Q -102 -96 0 -96 Q 102 -96 98 -2 Q 76 -40 30 -46 Q 6 -22 -14 -50 Q -66 -44 -98 -2 Z" fill={hair} stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
          )}
          <ellipse cx={-60} cy={40} rx={16} ry={10} fill="#ff9aa8" opacity={0.5} />
          <ellipse cx={60} cy={40} rx={16} ry={10} fill="#ff9aa8" opacity={0.5} />
          {expr === "sad" ? <>{Brow({ x: -eyeX, y: -16, tilt: 8, lift: 0 })}{Brow({ x: eyeX, y: -16, tilt: 8, lift: 0, flip: true })}</> : null}
          {expr === "shock" ? <>{Brow({ x: -eyeX, y: -22, tilt: 0, lift: 12 })}{Brow({ x: eyeX, y: -22, tilt: 0, lift: 12 })}</> : null}
          {expr === "think" ? <>{Brow({ x: -eyeX, y: -16, tilt: 0, lift: 3 })}{Brow({ x: eyeX, y: -16, tilt: 5, lift: 12 })}</> : null}
          {expr === "happy" || expr === "smile" ? <>{Brow({ x: -eyeX, y: -18, tilt: 0, lift: 5 })}{Brow({ x: eyeX, y: -18, tilt: 0, lift: 5 })}</> : null}
          {eyes(-eyeX)}
          {eyes(eyeX)}
          {def.glasses ? (
            <g fill="rgba(255,255,255,.18)" stroke={OUT} strokeWidth={5}>
              <circle cx={-eyeX} cy={eyeY} r={27} />
              <circle cx={eyeX} cy={eyeY} r={27} />
              <line x1={-9} y1={eyeY - 2} x2={9} y2={eyeY - 2} />
            </g>
          ) : null}
          <g transform="translate(0,0)">{mouth}</g>
          {def.hat === "detective" ? (
            <g>
              <path d="M -104 -34 Q -110 -118 0 -122 Q 110 -118 104 -34 Q 60 -64 0 -62 Q -60 -64 -104 -34 Z" fill="#8a5a3b" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
              <path d="M -112 -36 Q 0 -70 112 -36 Q 120 -24 100 -26 Q 0 -52 -100 -26 Q -120 -24 -112 -36 Z" fill="#a67352" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
              <path d="M -100 -72 Q 0 -96 100 -72" stroke="#5e3b24" strokeWidth={6} fill="none" />
              {[-60, -20, 20, 60].map((x) => <line key={x} x1={x} y1={-100} x2={x * 0.9} y2={-66} stroke="#74482c" strokeWidth={3} opacity={0.6} />)}
            </g>
          ) : null}
          {def.hat === "cap" ? (
            <g>
              <path d="M -100 -30 Q -104 -112 0 -114 Q 104 -112 100 -30 Z" fill="#3b6fd8" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
              <path d="M -10 -34 Q 60 -34 118 -20 Q 112 -6 60 -12 Q 20 -16 -10 -22 Z" fill="#2a54ab" stroke={OUT} strokeWidth={6} strokeLinejoin="round" />
            </g>
          ) : null}
        </g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- partikel, sinar, tanaman depan
export const Dust: React.FC<{ f: number; color?: string; n?: number }> = ({ f, color = "#ffd98a", n = 28 }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {Array.from({ length: n }, (_, i) => {
      const sp = 0.35 + (i % 5) * 0.18;
      const y = 1920 - ((f * sp + i * 137) % 1920);
      const x = ((i * 211) % 1080) + Math.sin(f / (40 + (i % 7) * 6) + i) * 22;
      const r = 2 + (i % 3) * 1.4;
      return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? "#ffffff" : color} opacity={0.25 + 0.5 * Math.abs(Math.sin(f / 26 + i))} />;
    })}
  </svg>
);

export const Rays: React.FC<{ f: number; color?: string }> = ({ f, color = "#ffffff" }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
    <defs>
      <linearGradient id="rayG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0.24} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    {[0, 1, 2].map((i) => {
      const s = Math.sin(f / 120 + i * 1.7) * 26;
      return <polygon key={i} points={`${170 + i * 150 + s},0 ${290 + i * 150 + s},0 ${650 + i * 190},1350 ${360 + i * 190},1350`} fill="url(#rayG)" opacity={0.7 - i * 0.14} />;
    })}
  </svg>
);

export const Plants: React.FC<{ f: number; tone?: string }> = ({ f, tone = "#0f3524" }) => {
  const sw = Math.sin(f / 38) * 2.2;
  const leaf = (x: number, y: number, rot: number, s: number, c: string) => (
    <path d="M 0 0 C 40 -90 140 -150 250 -170 C 200 -90 130 -20 0 0 Z" fill={c} transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} />
  );
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`rotate(${sw} 60 1920)`}>{leaf(40, 1900, -62, 2.1, tone)}{leaf(60, 1900, -35, 1.8, "#14472f")}{leaf(30, 1900, -86, 1.5, tone)}</g>
      <g transform={`rotate(${-sw} 1040 1920) translate(1080,0) scale(-1,1)`}>{leaf(40, 1900, -62, 1.8, tone)}{leaf(50, 1900, -28, 1.5, "#14472f")}</g>
    </svg>
  );
};

// ---------------------------------------------------------------- latar bawaan
const Stars: React.FC<{ f: number; n: number; x0: number; y0: number; w: number; h: number }> = ({ f, n, x0, y0, w, h }) => (
  <g>{Array.from({ length: n }, (_, i) => <circle key={i} cx={x0 + ((i * 73) % w)} cy={y0 + ((i * 41) % h)} r={2 + (i % 3)} fill="#ffe9a8" opacity={0.3 + 0.6 * Math.abs(Math.sin(f / 22 + i * 1.3))} />)}</g>
);

const BOOKS = ["#e5484d", "#f2c230", "#3b6fd8", "#2a9d8f", "#9b5de5", "#f28c28", "#2fb36d"];
const Shelf: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    {Array.from({ length: Math.floor(w / 26) }, (_, i) => {
      const h = 70 + ((i * 29) % 34);
      return <rect key={i} x={x + 6 + i * 26} y={y - h} width={22} height={h} fill={BOOKS[i % BOOKS.length]} stroke={OUT} strokeWidth={3} />;
    })}
    <rect x={x} y={y} width={w} height={14} fill="#a8703f" stroke={OUT} strokeWidth={4} />
  </g>
);

export const BgKamar: React.FC<{ f: number }> = ({ f }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2a68" /><stop offset="1" stopColor="#4a3a92" /></linearGradient>
      <linearGradient id="kFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a4332" /><stop offset="1" stopColor="#3d2620" /></linearGradient>
      <radialGradient id="kGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd98a" stopOpacity={0.5} /><stop offset="1" stopColor="#ffd98a" stopOpacity={0} /></radialGradient>
    </defs>
    <rect width={1080} height={1500} fill="url(#kWall)" />
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 120 + 30} y={0} width={60} height={1500} fill="rgba(255,255,255,.045)" />)}
    <rect x={60} y={200} width={560} height={560} fill="#0f1544" stroke="#e8e4f0" strokeWidth={14} />
    <Stars f={f} n={22} x0={80} y0={220} w={520} h={510} />
    <circle cx={480} cy={340} r={90} fill="url(#kGlow)" /><circle cx={480} cy={340} r={42} fill="#f6f0cf" />
    <line x1={340} y1={200} x2={340} y2={760} stroke="#e8e4f0" strokeWidth={12} /><line x1={60} y1={480} x2={620} y2={480} stroke="#e8e4f0" strokeWidth={12} />
    <rect x={770} y={150} width={220} height={160} fill="#fff" stroke={OUT} strokeWidth={6} /><circle cx={880} cy={230} r={46} fill="#d63a3a" />
    <Shelf x={720} y={470} w={300} /><Shelf x={720} y={640} w={300} />
    <rect x={0} y={1180} width={1080} height={740} fill="url(#kFloor)" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={1180 + i * 62} x2={1080} y2={1180 + i * 62} stroke="rgba(0,0,0,.18)" strokeWidth={3} />)}
    <rect x={0} y={1176} width={1080} height={12} fill="#2a1a15" />
    <rect x={620} y={1010} width={420} height={26} fill="#a8703f" stroke={OUT} strokeWidth={5} />
    <rect x={650} y={1036} width={18} height={150} fill="#7a4f2a" stroke={OUT} strokeWidth={4} /><rect x={990} y={1036} width={18} height={150} fill="#7a4f2a" stroke={OUT} strokeWidth={4} />
    <g transform="translate(700,880)"><rect width={230} height={130} rx={10} fill="#2b2b3d" stroke={OUT} strokeWidth={6} /><rect x={12} y={12} width={206} height={104} rx={4} fill="#ff8a6b" /><rect x={12} y={12} width={206} height={104} rx={4} fill="#ffd1a0" opacity={0.35} /></g>
    <g transform="translate(980,880)"><polygon points="0,10 70,-30 80,-10 20,36" fill="#f2c230" stroke={OUT} strokeWidth={5} /><line x1={30} y1={30} x2={20} y2={130} stroke={OUT} strokeWidth={8} /></g>
    <ellipse cx={540} cy={1640} rx={470} ry={130} fill="#5b3fa8" stroke="#8f78e0" strokeWidth={8} opacity={0.9} />
  </svg>
);

export const BgJalan: React.FC<{ f: number }> = ({ f }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <linearGradient id="jSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fc0f5" /><stop offset="1" stopColor="#d9f1ff" /></linearGradient>
    </defs>
    <rect width={1080} height={1500} fill="url(#jSky)" />
    {[{ x: 200, y: 260, s: 1 }, { x: 760, y: 380, s: 1.25 }].map((c, i) => (
      <g key={i} transform={`translate(${c.x + Math.sin(f / 90 + i) * 18},${c.y}) scale(${c.s})`} fill="#fff" opacity={0.95}><ellipse cx={0} cy={0} rx={110} ry={34} /><ellipse cx={-50} cy={-22} rx={56} ry={34} /><ellipse cx={34} cy={-28} rx={64} ry={38} /></g>
    ))}
    <g transform="translate(40,560)"><polygon points="0,150 150,20 300,150" fill="#d9593d" stroke={OUT} strokeWidth={6} strokeLinejoin="round" /><rect x={20} y={150} width={260} height={470} fill="#f6c27a" stroke={OUT} strokeWidth={6} /><rect x={70} y={230} width={90} height={110} fill="#8fd3f4" stroke={OUT} strokeWidth={6} /></g>
    <g transform="translate(120,330)"><rect x={0} y={0} width={16} height={900} fill="#5c4a3a" stroke={OUT} strokeWidth={4} /><rect x={-80} y={70} width={176} height={14} fill="#5c4a3a" stroke={OUT} strokeWidth={4} /><path d="M -80 76 Q 400 150 900 60" stroke="#2a2140" strokeWidth={3} fill="none" opacity={0.6} /></g>
    <g transform="translate(380,520)">
      <rect x={0} y={150} width={660} height={500} fill="#fff1d6" stroke={OUT} strokeWidth={6} />
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M ${i * 66} 60 L ${i * 66 + 66} 60 L ${i * 66 + 66} 170 Q ${i * 66 + 33} 196 ${i * 66} 170 Z`} fill={i % 2 ? "#ffffff" : "#e5484d"} stroke={OUT} strokeWidth={4} />)}
      <rect x={200} y={0} width={250} height={64} rx={10} fill="#2a9d8f" stroke={OUT} strokeWidth={5} /><text x={325} y={46} fontSize={40} fontWeight={800} textAnchor="middle" fill="#fff" fontFamily="sans-serif">TOKO</text>
      <rect x={40} y={260} width={290} height={230} fill="#9fd6f2" stroke={OUT} strokeWidth={6} /><rect x={400} y={260} width={200} height={390} fill="#a8703f" stroke={OUT} strokeWidth={6} />
      {Array.from({ length: 4 }, (_, i) => <rect key={i} x={64 + i * 64} y={400} width={44} height={60} rx={6} fill={BOOKS[i]} stroke={OUT} strokeWidth={3} />)}
    </g>
    <rect x={0} y={1180} width={1080} height={740} fill="#d8c3a2" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={1180 + i * 62} x2={1080} y2={1180 + i * 62} stroke="rgba(90,60,30,.22)" strokeWidth={3} />)}
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={i * 150} y1={1180} x2={i * 150 - 220 + i * 40} y2={1920} stroke="rgba(90,60,30,.16)" strokeWidth={3} />)}
    <rect x={0} y={1172} width={1080} height={14} fill="#b49a76" />
  </svg>
);

export const BgGrid: React.FC<{ f: number }> = ({ f }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs><linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3c8fda" /><stop offset="1" stopColor="#62b8f2" /></linearGradient></defs>
    <rect width={1080} height={1920} fill="url(#gBlue)" />
    {Array.from({ length: 28 }, (_, i) => <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={1920} stroke="rgba(255,255,255,.13)" strokeWidth={2} />)}
    {Array.from({ length: 49 }, (_, i) => <line key={`h${i}`} x1={0} y1={(i * 40 + f * 0.25) % 1920} x2={1080} y2={(i * 40 + f * 0.25) % 1920} stroke="rgba(255,255,255,.13)" strokeWidth={2} />)}
  </svg>
);

export const BgStudio: React.FC<{ f: number }> = ({ f }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect width={1080} height={1500} fill="#ecdfc8" />
    <rect x={120} y={180} width={840} height={620} fill="#9fd6f2" stroke={OUT} strokeWidth={10} />
    {Array.from({ length: 12 }, (_, i) => { const h = 160 + ((i * 53) % 280); return <rect key={i} x={140 + i * 68} y={780 - h} width={54} height={h} fill={i % 2 ? "#6a8fb8" : "#7fa2c9"} stroke={OUT} strokeWidth={3} />; })}
    <rect x={120} y={180} width={840} height={620} fill="none" stroke={OUT} strokeWidth={10} /><line x1={540} y1={180} x2={540} y2={800} stroke={OUT} strokeWidth={8} />
    <rect x={0} y={1180} width={1080} height={740} fill="#c9a074" />
    {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={1180 + i * 62} x2={1080} y2={1180 + i * 62} stroke="rgba(80,50,20,.22)" strokeWidth={3} />)}
    <rect x={0} y={1172} width={1080} height={14} fill="#8a6a45" />
    {[{ x: 120 }, { x: 640 }].map((m, i) => <g key={i} transform={`translate(${m.x},980)`}><rect x={0} y={90} width={320} height={22} fill="#a8703f" stroke={OUT} strokeWidth={5} /><rect x={80} y={0} width={160} height={92} rx={8} fill="#2b2b3d" stroke={OUT} strokeWidth={5} /><rect x={92} y={12} width={136} height={68} fill={i ? "#ffd1a0" : "#8fe0c2"} /></g>)}
  </svg>
);

export const BG_PRESETS: Record<string, React.FC<{ f: number }>> = { kamar: BgKamar, jalan: BgJalan, grid: BgGrid, studio: BgStudio };

// ---------------------------------------------------------------- tanda coretan
export type MarkType = "circle" | "underline" | "arrow" | "check" | "cross" | "magnifier";
export const MarkArt: React.FC<{ type: MarkType; x: number; y: number; w: number; h?: number; p: number; f: number; color?: string; x2?: number; y2?: number }> = ({ type, x, y, w, h, p, f, color = "#e5252a", x2, y2 }) => {
  const ph = h ?? w * 0.45;
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
  const sw = 11;
  const common = { fill: "none", stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - e };
  if (type === "circle") return <ellipse cx={x} cy={y} rx={w / 2} ry={ph / 2} transform={`rotate(-6 ${x} ${y})`} {...common} />;
  if (type === "underline") return <path d={`M ${x - w / 2} ${y} Q ${x - w / 4} ${y - 14} ${x} ${y} T ${x + w / 2} ${y - 2}`} {...common} />;
  if (type === "arrow") {
    const ex = x + w, ey = y + ph;
    return (
      <g>
        <path d={`M ${x} ${y} Q ${x + w * 0.2} ${y + ph * 1.1} ${ex} ${ey}`} {...common} />
        <path d={`M ${ex - 34} ${ey - 10} L ${ex} ${ey} L ${ex - 12} ${ey - 36}`} {...common} strokeDashoffset={1 - Math.min(1, Math.max(0, (p - 0.7) / 0.3))} />
      </g>
    );
  }
  if (type === "check") return <path d={`M ${x - w * 0.5} ${y} L ${x - w * 0.12} ${y + w * 0.36} L ${x + w * 0.5} ${y - w * 0.4}`} {...common} stroke="#1f9d55" strokeWidth={14} />;
  if (type === "cross") return <g><path d={`M ${x - w / 2} ${y - w / 2} L ${x + w / 2} ${y + w / 2}`} {...common} /><path d={`M ${x + w / 2} ${y - w / 2} L ${x - w / 2} ${y + w / 2}`} {...common} strokeDashoffset={1 - Math.min(1, Math.max(0, (p - 0.45) / 0.55))} /></g>;
  // kaca pembesar: bergerak dari (x,y) ke (x2,y2) selama p, lalu bergoyang kecil
  const mx = x + ((x2 ?? x) - x) * e + Math.sin(f / 7) * 5, my = y + ((y2 ?? y) - y) * e + Math.cos(f / 9) * 5;
  const r = w / 2;
  return (
    <g opacity={Math.min(1, p * 4)}>
      <line x1={mx + r * 0.72} y1={my + r * 0.72} x2={mx + r * 1.6} y2={my + r * 1.6} stroke="#8a5a3b" strokeWidth={r * 0.34} strokeLinecap="round" />
      <line x1={mx + r * 0.72} y1={my + r * 0.72} x2={mx + r * 1.6} y2={my + r * 1.6} stroke={OUT} strokeWidth={r * 0.34 + 8} strokeLinecap="round" opacity={0.0} />
      <circle cx={mx} cy={my} r={r} fill="rgba(190,225,255,.32)" stroke={OUT} strokeWidth={10} />
      <circle cx={mx} cy={my} r={r} fill="none" stroke="#9aa8c9" strokeWidth={4} />
      <path d={`M ${mx - r * 0.55} ${my - r * 0.2} Q ${mx - r * 0.4} ${my - r * 0.62} ${mx - r * 0.05} ${my - r * 0.7}`} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
    </g>
  );
};
