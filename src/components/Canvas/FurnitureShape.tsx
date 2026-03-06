import React, { useState, useEffect } from 'react';
import { Group, Rect, Circle, Line, Arc, Text, Ellipse, Image as KonvaImage } from 'react-konva';
import { CanvasItem } from '../../types';

interface Props {
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  onContextMenu: (e: any) => void;
  draggable: boolean;
  showDimensions?: boolean;
}

// ─── Shared drawing constants ─────────────────────────────────────────────────
const BG  = '#edeae4';   // warm off-white fill (CAD paper look)
const ST  = '#2a2a2a';   // main stroke
const ST2 = '#555555';   // secondary / detail stroke
const LW  = 1.2;         // primary line weight
const LW2 = 0.7;         // secondary line weight
const LW3 = 0.4;         // fine detail

// ─── SEATING ─────────────────────────────────────────────────────────────────

function Armchair({ w, h }: { w: number; h: number }) {
  const arm = w * 0.14;
  const back = h * 0.28;
  const seat = h * 0.58;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm} y={back + 4} width={w - arm * 2} height={seat} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={0} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={0} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Line points={[arm + (w - arm * 2) / 2, back + 4, arm + (w - arm * 2) / 2, back + 4 + seat]} stroke={ST2} strokeWidth={LW3} />
      <Rect x={arm} y={h - 4} width={5} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - arm - 5} y={h - 4} width={5} height={4} fill={ST} strokeWidth={0} />
    </>
  );
}

function DiningChair({ w, h }: { w: number; h: number }) {
  const back = h * 0.3;
  const arm = w * 0.1;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back - 2} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm} y={back + 2} width={w - arm * 2} height={h - back - 6} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - arm - 4} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={arm} y={back + 2} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - arm - 4} y={back + 2} width={4} height={4} fill={ST} strokeWidth={0} />
    </>
  );
}

function BarStool({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) / 2 - LW;
  const cx = w / 2, cy = h / 2;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={BG} stroke={ST} strokeWidth={LW} />
      <Line points={[cx - r * 0.6, cy, cx + r * 0.6, cy]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[cx, cy - r * 0.6, cx, cy + r * 0.6]} stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={3} fill={ST} strokeWidth={0} />
    </>
  );
}

function Sofa2({ w, h }: { w: number; h: number }) {
  const arm = w * 0.09;
  const back = h * 0.3;
  const cw = (w - arm * 2) / 2 - 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Rect x={arm} y={back + 3} width={cw} height={h - back - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm + cw + 4} y={back + 3} width={cw} height={h - back - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={0} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={0} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function Sofa3({ w, h }: { w: number; h: number }) {
  const arm = w * 0.07;
  const back = h * 0.3;
  const usableW = w - arm * 2;
  const cw = (usableW - 4) / 3;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={usableW} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      {[0, 1, 2].map(i => (
        <Rect key={i} x={arm + i * (cw + 2)} y={back + 3} width={cw} height={h - back - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      ))}
      <Rect x={0} y={0} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={0} width={arm} height={h * 0.88} fill={BG} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function SofaL({ w, h }: { w: number; h: number }) {
  const thick = Math.min(w, h) * 0.35;
  const back = thick * 0.3;
  return (
    <>
      <Rect x={0} y={h - thick} width={w} height={thick} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={0} y={0} width={thick} height={h - thick} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={0} y={h - thick} width={w} height={back} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={0} y={0} width={back} height={h - thick} fill={BG} stroke={ST} strokeWidth={LW2} />
      {[0, 1, 2].map(i => (
        <Rect key={i}
          x={thick + i * ((w - thick) / 3) + 2} y={h - thick + back + 2}
          width={(w - thick) / 3 - 4} height={thick - back - 6}
          fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2}
        />
      ))}
      {[0, 1].map(i => (
        <Rect key={i}
          x={back + 2} y={i * ((h - thick) / 2) + 2}
          width={thick - back - 4} height={(h - thick) / 2 - 4}
          fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2}
        />
      ))}
    </>
  );
}

function Chaise({ w, h }: { w: number; h: number }) {
  const back = h * 0.28;
  const arm = w * 0.1;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm - 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Rect x={arm} y={back + 3} width={w - arm - 4} height={h - back - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={0} width={arm} height={h * 0.85} fill={BG} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function Ottoman({ w, h }: { w: number; h: number }) {
  const pad = Math.min(w, h) * 0.12;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={4} />
      <Rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Circle x={w / 2} y={h / 2} radius={3} fill={ST} strokeWidth={0} />
      <Line points={[w / 2, pad, w / 2, h - pad]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[pad, h / 2, w - pad, h / 2]} stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function Bench({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={6} y={4} width={w - 12} height={h - 8} fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={1} />
      <Rect x={4} y={h - 4} width={5} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - 9} y={h - 4} width={5} height={4} fill={ST} strokeWidth={0} />
    </>
  );
}

function SofaCurved({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h;
  const outerR = h - 2;
  const innerR = outerR * 0.55;
  const backR = outerR - (outerR - innerR) * 0.25;
  return (
    <>
      <Arc x={cx} y={cy} innerRadius={innerR} outerRadius={outerR}
        angle={180} rotation={180} fill={BG} stroke={ST} strokeWidth={LW} />
      <Arc x={cx} y={cy} innerRadius={backR} outerRadius={outerR - 2}
        angle={176} rotation={182} fill={BG} stroke={ST2} strokeWidth={LW2} />
      {[0, 1].map(i => {
        const a = ((i + 1) * 180 / 3) * Math.PI / 180 + Math.PI;
        const x1 = cx + Math.cos(a) * innerR;
        const y1 = cy + Math.sin(a) * innerR;
        const x2 = cx + Math.cos(a) * backR;
        const y2 = cy + Math.sin(a) * backR;
        return <Line key={i} points={[x1, y1, x2, y2]} stroke={ST2} strokeWidth={LW3} />;
      })}
      <Rect x={0} y={cy - outerR * 0.15} width={w * 0.06} height={outerR * 0.15}
        fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={w - w * 0.06} y={cy - outerR * 0.15} width={w * 0.06} height={outerR * 0.15}
        fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
    </>
  );
}

function SofaCurvedSmall({ w, h }: { w: number; h: number }) {
  const cx = w * 0.5;
  const cy = h * 1.1;
  const outerR = h * 0.95;
  const innerR = outerR * 0.55;
  const backR = outerR - (outerR - innerR) * 0.25;
  return (
    <>
      <Arc x={cx} y={cy} innerRadius={innerR} outerRadius={outerR}
        angle={140} rotation={200} fill={BG} stroke={ST} strokeWidth={LW} />
      <Arc x={cx} y={cy} innerRadius={backR} outerRadius={outerR - 2}
        angle={136} rotation={202} fill={BG} stroke={ST2} strokeWidth={LW2} />
      {[0].map(i => {
        const a = 270 * Math.PI / 180;
        const x1 = cx + Math.cos(a) * innerR;
        const y1 = cy + Math.sin(a) * innerR;
        const x2 = cx + Math.cos(a) * backR;
        const y2 = cy + Math.sin(a) * backR;
        return <Line key={i} points={[x1, y1, x2, y2]} stroke={ST2} strokeWidth={LW3} />;
      })}
    </>
  );
}

function SofaU({ w, h }: { w: number; h: number }) {
  const thick = w * 0.22;
  const backH = h * 0.28;
  const backCushion = backH * 0.35;
  const seatH = h - backH;
  return (
    <>
      <Rect x={0} y={0} width={w} height={backH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={2} y={2} width={w - 4} height={backCushion} fill={BG} stroke={ST2} strokeWidth={LW2} />
      {[0, 1, 2].map(i => (
        <Rect key={`b${i}`}
          x={thick + i * ((w - thick * 2) / 3) + 2} y={backCushion + 3}
          width={(w - thick * 2) / 3 - 4} height={backH - backCushion - 6}
          fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      ))}
      <Rect x={0} y={backH} width={thick} height={seatH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={2} y={backH + 2} width={thick * 0.35} height={seatH - 4} fill={BG} stroke={ST2} strokeWidth={LW2} />
      {[0, 1].map(i => (
        <Rect key={`l${i}`}
          x={thick * 0.4} y={backH + i * (seatH / 2) + 2}
          width={thick - thick * 0.4 - 3} height={seatH / 2 - 4}
          fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      ))}
      <Rect x={w - thick} y={backH} width={thick} height={seatH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={w - thick + 2} y={backH + 2} width={thick * 0.35} height={seatH - 4} fill={BG} stroke={ST2} strokeWidth={LW2} />
      {[0, 1].map(i => (
        <Rect key={`r${i}`}
          x={w - thick + thick * 0.4} y={backH + i * (seatH / 2) + 2}
          width={thick - thick * 0.4 - 3} height={seatH / 2 - 4}
          fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      ))}
    </>
  );
}

function SofaModular4({ w, h }: { w: number; h: number }) {
  const gap = 3;
  const unitW = (w - gap) / 2;
  const unitH = (h - gap) / 2;
  const back = 0.28;
  const modules: [number, number, number, number][] = [
    [0, 0, unitW, unitH],
    [unitW + gap, 0, unitW, unitH],
    [0, unitH + gap, unitW, unitH],
    [unitW + gap, unitH + gap, unitW, unitH],
  ];
  return (
    <>
      {modules.slice(0, 3).map(([mx, my, mw, mh], i) => {
        const bh = mh * back;
        return (
          <React.Fragment key={i}>
            <Rect x={mx} y={my} width={mw} height={mh} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
            <Rect x={mx + 2} y={my + 2} width={mw - 4} height={bh} fill={BG} stroke={ST2} strokeWidth={LW2} cornerRadius={1} />
            <Rect x={mx + 3} y={my + bh + 2} width={mw - 6} height={mh - bh - 5} fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
          </React.Fragment>
        );
      })}
      <Rect x={modules[3][0]} y={modules[3][1]} width={modules[3][2]} height={modules[3][3]}
        fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={modules[3][0] + 4} y={modules[3][1] + 4}
        width={modules[3][2] - 8} height={modules[3][3] - 8}
        fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={3} />
      <Line points={[modules[3][0] + modules[3][2] / 2, modules[3][1] + 4,
                      modules[3][0] + modules[3][2] / 2, modules[3][1] + modules[3][3] - 4]}
        stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function Loveseat({ w, h }: { w: number; h: number }) {
  const arm = w * 0.1;
  const back = h * 0.3;
  const cw = (w - arm * 2 - 2) / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={5} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      {[0, 1].map(i => (
        <Rect key={i} x={arm + i * (cw + 2)} y={back + 3} width={cw} height={h - back - 8}
          fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      ))}
      <Rect x={0} y={0} width={arm} height={h * 0.85} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={[5, 0, 0, 5] as any} />
      <Rect x={w - arm} y={0} width={arm} height={h * 0.85} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={[0, 5, 5, 0] as any} />
    </>
  );
}

function Daybed({ w, h }: { w: number; h: number }) {
  const back = h * 0.2;
  const arm = w * 0.08;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Rect x={0} y={0} width={arm} height={h * 0.9} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={arm + 2} y={back + 3} width={w - arm - 4} height={h - back - 6}
        fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      <Line points={[arm + 2, back + (h - back) * 0.7, w - 4, back + (h - back) * 0.7]}
        stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function AccentChair({ w, h }: { w: number; h: number }) {
  const arm = w * 0.15;
  const back = h * 0.3;
  const wingW = w * 0.2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={0} y={0} width={wingW} height={back + h * 0.15} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={[3, 0, 0, 0] as any} />
      <Rect x={w - wingW} y={0} width={wingW} height={back + h * 0.15} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={[0, 3, 0, 0] as any} />
      <Rect x={(wingW - arm) / 2} y={back + h * 0.15} width={arm} height={h - back - h * 0.15 - 4} fill={BG} stroke={ST2} strokeWidth={LW3} />
      <Rect x={w - (wingW + arm) / 2} y={back + h * 0.15} width={arm} height={h - back - h * 0.15 - 4} fill={BG} stroke={ST2} strokeWidth={LW3} />
      <Rect x={wingW} y={2} width={w - wingW * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm + 2} y={back + 2} width={w - arm * 2 - 4} height={h - back - 6}
        fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={3} />
    </>
  );
}

function OfficeChair({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) / 2 - 2;
  const cx = w / 2, cy = h / 2;
  const seatR = r * 0.72;
  const casterR = r * 0.08;
  return (
    <>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i * 72 - 90) * Math.PI / 180;
        const tipX = cx + Math.cos(a) * r;
        const tipY = cy + Math.sin(a) * r;
        return (
          <React.Fragment key={i}>
            <Line points={[cx, cy, tipX, tipY]} stroke={ST2} strokeWidth={LW2} />
            <Circle x={tipX} y={tipY} radius={casterR} fill={ST2} strokeWidth={0} />
          </React.Fragment>
        );
      })}
      <Circle x={cx} y={cy} radius={seatR} fill={BG} stroke={ST} strokeWidth={LW} />
      <Arc x={cx} y={cy} innerRadius={seatR * 0.6} outerRadius={seatR - 2}
        angle={120} rotation={210} fill={BG} stroke={ST2} strokeWidth={LW2} />
      <Circle x={cx} y={cy} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

function ClubChair({ w, h }: { w: number; h: number }) {
  const arm = w * 0.18;
  const back = h * 0.25;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={w * 0.2} />
      <Rect x={arm} y={back} width={w - arm * 2} height={h - back - 4}
        fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={4} />
      <Rect x={arm + 2} y={2} width={w - arm * 2 - 4} height={back}
        fill={BG} stroke={ST2} strokeWidth={LW2} cornerRadius={[w * 0.15, w * 0.15, 2, 2] as any} />
      <Circle x={w / 2} y={back + (h - back) / 2} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

function Recliner({ w, h }: { w: number; h: number }) {
  const arm = w * 0.15;
  const back = h * 0.22;
  const footrest = h * 0.2;
  const seatH = h - back - footrest;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={0} width={arm} height={h - footrest} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={0} width={arm} height={h - footrest} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={arm + 2} y={back + 2} width={w - arm * 2 - 4} height={seatH - 4}
        fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      <Line points={[arm * 0.5, h - footrest, w - arm * 0.5, h - footrest]}
        stroke={ST} strokeWidth={LW2} dash={[4, 3]} />
      <Rect x={arm + 2} y={h - footrest + 2} width={w - arm * 2 - 4} height={footrest - 5}
        fill={BG} stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
    </>
  );
}

function PapasanChair({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) / 2 - 2;
  const cx = w / 2, cy = h / 2;
  const cushionR = r * 0.82;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={BG} stroke={ST} strokeWidth={LW} />
      <Circle x={cx} y={cy} radius={r - 2} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={cushionR} fill={BG} stroke={ST} strokeWidth={LW2} />
      {[0, 1, 2, 3].map(i => {
        const a = (i * 90 + 45) * Math.PI / 180;
        return (
          <Line key={i}
            points={[
              cx + Math.cos(a) * cushionR * 0.2,
              cy + Math.sin(a) * cushionR * 0.2,
              cx + Math.cos(a) * cushionR * 0.85,
              cy + Math.sin(a) * cushionR * 0.85
            ]}
            stroke={ST2} strokeWidth={LW3} />
        );
      })}
      <Circle x={cx} y={cy} radius={cushionR * 0.18} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={2} fill={ST2} strokeWidth={0} />
    </>
  );
}

function DiningChairArm({ w, h }: { w: number; h: number }) {
  const back = h * 0.28;
  const arm = w * 0.14;
  const armH = h * 0.45;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back - 2} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={arm} y={back + 2} width={w - arm * 2} height={h - back - 6}
        fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={back * 0.5} width={arm} height={armH} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={back * 0.5} width={arm} height={armH} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={arm} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - arm - 4} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={arm} y={back + 2} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - arm - 4} y={back + 2} width={4} height={4} fill={ST} strokeWidth={0} />
    </>
  );
}

// ─── TABLES ──────────────────────────────────────────────────────────────────

function TableRect({ w, h }: { w: number; h: number }) {
  const edge = 4;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={edge} y={edge} width={w - edge * 2} height={h - edge * 2} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[0, 0, w, h]} stroke={ST2} strokeWidth={LW3} opacity={0.4} />
      <Line points={[w, 0, 0, h]} stroke={ST2} strokeWidth={LW3} opacity={0.4} />
      {([[4, 4], [w - 8, 4], [4, h - 8], [w - 8, h - 8]] as [number, number][]).map(([lx, ly], i) => (
        <Rect key={i} x={lx} y={ly} width={5} height={5} fill={ST} strokeWidth={0} />
      ))}
    </>
  );
}

