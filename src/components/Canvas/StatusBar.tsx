import React, { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';

// FIX #3.2 (code quality audit): shows "Auto-saved N s ago".
interface Props {
  lastAutoSaveAt?: number | null;
}

export default function StatusBar({ lastAutoSaveAt }: Props) {
  const { state } = useApp();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  // FIX #3.2: force a re-render every 10 s so "5 s ago" ticks upward.
  const [, forceTick] = useState(0);

  // FIX #1.10 (code quality audit): rAF-throttle the mousemove-driven
  // coordinate readout. Previously every mousemove fired setState directly,
  // causing 60 renders/sec of this whole component.
  useEffect(() => {
    let latest: { x: number; y: number } | null = null;
    let rafId: number | null = null;
    const flush = () => {
      rafId = null;
      if (latest) setCursor(latest);
    };
    const handler = (e: MouseEvent) => {
      latest = { x: e.clientX, y: e.clientY };
      if (rafId == null) rafId = requestAnimationFrame(flush);
    };
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!lastAutoSaveAt) return;
    const id = window.setInterval(() => forceTick(n => n + 1), 10_000);
    return () => window.clearInterval(id);
  }, [lastAutoSaveAt]);

  const ppm = state.scale.pixelsPerMeter;
  const cursorCmX = ((cursor.x - state.stageX) / state.stageScale / ppm * 100).toFixed(0);
  const cursorCmY = ((cursor.y - state.stageY) / state.stageScale / ppm * 100).toFixed(0);

  const savedLabel = (() => {
    if (!lastAutoSaveAt) return null;
    const sec = Math.max(0, Math.floor((Date.now() - lastAutoSaveAt) / 1000));
    if (sec < 5) return 'Auto-saved just now';
    if (sec < 60) return `Auto-saved ${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `Auto-saved ${min}m ago`;
  })();

  return (
    <div className="status-bar">
      <span>Zoom: {(state.stageScale * 100).toFixed(0)}%</span>
      <span>·</span>
      <span>Cursor: {cursorCmX}cm, {cursorCmY}cm</span>
      <span>·</span>
      <span>Items: {state.items.length}</span>
      {state.selectedIds.length > 0 && (
        <>
          <span>·</span>
          <span style={{ color: 'var(--accent)' }}>{state.selectedIds.length} selected</span>
        </>
      )}
      {state.scale.calibrated && (
        <>
          <span>·</span>
          <span style={{ color: '#68d391' }}>
            Scale: {state.scale.pixelsPerMeter.toFixed(1)} px/m
          </span>
        </>
      )}
      {!state.scale.calibrated && (
        <>
          <span>·</span>
          <span style={{ color: '#f6ad55' }}>Scale not calibrated</span>
        </>
      )}
      {state.measurementLines.length > 0 && (
        <>
          <span>·</span>
          <span style={{ color: 'var(--accent)' }}>
            📐 {state.measurementLines.length} measurement{state.measurementLines.length !== 1 ? 's' : ''}
          </span>
        </>
      )}
      {savedLabel && (
        <>
          <span>·</span>
          <span style={{ color: '#68d391' }}>{savedLabel}</span>
        </>
      )}
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
        {state.currentTool === 'measure'
          ? 'Click 2 points to measure | Esc: clear | M: toggle measure'
          : 'Del: Delete | Arrows: Nudge | Ctrl+G: Group | Ctrl+Z: Undo | ?: Shortcuts'
        }
      </span>
    </div>
  );
}
