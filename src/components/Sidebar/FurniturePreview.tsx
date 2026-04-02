import React from 'react';
import { FurnitureDefinition } from '../../types';

interface Props {
  def: FurnitureDefinition;
}

const BG  = '#edeae4';
const ST  = '#2a2a2a';
const ST2 = '#666666';

export default function FurniturePreview({ def }: Props) {
  const S = 34;
  const P = 2;

  const aspect = def.widthCm / def.heightCm;
  let w = S - P * 2;
  let h = S - P * 2;
  if (aspect >= 1) h = Math.max(6, w / aspect);
  else             w = Math.max(6, h * aspect);
  w = Math.min(w, S - P * 2);
  h = Math.min(h, S - P * 2);

  const ox = (S - w) / 2;
  const oy = (S - h) / 2;
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  const id = def.id;

  // Office chair (circular with 5-star base)
  if (id === 'office-chair') {
    const r = Math.min(w, h) / 2;
    const seatR = r * 0.72;
    const casterR = r * 0.08;
    return (
      <svg width={S} height={S}>
        {[0, 1, 2, 3, 4].map(i => {
          const a = (i * 72 - 90) * Math.PI / 180;
          const tx = cx + Math.cos(a) * r;
          const ty = cy + Math.sin(a) * r;
          return (
            <React.Fragment key={i}>
              <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={ST2} strokeWidth={0.5} />
              <circle cx={tx} cy={ty} r={Math.max(casterR, 0.8)} fill={ST2} />
            </React.Fragment>
          );
        })}
        <circle cx={cx} cy={cy} r={seatR} fill={BG} stroke={ST} strokeWidth={1} />
        <path d={`M ${cx + Math.cos(210 * Math.PI / 180) * (seatR - 1)} ${cy + Math.sin(210 * Math.PI / 180) * (seatR - 1)} A ${seatR - 1} ${seatR - 1} 0 0 1 ${cx + Math.cos(330 * Math.PI / 180) * (seatR - 1)} ${cy + Math.sin(330 * Math.PI / 180) * (seatR - 1)}`}
          fill="none" stroke={ST2} strokeWidth={0.7} />
        <circle cx={cx} cy={cy} r={1.5} fill={ST2} />
      </svg>
    );
  }

  // Papasan chair (circular with tufting)
  if (id === 'papasan') {
    const r = Math.min(w, h) / 2;
    const cushionR = r * 0.82;
    return (
      <svg width={S} height={S}>
        <circle cx={cx} cy={cy} r={r} fill={BG} stroke={ST} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r - 1.5} fill="none" stroke={ST2} strokeWidth={0.3} />
        <circle cx={cx} cy={cy} r={cushionR} fill={BG} stroke={ST} strokeWidth={0.7} />
        {[0, 1, 2, 3].map(i => {
          const a = (i * 90 + 45) * Math.PI / 180;
          return (
            <line key={i}
              x1={cx + Math.cos(a) * cushionR * 0.2} y1={cy + Math.sin(a) * cushionR * 0.2}
              x2={cx + Math.cos(a) * cushionR * 0.85} y2={cy + Math.sin(a) * cushionR * 0.85}
              stroke={ST2} strokeWidth={0.3} />
          );
        })}
        <circle cx={cx} cy={cy} r={1} fill={ST2} />
      </svg>
    );
  }

  // Circular items
  if (id === 'bar-stool' || id === 'coffee-round' || id === 'dining-round-4' || id === 'column-round') {
    const r = Math.min(w, h) / 2;
    return (
      <svg width={S} height={S}>
        <circle cx={cx} cy={cy} r={r} fill={id === 'column-round' ? '#c8c4bc' : BG} stroke={ST} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke={ST2} strokeWidth={0.4} />
        <line x1={cx - r * 0.5} y1={cy} x2={cx + r * 0.5} y2={cy} stroke={ST2} strokeWidth={0.4} />
        <line x1={cx} y1={cy - r * 0.5} x2={cx} y2={cy + r * 0.5} stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // L-shapes
  if (id === 'sofa-l' || id === 'bar-l') {
    const arm = Math.min(w, h) * 0.45;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={arm} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox} y={oy + arm} width={arm} height={h - arm} fill={BG} stroke={ST} strokeWidth={1} />
      </svg>
    );
  }

  // Door single
  if (id === 'door-single') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={3} fill={ST} />
        <rect x={ox} y={oy + 3} width={3} height={w - 3} fill={BG} stroke={ST} strokeWidth={0.8} />
        <path d={`M ${ox} ${oy + 3} A ${w - 3} ${w - 3} 0 0 1 ${ox + w - 3} ${oy + w}`}
          fill="none" stroke={ST} strokeWidth={0.8} />
        <line x1={ox} y1={oy + 3} x2={ox + w - 3} y2={oy + w} stroke={ST} strokeWidth={0.8} />
      </svg>
    );
  }

  // Door double
  if (id === 'door-double') {
    const hw = w / 2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={3} fill={ST} />
        <path d={`M ${ox} ${oy + 3} A ${hw} ${hw} 0 0 1 ${ox + hw} ${oy + 3 + hw}`}
          fill="none" stroke={ST} strokeWidth={0.8} opacity={0.6} />
        <path d={`M ${ox + w} ${oy + 3} A ${hw} ${hw} 0 0 0 ${ox + hw} ${oy + 3 + hw}`}
          fill="none" stroke={ST} strokeWidth={0.8} opacity={0.6} />
      </svg>
    );
  }

  // Window
  if (id === 'window' || id === 'sliding-door') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={cy - 4} width={w} height={8} fill={id === 'window' ? '#c8c0b0' : BG} stroke={ST} strokeWidth={1} />
        <rect x={ox + 1} y={cy - 3} width={w - 2} height={6} fill={id === 'window' ? 'rgba(160,210,240,0.4)' : 'none'} stroke={ST} strokeWidth={0.5} />
        <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} stroke={ST} strokeWidth={0.8} />
      </svg>
    );
  }

  // Staircase
  if (id === 'stair') {
    const steps = 5;
    const sh = h / steps;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill="#ddd8ce" stroke={ST} strokeWidth={1} />
        {Array.from({ length: steps }).map((_, i) => (
          <line key={i} x1={ox} y1={oy + i * sh} x2={ox + w} y2={oy + i * sh} stroke={ST} strokeWidth={0.7} />
        ))}
        <line x1={ox + 2} y1={oy} x2={ox + 2} y2={oy + h} stroke={ST} strokeWidth={0.8} />
        <line x1={ox + w - 2} y1={oy} x2={ox + w - 2} y2={oy + h} stroke={ST} strokeWidth={0.8} />
      </svg>
    );
  }

  // WC Toilet
  if (id === 'wc') {
    const tankH = h * 0.28;
    const bowlH = h * 0.65;
    return (
      <svg width={S} height={S}>
        <rect x={ox + 1} y={oy} width={w - 2} height={tankH} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <ellipse cx={cx} cy={oy + tankH + bowlH / 2} rx={w / 2} ry={bowlH / 2} fill={BG} stroke={ST} strokeWidth={1} />
        <ellipse cx={cx} cy={oy + tankH + bowlH / 2} rx={w * 0.35} ry={bowlH * 0.35} fill="none" stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // Bidet
  if (id === 'bidet') {
    const topH = h * 0.25;
    return (
      <svg width={S} height={S}>
        <rect x={cx - w * 0.35} y={oy} width={w * 0.7} height={topH} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <ellipse cx={cx} cy={oy + topH + h * 0.37} rx={w * 0.44} ry={h * 0.38} fill={BG} stroke={ST} strokeWidth={1} />
      </svg>
    );
  }

  // Bathtub
  if (id === 'bath-freestanding' || id === 'bath-builtin') {
    const rx = Math.min(h * 0.3, 10);
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={rx} />
        <rect x={ox + 2} y={oy + 3} width={w - 4} height={h - 6} fill="none" stroke={ST2} strokeWidth={0.4} rx={rx - 1} />
        <circle cx={cx} cy={oy + h * 0.65} r={2} fill="none" stroke={ST2} strokeWidth={0.7} />
      </svg>
    );
  }

  // Shower
  if (id === 'shower') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox} y={oy} width={w} height={2} fill={ST} />
        <rect x={ox} y={oy} width={2} height={h} fill={ST} />
        <rect x={cx - 4} y={cy - 4} width={8} height={8} fill="none" stroke={ST2} strokeWidth={0.7} />
      </svg>
    );
  }

  // Basin / Washbasin
  if (id === 'basin-single' || id === 'basin-double' || id === 'vanity') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        {id === 'basin-double' ? (
          <>
            <ellipse cx={ox + w * 0.27} cy={cy} rx={w * 0.2} ry={h * 0.35} fill={BG} stroke={ST} strokeWidth={0.8} />
            <ellipse cx={ox + w * 0.73} cy={cy} rx={w * 0.2} ry={h * 0.35} fill={BG} stroke={ST} strokeWidth={0.8} />
            <line x1={cx} y1={oy} x2={cx} y2={oy + h} stroke={ST2} strokeWidth={0.4} />
          </>
        ) : (
          <ellipse cx={cx} cy={cy + h * 0.05} rx={w * 0.38} ry={h * 0.35} fill={BG} stroke={ST} strokeWidth={0.8} />
        )}
        <circle cx={cx} cy={cy + h * 0.1} r={1.5} fill="none" stroke={ST2} strokeWidth={0.6} />
      </svg>
    );
  }

  // Beds
  if (id.startsWith('bed-') || id === 'hotel-bed-set') {
    const headH = h * 0.18;
    const pillows = w > 14 ? 2 : 1;
    const pw = (w - 4 - (pillows - 1) * 3) / pillows;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy + headH} width={w} height={h - headH} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox} y={oy} width={w} height={headH} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + 2} y={oy + 1} width={w - 4} height={headH - 2} fill="none" stroke={ST2} strokeWidth={0.4} />
        {Array.from({ length: pillows }).map((_, i) => (
          <rect key={i} x={ox + 2 + i * (pw + 3)} y={oy + headH + 2} width={pw} height={headH * 0.65} fill={BG} stroke={ST} strokeWidth={0.7} rx={1} />
        ))}
        <line x1={ox + 2} y1={oy + headH + headH * 0.65 + 4} x2={ox + w - 2} y2={oy + headH + headH * 0.65 + 4} stroke={ST2} strokeWidth={0.5} />
      </svg>
    );
  }

  // Curved sofa
  if (id === 'sofa-curved') {
    return (
      <svg width={S} height={S}>
        <path d={`M ${ox + 1} ${oy + h} A ${w / 2} ${h - 2} 0 0 1 ${ox + w - 1} ${oy + h}`}
          fill="none" stroke={ST} strokeWidth={1} />
        <path d={`M ${ox + w * 0.1} ${oy + h} A ${w * 0.4} ${h * 0.55} 0 0 1 ${ox + w * 0.9} ${oy + h}`}
          fill={BG} stroke={ST} strokeWidth={0.7} />
        <path d={`M ${ox + w * 0.06} ${oy + h} A ${w * 0.44} ${h * 0.75} 0 0 1 ${ox + w * 0.94} ${oy + h}`}
          fill="none" stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // Curved sofa small
  if (id === 'sofa-curved-small') {
    return (
      <svg width={S} height={S}>
        <path d={`M ${ox + 2} ${oy + h} A ${w * 0.45} ${h * 0.85} 0 0 1 ${ox + w - 2} ${oy + h * 0.3}`}
          fill="none" stroke={ST} strokeWidth={1} />
        <path d={`M ${ox + w * 0.12} ${oy + h} A ${w * 0.35} ${h * 0.5} 0 0 1 ${ox + w * 0.88} ${oy + h * 0.4}`}
          fill={BG} stroke={ST} strokeWidth={0.7} />
      </svg>
    );
  }

  // U-shape sofa
  if (id === 'sofa-u') {
    const t = Math.min(w, h) * 0.28;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={t} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox} y={oy + t} width={t} height={h - t} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + w - t} y={oy + t} width={t} height={h - t} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + 1} y={oy + 1} width={w - 2} height={t * 0.35} fill="none" stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // 4-piece sectional
  if (id === 'sofa-modular-4') {
    const gap = 1.5;
    const uw = (w - gap) / 2;
    const uh = (h - gap) / 2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={uw} height={uh} fill={BG} stroke={ST} strokeWidth={0.8} rx={1} />
        <rect x={ox + uw + gap} y={oy} width={uw} height={uh} fill={BG} stroke={ST} strokeWidth={0.8} rx={1} />
        <rect x={ox} y={oy + uh + gap} width={uw} height={uh} fill={BG} stroke={ST} strokeWidth={0.8} rx={1} />
        <rect x={ox + uw + gap} y={oy + uh + gap} width={uw} height={uh} fill={BG} stroke={ST} strokeWidth={0.8} rx={1} />
        <rect x={ox + 1} y={oy + 1} width={uw - 2} height={uh * 0.3} fill="none" stroke={ST2} strokeWidth={0.3} />
        <rect x={ox + uw + gap + 1} y={oy + 1} width={uw - 2} height={uh * 0.3} fill="none" stroke={ST2} strokeWidth={0.3} />
        <rect x={ox + 1} y={oy + uh + gap + 1} width={uw - 2} height={uh * 0.3} fill="none" stroke={ST2} strokeWidth={0.3} />
      </svg>
    );
  }

  // Sofas
  if (id === 'sofa-2' || id === 'sofa-3' || id === 'chaise' || id === 'banquette' || id === 'loveseat') {
    const arm = w * 0.1;
    const back = h * 0.3;
    const n = id === 'sofa-3' ? 3 : 2;
    const cw = (w - arm * 2 - (n - 1) * 2) / n;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} />
        {Array.from({ length: n }).map((_, i) => (
          <rect key={i} x={ox + arm + i * (cw + 2)} y={oy + back + 2} width={cw} height={h - back - 5} fill={BG} stroke={ST} strokeWidth={0.7} rx={1} />
        ))}
        <rect x={ox} y={oy} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + w - arm} y={oy} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={0.7} />
      </svg>
    );
  }

  // Daybed
  if (id === 'daybed') {
    const arm = w * 0.08;
    const back = h * 0.2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox} y={oy} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + arm + 1} y={oy + back + 2} width={w - arm - 3} height={h - back - 4} fill={BG} stroke={ST} strokeWidth={0.5} rx={1} />
        <line x1={ox + arm + 1} y1={oy + back + (h - back) * 0.7} x2={ox + w - 2} y2={oy + back + (h - back) * 0.7} stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // Recliner
  if (id === 'recliner') {
    const arm = w * 0.15;
    const back = h * 0.22;
    const footrest = h * 0.2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox} y={oy} width={arm} height={h - footrest} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + w - arm} y={oy} width={arm} height={h - footrest} fill={BG} stroke={ST} strokeWidth={0.7} />
        <line x1={ox + arm * 0.5} y1={oy + h - footrest} x2={ox + w - arm * 0.5} y2={oy + h - footrest}
          stroke={ST} strokeWidth={0.7} strokeDasharray="2 1.5" />
        <rect x={ox + arm + 1} y={oy + h - footrest + 1} width={w - arm * 2 - 2} height={footrest - 3}
          fill={BG} stroke={ST2} strokeWidth={0.4} rx={1} />
      </svg>
    );
  }

  // Club chair
  if (id === 'club-chair') {
    const arm = w * 0.18;
    const back = h * 0.25;
    const cr = Math.min(w, h) * 0.2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={cr} />
        <rect x={ox + arm} y={oy + back} width={w - arm * 2} height={h - back - 3} fill={BG} stroke={ST} strokeWidth={0.7} rx={2} />
        <rect x={ox + arm + 1} y={oy + 1} width={w - arm * 2 - 2} height={back} fill="none" stroke={ST2} strokeWidth={0.4} rx={cr * 0.7} />
        <circle cx={cx} cy={oy + back + (h - back) / 2} r={1.2} fill={ST2} />
      </svg>
    );
  }

  // Accent chair (wingback)
  if (id === 'accent-chair') {
    const arm = w * 0.15;
    const back = h * 0.3;
    const wingW = w * 0.2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox} y={oy} width={wingW} height={back + h * 0.15} fill={BG} stroke={ST} strokeWidth={0.7} rx={2} />
        <rect x={ox + w - wingW} y={oy} width={wingW} height={back + h * 0.15} fill={BG} stroke={ST} strokeWidth={0.7} rx={2} />
        <rect x={ox + wingW} y={oy + 1} width={w - wingW * 2} height={back} fill="none" stroke={ST2} strokeWidth={0.4} />
        <rect x={ox + arm + 1} y={oy + back + 1} width={w - arm * 2 - 2} height={h - back - 4} fill={BG} stroke={ST} strokeWidth={0.5} rx={1} />
      </svg>
    );
  }

  // Dining chair with arms
  if (id === 'dining-chair-arm') {
    const arm = w * 0.14;
    const back = h * 0.28;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + arm} y={oy + back + 1} width={w - arm * 2} height={h - back - 3} fill={BG} stroke={ST} strokeWidth={0.5} rx={1} />
        <rect x={ox} y={oy + back * 0.4} width={arm} height={h * 0.45} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + w - arm} y={oy + back * 0.4} width={arm} height={h * 0.45} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + arm} y={oy + h - 2} width={2} height={2} fill={ST} />
        <rect x={ox + w - arm - 2} y={oy + h - 2} width={2} height={2} fill={ST} />
      </svg>
    );
  }

  // Armchair / lounge / ottoman / dining chair / bench
  if (id === 'armchair' || id === 'lounge-chair' || id === 'ottoman' || id === 'dining-chair' || id === 'bench') {
    const arm = w * 0.14;
    const back = h * 0.28;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        {id !== 'bench' && (
          <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} rx={1} />
        )}
        <rect x={ox + arm} y={oy + back + 2} width={w - arm * 2} height={h - back - 5} fill={BG} stroke={ST} strokeWidth={0.7} rx={1} />
        {id !== 'bench' && (
          <>
            <rect x={ox} y={oy} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={0.7} />
            <rect x={ox + w - arm} y={oy} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={0.7} />
          </>
        )}
      </svg>
    );
  }

  // Wardrobe
  if (id.startsWith('wardrobe-')) {
    const doors = id === 'wardrobe-single' ? 1 : id === 'wardrobe-double' ? 2 : 3;
    const dw = w / doors;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} />
        {Array.from({ length: doors }).map((_, i) => (
          <React.Fragment key={i}>
            <rect x={ox + i * dw + 1} y={oy + 1} width={dw - 2} height={h - 2} fill={BG} stroke={ST} strokeWidth={0.7} />
            <line x1={ox + i * dw + dw / 2} y1={oy + h * 0.4} x2={ox + i * dw + dw / 2} y2={oy + h * 0.6} stroke={ST} strokeWidth={1} />
          </React.Fragment>
        ))}
      </svg>
    );
  }

  // Desk / bookcase / storage
  if (id === 'desk') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox + w * 0.62} y={oy + 1} width={w * 0.35} height={h - 2} fill={BG} stroke={ST} strokeWidth={0.7} />
        {[0, 1, 2].map(i => (
          <rect key={i} x={ox + w * 0.64} y={oy + 2 + i * ((h - 4) / 3)} width={w * 0.31} height={(h - 4) / 3 - 2} fill="none" stroke={ST2} strokeWidth={0.4} />
        ))}
      </svg>
    );
  }

  // Generic table
  const isTable = id.includes('table') || id === 'console' || id === 'boardroom' || id.startsWith('dining-') || id === 'side-table';
  if (isTable) {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox + 3} y={oy + 3} width={w - 6} height={h - 6} fill="none" stroke={ST2} strokeWidth={0.4} />
        <line x1={ox} y1={oy} x2={ox + w} y2={oy + h} stroke={ST2} strokeWidth={0.4} opacity={0.4} />
        <line x1={ox + w} y1={oy} x2={ox} y2={oy + h} stroke={ST2} strokeWidth={0.4} opacity={0.4} />
      </svg>
    );
  }

  // Pool / Billiards table
  if (id === 'pool-table' || id === 'billiards-table') {
    const rail = Math.min(w, h) * 0.07;
    const pR = Math.min(w, h) * 0.04;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + rail} y={oy + rail} width={w - rail * 2} height={h - rail * 2} fill="#2d6b3f" stroke={ST} strokeWidth={0.7} />
        <circle cx={ox + rail} cy={oy + rail} r={pR} fill={ST} />
        <circle cx={ox + w - rail} cy={oy + rail} r={pR} fill={ST} />
        <circle cx={ox + rail} cy={oy + h - rail} r={pR} fill={ST} />
        <circle cx={ox + w - rail} cy={oy + h - rail} r={pR} fill={ST} />
        <circle cx={cx} cy={oy + rail} r={pR} fill={ST} />
        <circle cx={cx} cy={oy + h - rail} r={pR} fill={ST} />
      </svg>
    );
  }

  // Table tennis
  if (id === 'table-tennis') {
    const edge = Math.min(w, h) * 0.03;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} />
        <rect x={ox + edge} y={oy + edge} width={w - edge * 2} height={h - edge * 2} fill="#1a5276" stroke={ST} strokeWidth={0.7} />
        <line x1={ox + edge} y1={cy} x2={ox + w - edge} y2={cy} stroke="white" strokeWidth={1} />
        <line x1={cx} y1={oy + edge} x2={cx} y2={oy + h - edge} stroke="rgba(255,255,255,0.3)" strokeWidth={0.3} />
      </svg>
    );
  }

  // Foosball
  if (id === 'foosball') {
    const rail = w * 0.08;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + rail} y={oy + rail} width={w - rail * 2} height={h - rail * 2} fill="#2d6b3f" stroke={ST} strokeWidth={0.7} />
        {[0.2, 0.35, 0.5, 0.65, 0.8].map(p => (
          <line key={p} x1={ox - 1} y1={oy + h * p} x2={ox + w + 1} y2={oy + h * p} stroke={ST2} strokeWidth={0.4} />
        ))}
      </svg>
    );
  }

  // Pinball machine
  if (id === 'pinball-machine') {
    const cabH = h * 0.25;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={cabH} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox} y={oy + cabH} width={w} height={h - cabH} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + 2} y={oy + cabH + 2} width={w - 4} height={h - cabH - 4} fill="none" stroke={ST2} strokeWidth={0.4} />
        <circle cx={cx} cy={oy + cabH + (h - cabH) * 0.3} r={w * 0.08} fill="none" stroke={ST2} strokeWidth={0.4} />
        <circle cx={cx - w * 0.15} cy={oy + cabH + (h - cabH) * 0.35} r={w * 0.06} fill="none" stroke={ST2} strokeWidth={0.3} />
        <circle cx={cx + w * 0.15} cy={oy + cabH + (h - cabH) * 0.35} r={w * 0.06} fill="none" stroke={ST2} strokeWidth={0.3} />
      </svg>
    );
  }

  // Sauna
  if (id === 'sauna') {
    const wt = Math.min(w, h) * 0.05;
    const bd = Math.min(w, h) * 0.22;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + wt} y={oy + wt} width={w - wt * 2} height={h - wt * 2} fill="#f5e6c8" stroke={ST} strokeWidth={0.7} />
        <rect x={ox + wt} y={oy + wt} width={w - wt * 2} height={bd} fill={BG} stroke={ST} strokeWidth={0.5} />
        <rect x={ox + wt} y={oy + wt + bd} width={bd} height={h - wt * 2 - bd} fill={BG} stroke={ST} strokeWidth={0.5} />
        <rect x={ox + w - wt - w * 0.12} y={oy + h - wt - h * 0.12} width={w * 0.1} height={h * 0.1} fill="#c8a070" stroke={ST} strokeWidth={0.5} />
      </svg>
    );
  }

  // Steam room
  if (id === 'steam-room') {
    const wt = Math.min(w, h) * 0.05;
    const bd = Math.min(w, h) * 0.2;
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
        <rect x={ox + wt} y={oy + wt} width={w - wt * 2} height={h - wt * 2} fill="#d4e6f0" stroke={ST} strokeWidth={0.7} />
        <rect x={ox + wt} y={oy + wt} width={w - wt * 2} height={bd} fill={BG} stroke={ST} strokeWidth={0.5} />
        <circle cx={ox + w - wt - w * 0.08} cy={oy + h - wt - h * 0.08} r={Math.min(w, h) * 0.05} fill="#b0c4de" stroke={ST} strokeWidth={0.5} />
      </svg>
    );
  }

  // Hot tub / Jacuzzi
  if (id === 'hot-tub') {
    const r = Math.min(w, h) / 2;
    return (
      <svg width={S} height={S}>
        <circle cx={cx} cy={cy} r={r} fill={BG} stroke={ST} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r * 0.85} fill="rgba(160,210,240,0.2)" stroke={ST} strokeWidth={0.7} />
        <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={ST2} strokeWidth={0.3} />
        {[0, 90, 180, 270].map(deg => {
          const a = deg * Math.PI / 180;
          return <circle key={deg} cx={cx + Math.cos(a) * r * 0.6} cy={cy + Math.sin(a) * r * 0.6} r={1} fill="none" stroke={ST2} strokeWidth={0.4} />;
        })}
      </svg>
    );
  }

  // Massage table
  if (id === 'massage-table') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={Math.min(w * 0.15, 4)} />
        <rect x={ox + w * 0.08} y={oy + h * 0.12} width={w * 0.84} height={h * 0.82} fill={BG} stroke={ST} strokeWidth={0.5} rx={Math.min(w * 0.12, 3)} />
        <ellipse cx={cx} cy={oy + h * 0.06} rx={w * 0.25} ry={h * 0.03} fill="none" stroke={ST} strokeWidth={0.7} />
        <line x1={cx} y1={oy + h * 0.15} x2={cx} y2={oy + h * 0.9} stroke={ST2} strokeWidth={0.3} />
      </svg>
    );
  }

  // Barber chair
  if (id === 'barber-chair') {
    const arm = w * 0.15;
    const back = h * 0.3;
    return (
      <svg width={S} height={S}>
        <circle cx={cx} cy={oy + h * 0.65} r={Math.min(w, h) * 0.28} fill="none" stroke={ST2} strokeWidth={0.3} />
        <rect x={ox} y={oy} width={w} height={h * 0.85} fill={BG} stroke={ST} strokeWidth={1} rx={2} />
        <rect x={ox + arm} y={oy + 1} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox} y={oy + back * 0.5} width={arm} height={h * 0.4} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + w - arm} y={oy + back * 0.5} width={arm} height={h * 0.4} fill={BG} stroke={ST} strokeWidth={0.7} />
        <rect x={ox + arm + 1} y={oy + back + 1} width={w - arm * 2 - 2} height={h * 0.85 - back - 4} fill={BG} stroke={ST} strokeWidth={0.4} rx={1} />
        <rect x={ox + w * 0.2} y={oy + h - 3} width={w * 0.6} height={3} fill={BG} stroke={ST} strokeWidth={0.5} rx={1} />
      </svg>
    );
  }

  // Column square
  if (id === 'column-sq') {
    return (
      <svg width={S} height={S}>
        <rect x={ox} y={oy} width={w} height={h} fill="#c8c4bc" stroke={ST} strokeWidth={2} />
        <rect x={ox + 2} y={oy + 2} width={w - 4} height={h - 4} fill="none" stroke={ST2} strokeWidth={0.4} />
      </svg>
    );
  }

  // Generic fallback for unknown furniture IDs
  return (
    <svg width={S} height={S}>
      <rect x={ox} y={oy} width={w} height={h} fill={BG} stroke={ST} strokeWidth={1} rx={1} />
      <rect x={ox + 3} y={oy + 3} width={Math.max(1, w - 6)} height={Math.max(1, h - 6)} fill="none" stroke={ST2} strokeWidth={0.4} />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={8} fill={ST2}>{def.name.charAt(0)}</text>
    </svg>
  );
}