function TableRound({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) / 2 - LW;
  const cx = w / 2, cy = h / 2;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={BG} stroke={ST} strokeWidth={LW} />
      <Circle x={cx} y={cy} radius={r - 5} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[cx - r * 0.5, cy, cx + r * 0.5, cy]} stroke={ST2} strokeWidth={LW3} opacity={0.5} />
      <Line points={[cx, cy - r * 0.5, cx, cy + r * 0.5]} stroke={ST2} strokeWidth={LW3} opacity={0.5} />
    </>
  );
}

function SideTable({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={1} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[0, 0, w, h]} stroke={ST2} strokeWidth={LW3} opacity={0.35} />
      <Line points={[w, 0, 0, h]} stroke={ST2} strokeWidth={LW3} opacity={0.35} />
    </>
  );
}

function Desk({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={w * 0.65} y={4} width={w * 0.32} height={h - 8} fill={BG} stroke={ST} strokeWidth={LW2} />
      {[0, 1, 2].map(i => (
        <Rect key={i} x={w * 0.65 + 3} y={4 + i * ((h - 8) / 3) + 2} width={w * 0.32 - 6} height={(h - 8) / 3 - 4} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      ))}
      <Rect x={3} y={3} width={w * 0.6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function Console({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Rect x={4} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - 8} y={h - 4} width={4} height={4} fill={ST} strokeWidth={0} />
    </>
  );
}

// ─── BEDS ────────────────────────────────────────────────────────────────────

function Bed({ w, h }: { w: number; h: number }) {
  const head = h * 0.18;
  const numPillows = w > 120 ? 2 : 1;
  const pillowW = (w - 20 - (numPillows - 1) * 8) / numPillows;
  const pillowH = head * 0.65;
  return (
    <>
      <Rect x={0} y={head} width={w} height={h - head} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={0} y={0} width={w} height={head} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[3, 3, 0, 0] as any} />
      <Rect x={4} y={3} width={w - 8} height={head - 5} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={1} />
      {Array.from({ length: numPillows }).map((_, i) => (
        <Rect key={i} x={10 + i * (pillowW + 8)} y={head + 6} width={pillowW} height={pillowH} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      ))}
      <Line points={[6, head + pillowH + 14, w - 6, head + pillowH + 14]} stroke={ST2} strokeWidth={LW2} />
      <Line points={[6, h - 20, w - 6, h - 20]} stroke={ST2} strokeWidth={LW3} opacity={0.5} />
      <Rect x={0} y={h - 8} width={7} height={8} fill={ST} strokeWidth={0} />
      <Rect x={w - 7} y={h - 8} width={7} height={8} fill={ST} strokeWidth={0} />
    </>
  );
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function Wardrobe({ w, h, doors }: { w: number; h: number; doors: number }) {
  const dw = w / doors;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {Array.from({ length: doors }).map((_, i) => (
        <React.Fragment key={i}>
          <Rect x={i * dw + 2} y={2} width={dw - 4} height={h - 4} fill={BG} stroke={ST} strokeWidth={LW2} />
          <Rect x={i * dw + dw * 0.5 - 1} y={h / 2 - 6} width={2} height={12} fill={ST} strokeWidth={0} />
        </React.Fragment>
      ))}
      <Line points={[0, 6, w, 6]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[0, h - 6, w, h - 6]} stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function Bookcase({ w, h }: { w: number; h: number }) {
  const shelves = 4;
  const sh = h / shelves;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {Array.from({ length: shelves - 1 }).map((_, i) => (
        <Line key={i} points={[3, (i + 1) * sh, w - 3, (i + 1) * sh]} stroke={ST2} strokeWidth={LW2} />
      ))}
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function Sideboard({ w, h }: { w: number; h: number }) {
  const dw = w / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={2} y={2} width={w - 4} height={h - 4} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, 2, w / 2, h - 2]} stroke={ST} strokeWidth={LW2} />
      <Line points={[dw * 0.5 - 8, h / 2, dw * 0.5 + 8, h / 2]} stroke={ST} strokeWidth={LW2 + 0.5} />
      <Line points={[dw + dw * 0.5 - 8, h / 2, dw + dw * 0.5 + 8, h / 2]} stroke={ST} strokeWidth={LW2 + 0.5} />
      <Rect x={4} y={h - 5} width={5} height={5} fill={ST} strokeWidth={0} />
      <Rect x={w - 9} y={h - 5} width={5} height={5} fill={ST} strokeWidth={0} />
    </>
  );
}

function TvUnit({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[w * 0.22, 3, w * 0.22, h - 3]} stroke={ST2} strokeWidth={LW2} />
      <Line points={[w * 0.78, 3, w * 0.78, h - 3]} stroke={ST2} strokeWidth={LW2} />
    </>
  );
}

