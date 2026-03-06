import React, { useState, useMemo } from 'react';
import { FURNITURE_LIBRARY, CATEGORIES } from '../../lib/furnitureDefinitions';
import { FurnitureDefinition } from '../../types';
import FurniturePreview from './FurniturePreview';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(CATEGORIES));

  const filtered = useMemo(() => {
    if (!search.trim()) return FURNITURE_LIBRARY;
    const q = search.toLowerCase();
    return FURNITURE_LIBRARY.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map: Record<string, FurnitureDefinition[]> = {};
    filtered.forEach(f => {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    });
    return map;
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, def: FurnitureDefinition) => {
    e.dataTransfer.setData('furniture', JSON.stringify(def));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: 36, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8,
        }}
      >
        <button className="btn-icon" onClick={onToggle} title="Expand Library">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: 240, background: 'var(--bg-panel)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12, flex: 1 }}>
          FURNITURE LIBRARY
        </span>
        <button className="btn-icon" onClick={onToggle} title="Collapse">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 26 }}
            placeholder="Search furniture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div
              className={`category-header ${openCategories.has(cat) ? 'open' : ''}`}
              onClick={() => toggleCategory(cat)}
            >
              <span>{cat}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, opacity: 0.6 }}>{items.length}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: openCategories.has(cat) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
            {openCategories.has(cat) && (
              <div>
                {items.map(def => (
                  <div
                    key={def.id}
                    className="furniture-item"
                    draggable
                    onDragStart={e => handleDragStart(e, def)}
                  >
                    <div style={{ width: 34, height: 34, flexShrink: 0 }}>
                      <FurniturePreview def={def} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {def.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {def.shape === 'circle'
                          ? `⌀${def.widthCm}cm`
                          : `${def.widthCm}×${def.heightCm}cm`}
                      </div>
                    </div>
                    {def.isGroup && (
                      <span style={{ fontSize: 9, color: 'var(--accent)', opacity: 0.8, flexShrink: 0 }}>GROUP</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--border)',
        color: 'var(--text-secondary)', fontSize: 10, textAlign: 'center',
      }}>
        Drag items onto the canvas
      </div>
    </div>
  );
}
