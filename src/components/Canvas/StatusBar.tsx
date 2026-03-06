import React, { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';

export default function StatusBar() {
  const { state } = useApp();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const ppm = state.scale.pixelsPerMeter;
  const cursorCmX = ((cursor.x - state.stageX) / state.stageScale / ppm * 100).toFixed(0);
  const cursorCmY = ((cursor.y - state.stageY) / state.stageScale / ppm * 100).toFixed(0);

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
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
        {state.currentTool === 'measure'
          ? 'Click 2 points to measure | Esc: clear | M: toggle measure'
          : 'Del: Delete | Arrows: Nudge | Ctrl+G: Group | Ctrl+Z: Undo | M: Measure'
        }
      </span>
    </div>
  );
}