function KitchenBase({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={h * 0.12} fill={ST2} stroke={ST} strokeWidth={LW3} opacity={0.4} />
      <Rect x={4} y={h * 0.2} width={w - 8} height={h - h * 0.2 - 4} fill="transparent" stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Line points={[w / 2 - 10, h * 0.55, w / 2 + 10, h * 0.55]} stroke={ST} strokeWidth={LW2 + 0.4} />
    </>
  );
}

function KitchenWall({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2 - 8, h / 2, w / 2 + 8, h / 2]} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function VanityUnit({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Ellipse x={w / 2} y={h / 2} radiusX={w * 0.32} radiusY={h * 0.3} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Circle x={w / 2} y={h / 2} radius={3} fill={ST2} strokeWidth={0} />
      <Rect x={4} y={h * 0.75} width={w - 8} height={h * 0.2} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function LinenCabinet({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, 3, w / 2, h - 3]} stroke={ST2} strokeWidth={LW2} />
      <Rect x={w / 4 - 1} y={h / 2 - 5} width={2} height={10} fill={ST2} strokeWidth={0} />
      <Rect x={w * 0.75 - 1} y={h / 2 - 5} width={2} height={10} fill={ST2} strokeWidth={0} />
    </>
  );
}

// ─── BATHROOM ────────────────────────────────────────────────────────────────

function BathtubFreestanding({ w, h }: { w: number; h: number }) {
  const px = w * 0.06, py = h * 0.08;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={h * 0.3} />
      <Rect x={px} y={py} width={w - px * 2} height={h - py * 2} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={h * 0.22} />
      <Circle x={w / 2} y={h * 0.65} radius={4} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Circle x={w / 2} y={h * 0.65} radius={1.5} fill={ST2} strokeWidth={0} />
      <Rect x={w / 2 - 3} y={py + 4} width={6} height={5} fill={ST2} stroke={ST2} strokeWidth={0.5} />
    </>
  );
}

function BathtubBuiltIn({ w, h }: { w: number; h: number }) {
  const wall = h * 0.1;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={wall} fill={ST2} stroke={ST} strokeWidth={LW2} opacity={0.5} />
      <Rect x={0} y={0} width={wall} height={h} fill={ST2} stroke={ST} strokeWidth={LW2} opacity={0.5} />
      <Rect x={w - wall} y={0} width={wall} height={h} fill={ST2} stroke={ST} strokeWidth={LW2} opacity={0.5} />
      <Rect x={wall + 4} y={wall + 4} width={w - wall * 2 - 8} height={h - wall - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={4} />
      <Circle x={w / 2} y={h * 0.7} radius={4} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Circle x={w / 2} y={h * 0.7} radius={1.5} fill={ST2} strokeWidth={0} />
    </>
  );
}

