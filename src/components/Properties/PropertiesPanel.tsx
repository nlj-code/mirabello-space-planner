import React, { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';

const COLORS = [
  '#7c9ab5', '#8fbc8f', '#d4a5a5', '#b8a87a', '#a5c8d4',
  '#c5a5d4', '#8a9bb0', '#e8b86d', '#f4a261', '#e76f51',
  '#2a9d8f', '#264653', '#6d6875', '#b5838d', '#e5989b',
  '#ffffff', '#cccccc', '#888888', '#444444', '#222222',
];

export default function PropertiesPanel() {
  const { state, dispatch, pushHistory } = useApp();

  const selectedId = state.selectedIds.length === 1 ? state.selectedIds[0] : null;
  const item = selectedId ? state.items.find(i => i.id === selectedId) : null;

  const [localW, setLocalW] = useState('');
  const [localH, setLocalH] = useState('');
  const [localRot, setLocalRot] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [localOpacity, setLocalOpacity] = useState(100);

  // Listen for live transform preview (broadcast from CanvasStage via CustomEvent)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.widthCm != null) {
        setLocalW(detail.widthCm.toFixed(1));
        setLocalH(detail.heightCm.toFixed(1));
      }
    };
    window.addEventListener('transform-preview', handler);
    return () => window.removeEventListener('transform-preview', handler);
  }, []);

  useEffect(() => {
    if (item) {
      setLocalW(item.widthCm.toFixed(1));
      setLocalH(item.heightCm.toFixed(1));
      setLocalRot(item.rotation.toFixed(1));
      setLocalLabel(item.label);
      setLocalOpacity(Math.round(item.opacity * 100));
    } else {
      // Reset local state when no single item is selected (e.g. multi-select or deselect)
      setLocalW('');
      setLocalH('');
      setLocalRot('');
      setLocalLabel('');
      setLocalOpacity(100);
    }
  }, [item?.id, item?.widthCm, item?.heightCm, item?.rotation, item?.label, item?.opacity]);

  if (state.selectedIds.length > 1) {
    return (
      <div style={{
        width: 220, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div className="section-header">Properties</div>
        <div style={{ padding: 16 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {state.selectedIds.length} items selected
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => {
              pushHistory();
              dispatch({ type: 'GROUP_ITEMS', ids: state.selectedIds });
            }}
          >
            Group Items (G)
          </button>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 8, width: '100%', color: '#fc8181' }}
            onClick={() => {
              pushHistory();
              dispatch({ type: 'DELETE_ITEMS', ids: state.selectedIds });
            }}
          >
            Delete Selected
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{
        width: 220, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div className="section-header">Properties</div>
        <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Select an item to edit its properties
        </div>
      </div>
    );
  }

  const applyW = () => {
    const w = parseFloat(localW);
    if (isNaN(w) || w <= 0) return;
    const ppm = state.scale.pixelsPerMeter;
    pushHistory();
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { widthCm: w, widthPx: (w / 100) * ppm } });
  };

  const applyH = () => {
    const h = parseFloat(localH);
    if (isNaN(h) || h <= 0) return;
    const ppm = state.scale.pixelsPerMeter;
    pushHistory();
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { heightCm: h, heightPx: (h / 100) * ppm } });
  };

  const applyRot = () => {
    const r = parseFloat(localRot);
    if (isNaN(r)) return;
    pushHistory();
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { rotation: r } });
  };

  return (
    <div style={{
      width: 220, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
    }}>
      <div className="section-header">Properties</div>

      <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Item name + category */}
        <div>
          <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{item.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{item.category}</div>
          {item.locked && (
            <div style={{ color: '#fc8181', fontSize: 10, marginTop: 2 }}>🔒 Locked</div>
          )}
        </div>

        {/* Dimensions */}
        <div>
          <label className="label">Dimensions (cm)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>W</div>
              <input
                className="input"
                type="number"
                value={localW}
                onChange={e => setLocalW(e.target.value)}
                onBlur={applyW}
                onKeyDown={e => e.key === 'Enter' && applyW()}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>D</div>
              <input
                className="input"
                type="number"
                value={localH}
                onChange={e => setLocalH(e.target.value)}
                onBlur={applyH}
                onKeyDown={e => e.key === 'Enter' && applyH()}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="label">Rotation (°)</label>
          <input
            className="input"
            type="number"
            value={localRot}
            onChange={e => setLocalRot(e.target.value)}
            onBlur={applyRot}
            onKeyDown={e => e.key === 'Enter' && applyRot()}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[0, 45, 90, 180, 270].map(r => (
              <button
                key={r}
                className="btn-icon"
                style={{ fontSize: 10, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 4 }}
                onClick={() => {
                  pushHistory();
                  dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { rotation: r } });
                  setLocalRot(String(r));
                }}
              >
                {r}°
              </button>
            ))}
          </div>
        </div>

        {/* Fill color */}
        <div>
          <label className="label">Fill Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {COLORS.map(c => (
              <div
                key={c}
                onClick={() => dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { fill: c } })}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                  border: item.fill === c ? '2px solid var(--accent)' : '1px solid var(--border)',
                  transform: item.fill === c ? 'scale(1.15)' : 'none',
                  transition: 'transform 0.1s',
                }}
              />
            ))}
          </div>
          <input
            type="color"
            value={item.fill.startsWith('#') ? item.fill : '#7c9ab5'}
            onChange={e => dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { fill: e.target.value } })}
            style={{ marginTop: 6, width: '100%', height: 28, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
          />
        </div>

        {/* Label */}
        <div>
          <label className="label">Label</label>
          <input
            className="input"
            value={localLabel}
            placeholder="Custom label..."
            onChange={e => setLocalLabel(e.target.value)}
            onBlur={() => dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { label: localLabel } })}
            onKeyDown={e => {
              if (e.key === 'Enter') dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { label: localLabel } });
            }}
          />
        </div>

        {/* Opacity */}
        <div>
          <label className="label">Opacity — {localOpacity}%</label>
          <input
            type="range"
            min={10} max={100} value={localOpacity}
            onChange={e => {
              const v = parseInt(e.target.value);
              setLocalOpacity(v);
              dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { opacity: v / 100 } });
            }}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => {
                pushHistory();
                dispatch({ type: 'BRING_FORWARD', id: item.id });
              }}
            >↑ Front</button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => {
                pushHistory();
                dispatch({ type: 'SEND_BACKWARD', id: item.id });
              }}
            >↓ Back</button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => {
                pushHistory();
                dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { flipH: !item.flipH } });
              }}
              title="Flip Horizontal (mirror left-right)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18" />
                <path d="M16 7l4 5-4 5" />
                <path d="M8 7L4 12l4 5" />
              </svg>
              Flip H
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => {
                pushHistory();
                dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { flipV: !item.flipV } });
              }}
              title="Flip Vertical (mirror top-bottom)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18" />
                <path d="M7 8L12 4l5 4" />
                <path d="M7 16l5 4 5-4" />
              </svg>
              Flip V
            </button>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11 }}
            onClick={() => dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { locked: !item.locked } })}
          >
            {item.locked ? '🔓 Unlock Item' : '🔒 Lock Item'}
          </button>
          {item.isGroup && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11 }}
              onClick={() => {
                pushHistory();
                dispatch({ type: 'UNGROUP_ITEM', id: item.id });
              }}
            >
              Ungroup
            </button>
          )}
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, color: '#fc8181' }}
            onClick={() => {
              pushHistory();
              dispatch({ type: 'DELETE_ITEMS', ids: [item.id] });
            }}
          >
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}
