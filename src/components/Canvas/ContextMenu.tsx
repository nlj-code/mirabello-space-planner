import React, { useEffect, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  x: number;
  y: number;
  itemId: string | null;
  onClose: () => void;
}

export default function ContextMenu({ x, y, itemId, onClose }: Props) {
  const { state, dispatch, pushHistory } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  const item = itemId ? state.items.find(i => i.id === itemId) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const menuStyle: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 180),
    top: Math.min(y, window.innerHeight - 250),
  };

  const act = (fn: () => void) => { fn(); onClose(); };

  if (!item) return null;

  return (
    <div className="context-menu" ref={ref} style={menuStyle}>
      <div style={{ padding: '4px 10px 4px', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
        {item.name}
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => act(() => {
        pushHistory();
        const newItem = {
          ...item,
          id: uuidv4(),
          x: item.x + 20,
          y: item.y + 20,
        };
        dispatch({ type: 'ADD_ITEM', item: newItem });
        dispatch({ type: 'SET_SELECTED', ids: [newItem.id] });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        Duplicate
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => act(() => {
        pushHistory();
        dispatch({ type: 'BRING_FORWARD', id: item.id });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        Bring to Front
      </div>
      <div className="context-menu-item" onClick={() => act(() => {
        pushHistory();
        dispatch({ type: 'SEND_BACKWARD', id: item.id });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
        Send to Back
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => act(() => {
        dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { locked: !item.locked } });
      })}>
        {item.locked ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 019.9-1" />
            </svg>
            Unlock
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Lock
          </>
        )}
      </div>
      {item.isGroup && (
        <div className="context-menu-item" onClick={() => act(() => {
          pushHistory();
          dispatch({ type: 'UNGROUP_ITEM', id: item.id });
        })}>
          Ungroup
        </div>
      )}
      <div className="context-menu-divider" />
      <div className="context-menu-item" onClick={() => act(() => {
        pushHistory();
        dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { flipH: !item.flipH } });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18" />
          <path d="M16 7l4 5-4 5" />
          <path d="M8 7L4 12l4 5" />
        </svg>
        Flip Horizontal
      </div>
      <div className="context-menu-item" onClick={() => act(() => {
        pushHistory();
        dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { flipV: !item.flipV } });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18" />
          <path d="M7 8L12 4l5 4" />
          <path d="M7 16l5 4 5-4" />
        </svg>
        Flip Vertical
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item danger" onClick={() => act(() => {
        pushHistory();
        dispatch({ type: 'DELETE_ITEMS', ids: [item.id] });
      })}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        Delete
      </div>
    </div>
  );
}