function Shower({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={3} fill={ST} strokeWidth={0} />
      <Rect x={0} y={0} width={3} height={h} fill={ST} strokeWidth={0} />
      <Rect x={w / 2 - 6} y={h / 2 - 6} width={12} height={12} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Line points={[w / 2 - 4, h / 2, w / 2 + 4, h / 2]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, h / 2 - 4, w / 2, h / 2 + 4]} stroke={ST2} strokeWidth={LW3} />
      <Circle x={w * 0.75} y={h * 0.25} radius={5} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function WcToilet({ w, h }: { w: number; h: number }) {
  const tankH = h * 0.28;
  const bowlW = w * 0.9;
  const bowlH = h * 0.65;
  const cx = w / 2;
  return (
    <>
      <Rect x={(w - bowlW) / 2 + 2} y={0} width={bowlW - 4} height={tankH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={(w - bowlW) / 2 + 5} y={3} width={bowlW - 14} height={tankH - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
      <Ellipse x={cx} y={tankH + bowlH / 2 + 2} radiusX={bowlW / 2} radiusY={bowlH / 2} fill={BG} stroke={ST} strokeWidth={LW} />
      <Ellipse x={cx} y={tankH + bowlH / 2 + 2} radiusX={bowlW * 0.38} radiusY={bowlH * 0.38} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[cx - 6, tankH + 3, cx + 6, tankH + 3]} stroke={ST2} strokeWidth={LW2} />
    </>
  );
}

function Bidet({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const topH = h * 0.25;
  return (
    <>
      <Rect x={cx - w * 0.35} y={0} width={w * 0.7} height={topH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Ellipse x={cx} y={topH + h * 0.37} radiusX={w * 0.44} radiusY={h * 0.38} fill={BG} stroke={ST} strokeWidth={LW} />
      <Ellipse x={cx} y={topH + h * 0.37} radiusX={w * 0.3} radiusY={h * 0.25} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={topH / 2} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

function Washbasin({ w, h }: { w: number; h: number }) {
  const cx = w / 2, cy = h / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Ellipse x={cx} y={cy + h * 0.05} radiusX={w * 0.38} radiusY={h * 0.36} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Circle x={cx} y={cy + h * 0.1} radius={4} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Circle x={cx} y={cy + h * 0.1} radius={1.5} fill={ST2} strokeWidth={0} />
      <Rect x={cx - 3} y={4} width={6} height={5} fill={ST2} strokeWidth={0} />
      <Line points={[cx - 7, 6, cx + 7, 6]} stroke={ST2} strokeWidth={LW2} />
    </>
  );
}

function DoubleWashbasin({ w, h }: { w: number; h: number }) {
  const cy = h / 2;
  const bx1 = w * 0.25, bx2 = w * 0.75;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Line points={[w / 2, 0, w / 2, h]} stroke={ST2} strokeWidth={LW3} />
      {[bx1, bx2].map((bx, i) => (
        <React.Fragment key={i}>
          <Ellipse x={bx} y={cy + h * 0.05} radiusX={w * 0.19} radiusY={h * 0.36} fill={BG} stroke={ST} strokeWidth={LW2} />
          <Circle x={bx} y={cy + h * 0.1} radius={3} fill="transparent" stroke={ST2} strokeWidth={LW2} />
          <Circle x={bx} y={cy + h * 0.1} radius={1} fill={ST2} strokeWidth={0} />
          <Rect x={bx - 3} y={4} width={6} height={4} fill={ST2} strokeWidth={0} />
        </React.Fragment>
      ))}
    </>
  );
}

// ─── GYM EQUIPMENT ──────────────────────────────────────────────────────────

function Treadmill({ w, h }: { w: number; h: number }) {
  const consoleH = h * 0.12;
  const beltPad = w * 0.1;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      {/* Console / display panel at front */}
      <Rect x={4} y={3} width={w - 8} height={consoleH} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Circle x={w / 2} y={3 + consoleH / 2} radius={Math.min(consoleH * 0.25, 4)} fill={ST2} strokeWidth={0} />
      {/* Running belt */}
      <Rect x={beltPad} y={consoleH + 8} width={w - beltPad * 2} height={h - consoleH - 16} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={4} />
      {/* Belt lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const lineY = consoleH + 8 + (i + 1) * ((h - consoleH - 16) / 6);
        return <Line key={i} points={[beltPad + 4, lineY, w - beltPad - 4, lineY]} stroke={ST2} strokeWidth={LW3} opacity={0.3} />;
      })}
      {/* Side rails */}
      <Rect x={2} y={consoleH + 4} width={beltPad - 4} height={h - consoleH - 10} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Rect x={w - beltPad + 2} y={consoleH + 4} width={beltPad - 4} height={h - consoleH - 10} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function SpinBike({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const wheelR = Math.min(w, h) * 0.14;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      {/* Frame center line */}
      <Line points={[cx, h * 0.15, cx, h * 0.85]} stroke={ST} strokeWidth={LW2} />
      {/* Front wheel / flywheel */}
      <Circle x={cx} y={h * 0.18} radius={wheelR} fill={BG} stroke={ST} strokeWidth={LW} />
      <Circle x={cx} y={h * 0.18} radius={wheelR * 0.4} fill={ST2} strokeWidth={0} />
      {/* Handlebar */}
      <Line points={[cx - w * 0.28, h * 0.15, cx + w * 0.28, h * 0.15]} stroke={ST} strokeWidth={LW * 1.5} />
      {/* Seat */}
      <Ellipse x={cx} y={h * 0.7} radiusX={w * 0.2} radiusY={h * 0.06} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} />
      {/* Seat post */}
      <Line points={[cx, h * 0.5, cx, h * 0.7]} stroke={ST} strokeWidth={LW2} />
      {/* Rear */}
      <Circle x={cx} y={h * 0.85} radius={wheelR * 0.6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      {/* Pedals */}
      <Line points={[cx - w * 0.22, h * 0.5, cx + w * 0.22, h * 0.5]} stroke={ST2} strokeWidth={LW2} />
      <Rect x={cx - w * 0.25} y={h * 0.48} width={w * 0.06} height={h * 0.04} fill={ST2} strokeWidth={0} />
      <Rect x={cx + w * 0.19} y={h * 0.48} width={w * 0.06} height={h * 0.04} fill={ST2} strokeWidth={0} />
    </>
  );
}

function RowingMachine({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const railW = w * 0.16;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      {/* Flywheel housing at front */}
      <Rect x={cx - w * 0.3} y={4} width={w * 0.6} height={h * 0.12} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Circle x={cx} y={4 + h * 0.06} radius={h * 0.035} fill={ST2} strokeWidth={0} />
      {/* Rail tracks */}
      <Rect x={cx - railW / 2} y={h * 0.15} width={railW} height={h * 0.7} fill="transparent" stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      {/* Sliding seat */}
      <Rect x={cx - w * 0.22} y={h * 0.45} width={w * 0.44} height={h * 0.1} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      {/* Foot rests */}
      <Rect x={cx - w * 0.32} y={h * 0.28} width={w * 0.12} height={h * 0.12} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Rect x={cx + w * 0.2} y={h * 0.28} width={w * 0.12} height={h * 0.12} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      {/* Rear stabilizer */}
      <Rect x={cx - w * 0.25} y={h * 0.88} width={w * 0.5} height={h * 0.06} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
    </>
  );
}

function Elliptical({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      {/* Console */}
      <Rect x={cx - w * 0.25} y={4} width={w * 0.5} height={h * 0.1} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Circle x={cx} y={4 + h * 0.05} radius={3} fill={ST2} strokeWidth={0} />
      {/* Handlebars */}
      <Line points={[w * 0.15, h * 0.12, w * 0.15, h * 0.45]} stroke={ST} strokeWidth={LW2} />
      <Line points={[w * 0.85, h * 0.12, w * 0.85, h * 0.45]} stroke={ST} strokeWidth={LW2} />
      {/* Pedal tracks (ovals) */}
      <Ellipse x={cx} y={h * 0.55} radiusX={w * 0.28} radiusY={h * 0.25} fill="transparent" stroke={ST} strokeWidth={LW2} />
      {/* Pedals */}
      <Rect x={cx - w * 0.32} y={h * 0.52} width={w * 0.15} height={h * 0.06} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={cx + w * 0.17} y={h * 0.52} width={w * 0.15} height={h * 0.06} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      {/* Rear base */}
      <Rect x={cx - w * 0.2} y={h * 0.88} width={w * 0.4} height={h * 0.06} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
    </>
  );
}

function CableMachine({ w, h }: { w: number; h: number }) {
  const stackW = w * 0.18;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {/* Left weight stack */}
      <Rect x={3} y={3} width={stackW} height={h - 6} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Line key={`l${i}`} points={[5, 3 + (i + 1) * ((h - 6) / 7), stackW + 1, 3 + (i + 1) * ((h - 6) / 7)]} stroke={ST2} strokeWidth={LW3} />
      ))}
      {/* Right weight stack */}
      <Rect x={w - stackW - 3} y={3} width={stackW} height={h - 6} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Line key={`r${i}`} points={[w - stackW - 1, 3 + (i + 1) * ((h - 6) / 7), w - 5, 3 + (i + 1) * ((h - 6) / 7)]} stroke={ST2} strokeWidth={LW3} />
      ))}
      {/* Center frame / crossbar */}
      <Rect x={stackW + 6} y={3} width={w - stackW * 2 - 12} height={h * 0.08} fill={ST2} stroke={ST} strokeWidth={LW2} opacity={0.6} />
      {/* Pulleys */}
      <Circle x={stackW + 10} y={h * 0.06} radius={4} fill={ST} strokeWidth={0} />
      <Circle x={w - stackW - 10} y={h * 0.06} radius={4} fill={ST} strokeWidth={0} />
      {/* Cable lines */}
      <Line points={[stackW + 10, h * 0.1, w / 2, h * 0.6]} stroke={ST2} strokeWidth={LW3} dash={[3, 3]} />
      <Line points={[w - stackW - 10, h * 0.1, w / 2, h * 0.6]} stroke={ST2} strokeWidth={LW3} dash={[3, 3]} />
      {/* Center area */}
      <Rect x={stackW + 6} y={h * 0.15} width={w - stackW * 2 - 12} height={h * 0.7} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function WeightBench({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const padW = w * 0.55;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      {/* Bench pad — seat area */}
      <Rect x={cx - padW / 2} y={h * 0.55} width={padW} height={h * 0.38} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      {/* Bench pad — back rest */}
      <Rect x={cx - padW / 2} y={h * 0.1} width={padW} height={h * 0.42} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      {/* Center seam */}
      <Line points={[cx, h * 0.12, cx, h * 0.91]} stroke={ST2} strokeWidth={LW3} />
      {/* Frame legs */}
      <Rect x={cx - w * 0.38} y={h * 0.05} width={w * 0.08} height={h * 0.15} fill={ST2} stroke={ST} strokeWidth={LW3} />
      <Rect x={cx + w * 0.3} y={h * 0.05} width={w * 0.08} height={h * 0.15} fill={ST2} stroke={ST} strokeWidth={LW3} />
      <Rect x={cx - w * 0.38} y={h * 0.82} width={w * 0.08} height={h * 0.12} fill={ST2} stroke={ST} strokeWidth={LW3} />
      <Rect x={cx + w * 0.3} y={h * 0.82} width={w * 0.08} height={h * 0.12} fill={ST2} stroke={ST} strokeWidth={LW3} />
    </>
  );
}

function PowerRack({ w, h }: { w: number; h: number }) {
  const postW = w * 0.08;
  const postH = h * 0.08;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {/* Four corner posts */}
      <Rect x={3} y={3} width={postW} height={postH} fill={ST2} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - postW - 3} y={3} width={postW} height={postH} fill={ST2} stroke={ST} strokeWidth={LW2} />
      <Rect x={3} y={h - postH - 3} width={postW} height={postH} fill={ST2} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - postW - 3} y={h - postH - 3} width={postW} height={postH} fill={ST2} stroke={ST} strokeWidth={LW2} />
      {/* Top cross beams */}
      <Line points={[3 + postW / 2, 3 + postH / 2, w - 3 - postW / 2, 3 + postH / 2]} stroke={ST} strokeWidth={LW * 1.5} />
      <Line points={[3 + postW / 2, h - 3 - postH / 2, w - 3 - postW / 2, h - 3 - postH / 2]} stroke={ST} strokeWidth={LW * 1.5} />
      {/* Side beams */}
      <Line points={[3 + postW / 2, 3 + postH, 3 + postW / 2, h - 3 - postH]} stroke={ST} strokeWidth={LW} />
      <Line points={[w - 3 - postW / 2, 3 + postH, w - 3 - postW / 2, h - 3 - postH]} stroke={ST} strokeWidth={LW} />
      {/* Bar holder pegs */}
      <Rect x={postW + 6} y={h * 0.35} width={w * 0.06} height={4} fill={ST} strokeWidth={0} />
      <Rect x={w - postW - 6 - w * 0.06} y={h * 0.35} width={w * 0.06} height={4} fill={ST} strokeWidth={0} />
      {/* Barbell */}
      <Line points={[0, h * 0.37, w, h * 0.37]} stroke={ST} strokeWidth={LW * 1.8} />
      <Circle x={w * 0.08} y={h * 0.37} radius={w * 0.06} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Circle x={w * 0.92} y={h * 0.37} radius={w * 0.06} fill="transparent" stroke={ST2} strokeWidth={LW2} />
    </>
  );
}

function DumbbellRack({ w, h }: { w: number; h: number }) {
  const shelfH = h * 0.4;
  const dbCount = Math.max(3, Math.floor(w / 25));
  const spacing = (w - 8) / dbCount;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {/* Top shelf */}
      <Rect x={3} y={3} width={w - 6} height={shelfH} fill="transparent" stroke={ST} strokeWidth={LW2} />
      {/* Bottom shelf */}
      <Rect x={3} y={h - shelfH - 3} width={w - 6} height={shelfH} fill="transparent" stroke={ST} strokeWidth={LW2} />
      {/* Dumbbells on top shelf */}
      {Array.from({ length: dbCount }).map((_, i) => {
        const dx = 4 + i * spacing + spacing / 2;
        const dy = 3 + shelfH / 2;
        return (
          <React.Fragment key={`t${i}`}>
            <Line points={[dx - spacing * 0.3, dy, dx + spacing * 0.3, dy]} stroke={ST} strokeWidth={LW * 1.5} />
            <Rect x={dx - spacing * 0.32} y={dy - 3} width={spacing * 0.12} height={6} fill={ST2} strokeWidth={0} />
            <Rect x={dx + spacing * 0.2} y={dy - 3} width={spacing * 0.12} height={6} fill={ST2} strokeWidth={0} />
          </React.Fragment>
        );
      })}
      {/* Dumbbells on bottom shelf */}
      {Array.from({ length: dbCount }).map((_, i) => {
        const dx = 4 + i * spacing + spacing / 2;
        const dy = h - 3 - shelfH / 2;
        return (
          <React.Fragment key={`b${i}`}>
            <Line points={[dx - spacing * 0.3, dy, dx + spacing * 0.3, dy]} stroke={ST} strokeWidth={LW * 1.5} />
            <Rect x={dx - spacing * 0.32} y={dy - 3} width={spacing * 0.12} height={6} fill={ST2} strokeWidth={0} />
            <Rect x={dx + spacing * 0.2} y={dy - 3} width={spacing * 0.12} height={6} fill={ST2} strokeWidth={0} />
          </React.Fragment>
        );
      })}
    </>
  );
}

function SmithMachine({ w, h }: { w: number; h: number }) {
  const postW = w * 0.06;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      {/* Left guide rail */}
      <Rect x={w * 0.12} y={4} width={postW} height={h - 8} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} />
      {/* Right guide rail */}
      <Rect x={w - w * 0.12 - postW} y={4} width={postW} height={h - 8} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} />
      {/* Top crossbar */}
      <Line points={[w * 0.12 + postW / 2, 6, w - w * 0.12 - postW / 2, 6]} stroke={ST} strokeWidth={LW * 1.5} />
      {/* Barbell on guides */}
      <Line points={[w * 0.05, h * 0.4, w * 0.95, h * 0.4]} stroke={ST} strokeWidth={LW * 2} />
      {/* Weight plates */}
      <Circle x={w * 0.07} y={h * 0.4} radius={w * 0.05} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Circle x={w * 0.93} y={h * 0.4} radius={w * 0.05} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      {/* Base platform */}
      <Rect x={w * 0.15} y={h * 0.7} width={w * 0.7} height={h * 0.22} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
      {/* Safety catches */}
      <Rect x={w * 0.12} y={h * 0.55} width={postW + 8} height={3} fill={ST} strokeWidth={0} />
      <Rect x={w - w * 0.12 - postW - 8} y={h * 0.55} width={postW + 8} height={3} fill={ST} strokeWidth={0} />
    </>
  );
}

function LegPress({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      {/* Seat / back rest area */}
      <Rect x={cx - w * 0.32} y={h * 0.55} width={w * 0.64} height={h * 0.38} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
      {/* Foot plate */}
      <Rect x={cx - w * 0.35} y={h * 0.08} width={w * 0.7} height={h * 0.18} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Line points={[cx, h * 0.08, cx, h * 0.26]} stroke={ST2} strokeWidth={LW3} />
      {/* Guide rails */}
      <Line points={[w * 0.2, h * 0.28, w * 0.2, h * 0.55]} stroke={ST} strokeWidth={LW2} />
      <Line points={[w * 0.8, h * 0.28, w * 0.8, h * 0.55]} stroke={ST} strokeWidth={LW2} />
      {/* Weight stack */}
      <Rect x={cx - w * 0.15} y={h * 0.3} width={w * 0.3} height={h * 0.15} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Line key={i} points={[cx - w * 0.12, h * 0.32 + i * (h * 0.04), cx + w * 0.12, h * 0.32 + i * (h * 0.04)]} stroke={ST2} strokeWidth={LW3} />
      ))}
    </>
  );
}

// ─── RECREATIONAL EQUIPMENT ──────────────────────────────────────────────────

function PoolTable({ w, h }: { w: number; h: number }) {
  const rail = Math.min(w, h) * 0.07;
  const pocketR = Math.min(w, h) * 0.04;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={rail} y={rail} width={w - rail * 2} height={h - rail * 2}
        fill="#2d6b3f" stroke={ST} strokeWidth={LW2} cornerRadius={1} />
      <Rect x={rail + 2} y={rail + 2} width={w - rail * 2 - 4} height={h - rail * 2 - 4}
        fill="transparent" stroke="#1a4a2a" strokeWidth={LW3} />
      <Circle x={rail} y={rail} radius={pocketR} fill={ST} />
      <Circle x={w - rail} y={rail} radius={pocketR} fill={ST} />
      <Circle x={rail} y={h - rail} radius={pocketR} fill={ST} />
      <Circle x={w - rail} y={h - rail} radius={pocketR} fill={ST} />
      <Circle x={w / 2} y={rail} radius={pocketR} fill={ST} />
      <Circle x={w / 2} y={h - rail} radius={pocketR} fill={ST} />
      <Line points={[rail + 4, h / 2, w - rail - 4, h / 2]} stroke="#1a4a2a" strokeWidth={LW3} />
      <Arc x={w / 2} y={h - rail - h * 0.18} innerRadius={0} outerRadius={w * 0.15}
        angle={180} rotation={0} fill="transparent" stroke="#1a4a2a" strokeWidth={LW3} />
      <Circle x={w / 2} y={h * 0.33} radius={2} fill="#1a4a2a" />
    </>
  );
}

function TableTennis({ w, h }: { w: number; h: number }) {
  const edge = Math.min(w, h) * 0.03;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={1} />
      <Rect x={edge} y={edge} width={w - edge * 2} height={h - edge * 2}
        fill="#1a5276" stroke={ST} strokeWidth={LW2} />
      <Line points={[edge, h / 2, w - edge, h / 2]} stroke="white" strokeWidth={LW} />
      <Rect x={-2} y={h / 2 - 2} width={4} height={4} fill={ST} />
      <Rect x={w - 2} y={h / 2 - 2} width={4} height={4} fill={ST} />
      <Line points={[w / 2, edge, w / 2, h - edge]} stroke="rgba(255,255,255,0.3)" strokeWidth={LW3} />
      <Rect x={edge + 1} y={edge + 1} width={w - edge * 2 - 2} height={h - edge * 2 - 2}
        fill="transparent" stroke="white" strokeWidth={LW3} />
    </>
  );
}

function Foosball({ w, h }: { w: number; h: number }) {
  const rail = w * 0.08;
  const rodCount = 8;
  const rodSpacing = (h - rail * 2) / (rodCount + 1);
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={rail} y={rail} width={w - rail * 2} height={h - rail * 2}
        fill="#2d6b3f" stroke={ST} strokeWidth={LW2} />
      {Array.from({ length: rodCount }).map((_, i) => {
        const y = rail + (i + 1) * rodSpacing;
        const players = i % 2 === 0 ? [0.3, 0.5, 0.7] : [0.35, 0.65];
        return (
          <React.Fragment key={i}>
            <Line points={[-2, y, w + 2, y]} stroke={ST2} strokeWidth={LW2} />
            {players.map((pos, j) => (
              <Rect key={j} x={rail + (w - rail * 2) * pos - 3} y={y - 2}
                width={6} height={4} fill={i % 2 === 0 ? '#c44' : '#44c'} stroke={ST} strokeWidth={LW3} />
            ))}
          </React.Fragment>
        );
      })}
      <Rect x={w / 2 - w * 0.12} y={rail - 2} width={w * 0.24} height={4}
        fill="transparent" stroke={ST} strokeWidth={LW2} />
      <Rect x={w / 2 - w * 0.12} y={h - rail - 2} width={w * 0.24} height={4}
        fill="transparent" stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function PinballMachine({ w, h }: { w: number; h: number }) {
  const cabinetH = h * 0.25;
  const playH = h - cabinetH;
  return (
    <>
      <Rect x={0} y={0} width={w} height={cabinetH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[3, 3, 0, 0] as any} />
      <Rect x={3} y={3} width={w - 6} height={cabinetH - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={w / 2} y={cabinetH / 2} radius={Math.min(w, cabinetH) * 0.12} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Rect x={0} y={cabinetH} width={w} height={playH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[0, 0, 2, 2] as any} />
      <Rect x={4} y={cabinetH + 4} width={w - 8} height={playH - 8}
        fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={2} />
      <Line points={[w * 0.25, h - playH * 0.15, w * 0.42, h - playH * 0.22]}
        stroke={ST} strokeWidth={LW} />
      <Line points={[w * 0.75, h - playH * 0.15, w * 0.58, h - playH * 0.22]}
        stroke={ST} strokeWidth={LW} />
      <Circle x={w * 0.3} y={cabinetH + playH * 0.35} radius={w * 0.07} fill="transparent" stroke={ST} strokeWidth={LW2} />
      <Circle x={w * 0.7} y={cabinetH + playH * 0.35} radius={w * 0.07} fill="transparent" stroke={ST} strokeWidth={LW2} />
      <Circle x={w * 0.5} y={cabinetH + playH * 0.25} radius={w * 0.07} fill="transparent" stroke={ST} strokeWidth={LW2} />
      <Line points={[w - 5, cabinetH + 6, w - 5, h - 6]} stroke={ST2} strokeWidth={LW2} />
    </>
  );
}

// ─── WELLNESS & SPA ─────────────────────────────────────────────────────────

function Sauna({ w, h }: { w: number; h: number }) {
  const wallT = Math.min(w, h) * 0.05;
  const benchD = Math.min(w, h) * 0.22;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={wallT} y={wallT} width={w - wallT * 2} height={h - wallT * 2}
        fill="#f5e6c8" stroke={ST} strokeWidth={LW2} />
      <Rect x={wallT} y={wallT} width={w - wallT * 2} height={benchD}
        fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={wallT} y={wallT + benchD} width={benchD} height={h - wallT * 2 - benchD}
        fill={BG} stroke={ST} strokeWidth={LW2} />
      {[0.25, 0.5, 0.75].map(p => (
        <Line key={`h${p}`} points={[wallT + benchD * 0.1, wallT + benchD * p, w - wallT - 2, wallT + benchD * p]}
          stroke={ST2} strokeWidth={LW3} />
      ))}
      {[0.25, 0.5, 0.75].map(p => (
        <Line key={`v${p}`} points={[wallT + benchD * p, wallT + benchD + 2, wallT + benchD * p, h - wallT - 2]}
          stroke={ST2} strokeWidth={LW3} />
      ))}
      <Rect x={w - wallT - w * 0.15} y={h - wallT - h * 0.15}
        width={w * 0.12} height={h * 0.12} fill="#c8a070" stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={w - wallT - w * 0.25} y={h - wallT} width={w * 0.2} height={wallT}
        fill="rgba(160,210,240,0.3)" stroke={ST} strokeWidth={LW3} />
    </>
  );
}

function SteamRoom({ w, h }: { w: number; h: number }) {
  const wallT = Math.min(w, h) * 0.05;
  const benchD = Math.min(w, h) * 0.2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      <Rect x={wallT} y={wallT} width={w - wallT * 2} height={h - wallT * 2}
        fill="#d4e6f0" stroke={ST} strokeWidth={LW2} />
      <Rect x={wallT} y={wallT} width={w - wallT * 2} height={benchD}
        fill={BG} stroke={ST} strokeWidth={LW2} />
      {[0.3, 0.6].map(p => (
        <Line key={p} points={[wallT + 2, wallT + benchD * p, w - wallT - 2, wallT + benchD * p]}
          stroke={ST2} strokeWidth={LW3} />
      ))}
      <Circle x={w - wallT - w * 0.1} y={h - wallT - h * 0.1}
        radius={Math.min(w, h) * 0.06} fill="#b0c4de" stroke={ST} strokeWidth={LW2} />
      <Line points={[w * 0.4, h * 0.5, w * 0.38, h * 0.42, w * 0.42, h * 0.35]}
        stroke="#90b0d0" strokeWidth={LW3} tension={0.5} />
      <Line points={[w * 0.55, h * 0.55, w * 0.53, h * 0.47, w * 0.57, h * 0.4]}
        stroke="#90b0d0" strokeWidth={LW3} tension={0.5} />
      <Line points={[w * 0.7, h * 0.5, w * 0.68, h * 0.42, w * 0.72, h * 0.35]}
        stroke="#90b0d0" strokeWidth={LW3} tension={0.5} />
      <Rect x={w * 0.35} y={h - wallT} width={w * 0.3} height={wallT}
        fill="rgba(160,210,240,0.3)" stroke={ST} strokeWidth={LW3} />
    </>
  );
}

function HotTub({ w, h }: { w: number; h: number }) {
  const r = Math.min(w, h) / 2 - 2;
  const cx = w / 2, cy = h / 2;
  const innerR = r * 0.85;
  const seatR = r * 0.7;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={BG} stroke={ST} strokeWidth={LW} />
      <Circle x={cx} y={cy} radius={r - 2} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={innerR} fill="rgba(160,210,240,0.2)" stroke={ST} strokeWidth={LW2} />
      {[0, 72, 144, 216, 288].map(deg => {
        const a = deg * Math.PI / 180;
        return (
          <Arc key={deg} x={cx + Math.cos(a) * seatR * 0.2} y={cy + Math.sin(a) * seatR * 0.2}
            innerRadius={seatR * 0.25} outerRadius={seatR * 0.45}
            angle={50} rotation={deg - 25}
            fill="transparent" stroke={ST2} strokeWidth={LW3} />
        );
      })}
      {[45, 135, 225, 315].map(deg => {
        const a = deg * Math.PI / 180;
        return <Circle key={deg} x={cx + Math.cos(a) * innerR * 0.7} y={cy + Math.sin(a) * innerR * 0.7}
          radius={2} fill="transparent" stroke={ST2} strokeWidth={LW3} />;
      })}
      <Circle x={cx} y={cy} radius={3} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

function MassageTable({ w, h }: { w: number; h: number }) {
  const padW = w * 0.85;
  const padX = (w - padW) / 2;
  const headRx = w * 0.3;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[w * 0.15, w * 0.15, 3, 3] as any} />
      <Rect x={padX} y={h * 0.12} width={padW} height={h * 0.82}
        fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={[padW * 0.15, padW * 0.15, 2, 2] as any} />
      <Ellipse x={w / 2} y={h * 0.06} radiusX={headRx} radiusY={h * 0.04}
        fill="transparent" stroke={ST} strokeWidth={LW2} />
      <Ellipse x={w / 2} y={h * 0.06} radiusX={headRx * 0.5} radiusY={h * 0.025}
        fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, h * 0.15, w / 2, h * 0.9]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, h * 0.6, w / 2 - padW * 0.25, h * 0.92]} stroke={ST2} strokeWidth={LW3} />
      <Line points={[w / 2, h * 0.6, w / 2 + padW * 0.25, h * 0.92]} stroke={ST2} strokeWidth={LW3} />
      <Rect x={padX + 2} y={h * 0.2} width={3} height={3} fill={ST} strokeWidth={0} />
      <Rect x={w - padX - 5} y={h * 0.2} width={3} height={3} fill={ST} strokeWidth={0} />
      <Rect x={padX + 2} y={h * 0.85} width={3} height={3} fill={ST} strokeWidth={0} />
      <Rect x={w - padX - 5} y={h * 0.85} width={3} height={3} fill={ST} strokeWidth={0} />
    </>
  );
}

function BarberChair({ w, h }: { w: number; h: number }) {
  const arm = w * 0.15;
  const back = h * 0.3;
  const baseR = Math.min(w, h) * 0.3;
  const cx = w / 2;
  return (
    <>
      <Circle x={cx} y={h * 0.65} radius={baseR} fill={BG} stroke={ST2} strokeWidth={LW3} />
      <Rect x={w * 0.2} y={h - 6} width={w * 0.6} height={6} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={0} width={w} height={h * 0.85} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={3} />
      <Rect x={arm} y={2} width={w - arm * 2} height={back} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={0} y={back * 0.5} width={arm} height={h * 0.4} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={w - arm} y={back * 0.5} width={arm} height={h * 0.4} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Rect x={arm + 2} y={back + 2} width={w - arm * 2 - 4} height={h * 0.85 - back - 6}
        fill={BG} stroke={ST} strokeWidth={LW3} cornerRadius={2} />
      <Circle x={cx} y={h * 0.65} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

// ─── ARCHITECTURAL ───────────────────────────────────────────────────────────

function Wall({ w, h }: { w: number; h: number }) {
  return (
    <Rect x={0} y={0} width={w} height={h} fill="#ffffff" stroke="#000000" strokeWidth={LW * 1.5} />
  );
}

function Door({ w, h, isDouble }: { w: number; h: number; isDouble?: boolean }) {
  const thick = 6;
  if (isDouble) {
    const hw = w / 2;
    return (
      <>
        <Rect x={0} y={0} width={w} height={thick} fill={ST} strokeWidth={0} />
        <Rect x={0} y={thick} width={thick} height={hw - thick} fill={BG} stroke={ST} strokeWidth={LW2} />
        <Rect x={w - thick} y={thick} width={thick} height={hw - thick} fill={BG} stroke={ST} strokeWidth={LW2} />
        <Arc x={0} y={thick} innerRadius={hw - thick} outerRadius={hw - thick} angle={90} rotation={0} stroke={ST} strokeWidth={LW2} opacity={0.5} />
        <Arc x={w} y={thick} innerRadius={hw - thick} outerRadius={hw - thick} angle={90} rotation={90} stroke={ST} strokeWidth={LW2} opacity={0.5} />
      </>
    );
  }
  return (
    <>
      <Rect x={0} y={0} width={w} height={thick} fill={ST} strokeWidth={0} />
      <Rect x={0} y={thick} width={thick} height={w - thick} fill={BG} stroke={ST} strokeWidth={LW2} />
      <Arc x={0} y={thick} innerRadius={w - thick} outerRadius={w - thick} angle={90} rotation={0} stroke={ST} strokeWidth={LW} />
      <Line points={[0, thick, w - thick, w]} stroke={ST} strokeWidth={LW} />
    </>
  );
}

function SlidingDoor({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={2} y={2} width={w / 2 - 2} height={h - 4} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Rect x={w / 2} y={2} width={w / 2 - 2} height={h - 4} fill="transparent" stroke={ST2} strokeWidth={LW2} />
      <Line points={[w * 0.15, h / 2, w * 0.35, h / 2]} stroke={ST} strokeWidth={LW2} />
      <Line points={[w * 0.65, h / 2, w * 0.85, h / 2]} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function Window({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={'#c8c0b0'} stroke={ST} strokeWidth={LW} />
      <Rect x={2} y={2} width={w - 4} height={h - 4} fill={'rgba(160,210,240,0.35)'} stroke={ST} strokeWidth={LW2} />
      <Line points={[w / 2, 2, w / 2, h - 2]} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function Staircase({ w, h }: { w: number; h: number }) {
  const steps = 10;
  const sh = h / steps;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={'#ddd8ce'} stroke={ST} strokeWidth={LW} />
      {Array.from({ length: steps }).map((_, i) => (
        <Line key={i} points={[0, i * sh, w, i * sh]} stroke={ST} strokeWidth={LW2} />
      ))}
      <Line points={[3, 0, 3, h]} stroke={ST} strokeWidth={LW} />
      <Line points={[w - 3, 0, w - 3, h]} stroke={ST} strokeWidth={LW} />
      <Line points={[w / 2, h - 12, w / 2, 12]} stroke={ST} strokeWidth={LW2} />
      <Line points={[w / 2 - 6, 20, w / 2, 12, w / 2 + 6, 20]} stroke={ST} strokeWidth={LW2} />
    </>
  );
}

function Column({ w, h, round }: { w: number; h: number; round?: boolean }) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 1;
  if (round) {
    return (
      <>
        <Circle x={cx} y={cy} radius={r} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW * 2} />
        <Circle x={cx} y={cy} radius={r - 3} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      </>
    );
  }
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={'#c8c4bc'} stroke={ST} strokeWidth={LW * 2} />
      <Rect x={2} y={2} width={w - 4} height={h - 4} fill="transparent" stroke={ST2} strokeWidth={LW3} />
    </>
  );
}

// ─── HOSPITALITY ─────────────────────────────────────────────────────────────

function ReceptionDesk({ w, h }: { w: number; h: number }) {
  const counter = h * 0.35;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={counter} fill={'#d4cfc6'} stroke={ST} strokeWidth={LW} />
      <Rect x={4} y={4} width={w - 8} height={counter - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      {[0, 1, 2, 3].map(i => (
        <Rect key={i}
          x={w * 0.1 + (i % 2) * (w * 0.4)}
          y={counter + 6 + Math.floor(i / 2) * ((h - counter - 12) / 2)}
          width={w * 0.35} height={(h - counter - 12) / 2 - 2}
          fill="transparent" stroke={ST2} strokeWidth={LW3}
        />
      ))}
    </>
  );
}

function Banquette({ w, h }: { w: number; h: number }) {
  const back = h * 0.35;
  const numCushions = Math.max(1, Math.floor(w / 60));
  const cw = w / numCushions;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={back} fill={BG} stroke={ST} strokeWidth={LW2} />
      {Array.from({ length: numCushions }).map((_, i) => (
        <Rect key={i} x={i * cw + 3} y={back + 3} width={cw - 6} height={h - back - 6} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      ))}
    </>
  );
}

function RestaurantBooth({ w, h }: { w: number; h: number }) {
  const seatH = h * 0.28;
  const tableW = w * 0.55, tableH = h * 0.35;
  const tableX = (w - tableW) / 2, tableY = (h - tableH) / 2;
  return (
    <>
      <Rect x={0} y={0} width={w} height={seatH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[3, 3, 0, 0] as any} />
      <Rect x={0} y={h - seatH} width={w} height={seatH} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={[0, 0, 3, 3] as any} />
      <Rect x={tableX} y={tableY} width={tableW} height={tableH} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Line points={[tableX, tableY, tableX + tableW, tableY + tableH]} stroke={ST2} strokeWidth={LW3} opacity={0.4} />
      <Line points={[tableX + tableW, tableY, tableX, tableY + tableH]} stroke={ST2} strokeWidth={LW3} opacity={0.4} />
    </>
  );
}

function BarCounter({ w, h }: { w: number; h: number }) {
  const counter = h * 0.3;
  const cells = Math.max(1, Math.ceil(w / 50));
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={w} height={counter} fill={'#ccc6bc'} stroke={ST} strokeWidth={LW} />
      <Rect x={3} y={3} width={w - 6} height={counter - 5} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      {Array.from({ length: cells }).map((_, i) => (
        <Rect key={i} x={i * (w / cells) + 3} y={counter + 3} width={w / cells - 6} height={h - counter - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      ))}
    </>
  );
}

function BarCounterL({ w, h }: { w: number; h: number }) {
  const thick = Math.min(w, h) * 0.22;
  const counter = thick * 0.3;
  return (
    <>
      <Rect x={0} y={h - thick} width={w} height={thick} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={h - thick} width={w} height={counter} fill={'#ccc6bc'} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={thick} height={h - thick} fill={BG} stroke={ST} strokeWidth={LW} />
      <Rect x={0} y={0} width={counter} height={h - thick} fill={'#ccc6bc'} stroke={ST} strokeWidth={LW} />
    </>
  );
}

function MajlisSeating({ w, h }: { w: number; h: number }) {
  const back = h * 0.3;
  const numCushions = Math.max(1, Math.floor(w / 60));
  const cw = w / numCushions;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={'#d8cfc0'} stroke={ST} strokeWidth={LW} />
      {Array.from({ length: numCushions }).map((_, i) => (
        <Rect key={i} x={i * cw + 2} y={2} width={cw - 4} height={back - 2} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      ))}
      <Rect x={4} y={back + 4} width={w - 8} height={h - back - 8} fill={BG} stroke={ST} strokeWidth={LW2} cornerRadius={3} />
    </>
  );
}

function MajlisCushion({ w, h }: { w: number; h: number }) {
  const pad = 5;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={'#d8cfc0'} stroke={ST} strokeWidth={LW} cornerRadius={5} />
      <Rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={3} />
      <Circle x={w / 2} y={h / 2} radius={3} fill={ST2} opacity={0.5} strokeWidth={0} />
      <Line points={[w / 2, pad, w / 2, h - pad]} stroke={ST2} strokeWidth={LW3} opacity={0.3} />
      <Line points={[pad, h / 2, w - pad, h / 2]} stroke={ST2} strokeWidth={LW3} opacity={0.3} />
    </>
  );
}

function ConciergePodum({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={6} />
      <Rect x={4} y={4} width={w - 8} height={h - 8} fill="transparent" stroke={ST2} strokeWidth={LW3} cornerRadius={4} />
      <Rect x={8} y={8} width={w - 16} height={h * 0.35} fill={'#ccc6bc'} stroke={ST} strokeWidth={LW2} cornerRadius={2} />
      <Rect x={w / 2 - 4} y={h * 0.45} width={8} height={h * 0.45} fill={ST2} stroke={ST} strokeWidth={LW3} opacity={0.5} />
    </>
  );
}

// ─── PLANTS ─────────────────────────────────────────────────────────────────

function PlantRound({ w, h }: { w: number; h: number }) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - LW;
  const potR = r * 0.35;
  const leafCount = 7;
  return (
    <>
      <Circle x={cx} y={cy} radius={r} fill={BG} stroke={ST} strokeWidth={LW} />
      {Array.from({ length: leafCount }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / leafCount - Math.PI / 2;
        const leafLen = r * 0.55;
        const leafMidX = cx + Math.cos(angle) * (potR + leafLen * 0.5);
        const leafMidY = cy + Math.sin(angle) * (potR + leafLen * 0.5);
        const tipX = cx + Math.cos(angle) * (r - 3);
        const tipY = cy + Math.sin(angle) * (r - 3);
        const baseX = cx + Math.cos(angle) * (potR + 2);
        const baseY = cy + Math.sin(angle) * (potR + 2);
        const perpX = -Math.sin(angle) * leafLen * 0.22;
        const perpY = Math.cos(angle) * leafLen * 0.22;
        return (
          <React.Fragment key={i}>
            <Line
              points={[baseX, baseY, leafMidX + perpX, leafMidY + perpY, tipX, tipY, leafMidX - perpX, leafMidY - perpY]}
              closed fill={'#c8dbb8'} stroke={ST2} strokeWidth={LW2}
            />
            <Line points={[baseX, baseY, tipX, tipY]} stroke={ST2} strokeWidth={LW3} />
          </React.Fragment>
        );
      })}
      <Circle x={cx} y={cy} radius={potR} fill={BG} stroke={ST} strokeWidth={LW} />
      <Circle x={cx} y={cy} radius={potR - 3} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

function PlantSquare({ w, h }: { w: number; h: number }) {
  const cx = w / 2, cy = h / 2;
  const potPad = Math.min(w, h) * 0.25;
  const potR = Math.min(w, h) * 0.17;
  const leafCount = 7;
  const maxR = Math.min(w, h) / 2 - 3;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
      {Array.from({ length: leafCount }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / leafCount - Math.PI / 2;
        const leafLen = maxR * 0.55;
        const leafMidX = cx + Math.cos(angle) * (potR + leafLen * 0.5);
        const leafMidY = cy + Math.sin(angle) * (potR + leafLen * 0.5);
        const tipX = cx + Math.cos(angle) * (maxR - 2);
        const tipY = cy + Math.sin(angle) * (maxR - 2);
        const baseX = cx + Math.cos(angle) * (potR + 2);
        const baseY = cy + Math.sin(angle) * (potR + 2);
        const perpX = -Math.sin(angle) * leafLen * 0.22;
        const perpY = Math.cos(angle) * leafLen * 0.22;
        return (
          <React.Fragment key={i}>
            <Line
              points={[baseX, baseY, leafMidX + perpX, leafMidY + perpY, tipX, tipY, leafMidX - perpX, leafMidY - perpY]}
              closed fill={'#c8dbb8'} stroke={ST2} strokeWidth={LW2}
            />
            <Line points={[baseX, baseY, tipX, tipY]} stroke={ST2} strokeWidth={LW3} />
          </React.Fragment>
        );
      })}
      <Rect x={potPad} y={potPad} width={w - potPad * 2} height={h - potPad * 2} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={1} />
      <Rect x={potPad + 3} y={potPad + 3} width={w - potPad * 2 - 6} height={h - potPad * 2 - 6} fill="transparent" stroke={ST2} strokeWidth={LW3} />
      <Circle x={cx} y={cy} radius={3} fill={ST2} strokeWidth={0} />
    </>
  );
}

// ─── SHAPE DISPATCH ───────────────────────────────────────────────────────────

function ShapeContent({ item }: { item: CanvasItem }) {
  const w = item.widthPx;
  const h = item.heightPx;

  switch (item.defId) {
    case 'armchair':          return <Armchair w={w} h={h} />;
    case 'lounge-chair':      return <Armchair w={w} h={h} />;
    case 'sofa-2':            return <Sofa2 w={w} h={h} />;
    case 'sofa-3':            return <Sofa3 w={w} h={h} />;
    case 'sofa-l':            return <SofaL w={w} h={h} />;
    case 'dining-chair':      return <DiningChair w={w} h={h} />;
    case 'bar-stool':         return <BarStool w={w} h={h} />;
    case 'chaise':            return <Chaise w={w} h={h} />;
    case 'ottoman':           return <Ottoman w={w} h={h} />;
    case 'bench':             return <Bench w={w} h={h} />;
    case 'sofa-curved':       return <SofaCurved w={w} h={h} />;
    case 'sofa-curved-small': return <SofaCurvedSmall w={w} h={h} />;
    case 'sofa-u':            return <SofaU w={w} h={h} />;
    case 'sofa-modular-4':    return <SofaModular4 w={w} h={h} />;
    case 'loveseat':          return <Loveseat w={w} h={h} />;
    case 'daybed':            return <Daybed w={w} h={h} />;
    case 'accent-chair':      return <AccentChair w={w} h={h} />;
    case 'office-chair':      return <OfficeChair w={w} h={h} />;
    case 'club-chair':        return <ClubChair w={w} h={h} />;
    case 'recliner':          return <Recliner w={w} h={h} />;
    case 'papasan':           return <PapasanChair w={w} h={h} />;
    case 'dining-chair-arm':  return <DiningChairArm w={w} h={h} />;
    case 'coffee-round':      return <TableRound w={w} h={h} />;
    case 'dining-round-4':    return <TableRound w={w} h={h} />;
    case 'coffee-rect':       return <TableRect w={w} h={h} />;
    case 'side-table':        return <SideTable w={w} h={h} />;
    case 'dining-4':          return <TableRect w={w} h={h} />;
    case 'dining-6':          return <TableRect w={w} h={h} />;
    case 'dining-8':          return <TableRect w={w} h={h} />;
    case 'boardroom':         return <TableRect w={w} h={h} />;
    case 'console':           return <Console w={w} h={h} />;
    case 'desk':              return <Desk w={w} h={h} />;
    case 'bed-single':        return <Bed w={w} h={h} />;
    case 'bed-double':        return <Bed w={w} h={h} />;
    case 'bed-queen':         return <Bed w={w} h={h} />;
    case 'bed-king':          return <Bed w={w} h={h} />;
    case 'bed-superking':     return <Bed w={w} h={h} />;
    case 'wardrobe-single':   return <Wardrobe w={w} h={h} doors={1} />;
    case 'wardrobe-double':   return <Wardrobe w={w} h={h} doors={2} />;
    case 'wardrobe-triple':   return <Wardrobe w={w} h={h} doors={3} />;
    case 'bookcase':          return <Bookcase w={w} h={h} />;
    case 'sideboard':         return <Sideboard w={w} h={h} />;
    case 'tv-unit':           return <TvUnit w={w} h={h} />;
    case 'kitchen-base':      return <KitchenBase w={w} h={h} />;
    case 'kitchen-wall':      return <KitchenWall w={w} h={h} />;
    case 'vanity':            return <VanityUnit w={w} h={h} />;
    case 'linen-cabinet':     return <LinenCabinet w={w} h={h} />;
    case 'bath-freestanding': return <BathtubFreestanding w={w} h={h} />;
    case 'bath-builtin':      return <BathtubBuiltIn w={w} h={h} />;
    case 'shower':            return <Shower w={w} h={h} />;
    case 'wc':                return <WcToilet w={w} h={h} />;
    case 'bidet':             return <Bidet w={w} h={h} />;
    case 'basin-single':      return <Washbasin w={w} h={h} />;
    case 'basin-double':      return <DoubleWashbasin w={w} h={h} />;
    case 'reception-desk':    return <ReceptionDesk w={w} h={h} />;
    case 'concierge':         return <ConciergePodum w={w} h={h} />;
    case 'banquette':         return <Banquette w={w} h={h} />;
    case 'restaurant-booth':  return <RestaurantBooth w={w} h={h} />;
    case 'bar-straight':      return <BarCounter w={w} h={h} />;
    case 'bar-l':             return <BarCounterL w={w} h={h} />;
    case 'majlis-seating':    return <MajlisSeating w={w} h={h} />;
    case 'majlis-cushion':    return <MajlisCushion w={w} h={h} />;
    case 'lobby-cluster':     return <TableRect w={w} h={h} />;
    case 'hotel-bed-set':     return <Bed w={w} h={h} />;
    case 'plant-round':       return <PlantRound w={w} h={h} />;
    case 'plant-square':      return <PlantSquare w={w} h={h} />;
    case 'treadmill':         return <Treadmill w={w} h={h} />;
    case 'spin-bike':         return <SpinBike w={w} h={h} />;
    case 'rowing-machine':    return <RowingMachine w={w} h={h} />;
    case 'elliptical':        return <Elliptical w={w} h={h} />;
    case 'cable-machine':     return <CableMachine w={w} h={h} />;
    case 'weight-bench':      return <WeightBench w={w} h={h} />;
    case 'power-rack':        return <PowerRack w={w} h={h} />;
    case 'dumbbell-rack':     return <DumbbellRack w={w} h={h} />;
    case 'smith-machine':     return <SmithMachine w={w} h={h} />;
    case 'leg-press':         return <LegPress w={w} h={h} />;
    case 'pool-table':        return <PoolTable w={w} h={h} />;
    case 'billiards-table':   return <PoolTable w={w} h={h} />;
    case 'table-tennis':      return <TableTennis w={w} h={h} />;
    case 'foosball':          return <Foosball w={w} h={h} />;
    case 'pinball-machine':   return <PinballMachine w={w} h={h} />;
    case 'sauna':             return <Sauna w={w} h={h} />;
    case 'steam-room':        return <SteamRoom w={w} h={h} />;
    case 'hot-tub':           return <HotTub w={w} h={h} />;
    case 'massage-table':     return <MassageTable w={w} h={h} />;
    case 'barber-chair':      return <BarberChair w={w} h={h} />;
    case 'wall':              return <Wall w={w} h={h} />;
    case 'door-single':       return <Door w={w} h={h} />;
    case 'door-double':       return <Door w={w} h={h} isDouble />;
    case 'sliding-door':      return <SlidingDoor w={w} h={h} />;
    case 'window':            return <Window w={w} h={h} />;
    case 'stair':             return <Staircase w={w} h={h} />;
    case 'column-sq':         return <Column w={w} h={h} />;
    case 'column-round':      return <Column w={w} h={h} round />;
    default:
      return (
        <>
          <Rect x={0} y={0} width={w} height={h} fill={BG} stroke={ST} strokeWidth={LW} cornerRadius={2} />
          <Rect x={4} y={4} width={w - 8} height={h - 8} fill="transparent" stroke={ST2} strokeWidth={LW3} />
          <Line points={[0, 0, w, h]} stroke={ST2} strokeWidth={LW3} opacity={0.3} />
          <Line points={[w, 0, 0, h]} stroke={ST2} strokeWidth={LW3} opacity={0.3} />
        </>
      );
  }
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function FurnitureShape({
  item, isSelected, onSelect, onDragStart, onDragEnd, onContextMenu, draggable, showDimensions
}: Props) {
  // Load image for pasted screenshot items
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!item.imageData) { setLoadedImage(null); return; }
    const img = new window.Image();
    img.onload = () => setLoadedImage(img);
    img.src = item.imageData;
  }, [item.imageData]);

  const showLabel = item.label && item.label.trim().length > 0;

  // Format dimension text: W × D in cm or m
  const dimText = (() => {
    if (!showDimensions) return '';
    const w = item.widthCm;
    const h = item.heightCm;
    const fmt = (v: number) => v >= 100 ? `${(v / 100).toFixed(1)}m` : `${Math.round(v)}`;
    return `${fmt(w)} × ${fmt(h)}`;
  })();

  // Flip offsets: when flipping, shift the inner group so visuals stay in place
  const flipSx = item.flipH ? -1 : 1;
  const flipSy = item.flipV ? -1 : 1;
  const flipOffX = item.flipH ? item.widthPx : 0;
  const flipOffY = item.flipV ? item.heightPx : 0;

  return (
    <Group
      id={item.id}
      x={item.x}
      y={item.y}
      width={item.widthPx}
      height={item.heightPx}
      rotation={item.rotation}
      opacity={item.opacity}
      draggable={draggable && !item.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={e => onDragEnd(e.target.x(), e.target.y())}
      onContextMenu={onContextMenu}
    >
      {/* Inner group applies flip transform to visual content only */}
      <Group
        scaleX={flipSx}
        scaleY={flipSy}
        x={flipOffX}
        y={flipOffY}
      >
        {/* Render grouped children, pasted image, or single shape */}
        {item.imageData ? (
          <>
            {/* Pasted screenshot / image */}
            {loadedImage && (
              <KonvaImage
                image={loadedImage}
                x={0} y={0}
                width={item.widthPx}
                height={item.heightPx}
              />
            )}
            {/* Thin border around pasted images */}
            <Rect
              x={0} y={0}
              width={item.widthPx} height={item.heightPx}
              fill="transparent"
              stroke={ST2}
              strokeWidth={LW3}
              listening={false}
            />
          </>
        ) : item.isGroup && item.groupItems ? (
          <>
            {/* Light bounding rect for group */}
            <Rect
              x={0} y={0}
              width={item.widthPx} height={item.heightPx}
              fill="transparent"
              stroke={ST2}
              strokeWidth={LW3}
              dash={[4, 4]}
              listening={false}
              opacity={0.3}
            />
            {/* Render each child item with its own position/rotation */}
            {item.groupItems.map(child => (
              <Group key={child.id} x={child.x} y={child.y} rotation={child.rotation}>
                <ShapeContent item={child} />
                {/* Child fill tint */}
                {child.fill && child.fill !== BG && (
                  <Rect x={0} y={0} width={child.widthPx} height={child.heightPx}
                    fill={child.fill} opacity={0.35} cornerRadius={3} listening={false} />
                )}
              </Group>
            ))}
          </>
        ) : (
          <>
            <ShapeContent item={item} />
            {/* User colour tint — rendered ON TOP of shapes so it's clearly visible */}
            {/* Skip tint for walls — they must stay solid black */}
            {item.defId !== 'wall' && item.fill && item.fill !== BG && (
              <Rect x={0} y={0} width={item.widthPx} height={item.heightPx}
                fill={item.fill} opacity={0.35} cornerRadius={3} listening={false} />
            )}
          </>
        )}
      </Group>

      {/* Selection highlight (outside flip group so it's never flipped) */}
      {isSelected && (
        <Rect
          x={-2} y={-2}
          width={item.widthPx + 4} height={item.heightPx + 4}
          fill="transparent"
          stroke="#e8b86d"
          strokeWidth={1.5}
          dash={[5, 3]}
          listening={false}
        />
      )}

      {/* Dimension label centred on item (outside flip group) */}
      {showDimensions && dimText && (
        <Group x={item.widthPx / 2} y={item.heightPx / 2} listening={false}>
          <Rect
            x={-(dimText.length * 3.5 + 6)}
            y={-7}
            width={dimText.length * 7 + 12}
            height={14}
            fill="rgba(255,255,255,0.8)"
            cornerRadius={3}
          />
          <Text
            x={-(dimText.length * 3.5 + 6)}
            y={-5}
            width={dimText.length * 7 + 12}
            text={dimText}
            fontSize={10}
            fill="#333333"
            fontStyle="bold"
            align="center"
          />
        </Group>
      )}

      {/* Label below item (outside flip group) */}
      {showLabel && (
        <Text
          x={0} y={item.heightPx + 5}
          width={item.widthPx}
          text={item.label}
          fontSize={10}
          fill="#000000"
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}
