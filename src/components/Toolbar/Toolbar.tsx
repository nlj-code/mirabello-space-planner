import React, { useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { Tool } from '../../types';
import { renderPdfToBase64, readImageFile } from '../../lib/pdfHelper';

interface Props {
  onOpenScaleModal: () => void;
  onOpenProjectModal: () => void;
  onOpenExportModal: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  eraseMode: 'brush' | 'rect';
  setEraseMode: (mode: 'brush' | 'rect') => void;
  eraseBrushSize: number;
  setEraseBrushSize: (size: number) => void;
}

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; title: string }[] = [
  {
    id: 'select', label: 'Select', title: 'Select & Move (V)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 0l16 12-7.5 2.5L8 24z" />
      </svg>
    ),
  },
  {
    id: 'pan', label: 'Pan', title: 'Pan Canvas (Space)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M12 12v0" />
      </svg>
    ),
  },
  {
    id: 'scale', label: 'Scale', title: 'Calibrate Scale',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18M3 6l3 6-3 6M21 6l-3 6 3 6" />
      </svg>
    ),
  },
  {
    id: 'measure', label: 'Measure', title: 'Measure Distance (M)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 20L20 2" />
        <path d="M6 20v-4" />
        <path d="M10 20v-2" />
        <path d="M14 20v-4" />
        <path d="M18 20v-2" />
        <path d="M2 20h18" />
        <circle cx="20" cy="2" r="1.5" fill="currentColor" />
        <circle cx="2" cy="20" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'erase', label: 'Erase', title: 'Erase (cover with white)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 20H7L3 16l9-9 8 8-4 4" />
        <path d="M6.5 13.5l5-5" />
      </svg>
    ),
  },
  {
    id: 'snapshot', label: 'Copy', title: 'Copy Area (drag to select)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="13" height="13" rx="1" />
        <path d="M8 21h12a1 1 0 001-1V8" />
      </svg>
    ),
  },
];

export default function Toolbar({
  onOpenScaleModal, onOpenProjectModal, onOpenExportModal,
  onZoomIn, onZoomOut, onZoomFit,
  eraseMode, setEraseMode, eraseBrushSize, setEraseBrushSize,
}: Props) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let result: { dataUrl: string; width: number; height: number };
      if (file.type === 'application/pdf') {
        result = await renderPdfToBase64(file);
      } else {
        result = await readImageFile(file);
      }
      dispatch({
        type: 'SET_FLOOR_PLAN',
        floorPlan: { imageData: result.dataUrl, width: result.width, height: result.height },
      });
      // Center stage on image
      dispatch({ type: 'SET_STAGE', x: 20, y: 20, scale: 1 });
      // Prompt to calibrate
      onOpenScaleModal();
    } catch (err) {
      alert('Failed to load file. Please use PDF, JPG, or PNG.');
    }
    e.target.value = '';
  };

  return (
    <div className="toolbar">
      {/* Logo */}
      <div style={{
        color: 'var(--accent)', fontWeight: 800, fontSize: 13,
        letterSpacing: 1, marginRight: 8, whiteSpace: 'nowrap',
      }}>
        MIRABELLO
      </div>

      <div className="toolbar-divider" />

      {/* Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <button
        className="btn btn-primary"
        style={{ fontSize: 11, padding: '5px 10px' }}
        onClick={() => fileInputRef.current?.click()}
        title="Upload floor plan (PDF or image)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        Upload Plan
      </button>

      <div className="toolbar-divider" />

      {/* Tools */}
      {TOOLS.map(t => (
        <button
          key={t.id}
          className={`btn-icon ${state.currentTool === t.id ? 'active' : ''}`}
          title={t.title}
          onClick={() => {
            dispatch({ type: 'SET_TOOL', tool: t.id });
            if (t.id === 'scale') onOpenScaleModal();
          }}
          style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 8px' }}
        >
          {t.icon}
          <span style={{ fontSize: 9, lineHeight: 1, opacity: 0.7 }}>{t.label}</span>
        </button>
      ))}

      {state.measurementLines.length > 0 && (
        <button
          className="btn btn-ghost"
          style={{ fontSize: 10, padding: '3px 8px', color: '#fc8181' }}
          title="Clear all measurements"
          onClick={() => dispatch({ type: 'CLEAR_MEASUREMENTS' })}
        >
          ✕ Clear ({state.measurementLines.length})
        </button>
      )}

      {/* Erase tool contextual controls */}
      {state.currentTool === 'erase' && (
        <>
          <div className="toolbar-divider" />
          <button
            className={`btn-icon ${eraseMode === 'brush' ? 'active' : ''}`}
            title="Brush mode"
            onClick={() => setEraseMode('brush')}
            style={{ fontSize: 10, padding: '3px 6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18" />
            </svg>
          </button>
          <button
            className={`btn-icon ${eraseMode === 'rect' ? 'active' : ''}`}
            title="Rectangle mode"
            onClick={() => setEraseMode('rect')}
            style={{ fontSize: 10, padding: '3px 6px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          </button>
          {eraseMode === 'brush' && (
            <input
              type="range"
              min={5} max={80}
              value={eraseBrushSize}
              onChange={e => setEraseBrushSize(parseInt(e.target.value))}
              title={`Brush size: ${eraseBrushSize}px`}
              style={{ width: 60, accentColor: 'var(--accent)' }}
            />
          )}
          {state.eraseStrokes.length > 0 && (
            <>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 10, padding: '3px 8px' }}
                title="Undo last erase stroke"
                onClick={() => dispatch({ type: 'UNDO_LAST_ERASE' })}
              >
                Undo
              </button>
              {state.selectedEraseId && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 10, padding: '3px 8px', color: '#fc8181' }}
                  title="Delete selected erase stroke"
                  onClick={() => dispatch({ type: 'DELETE_ERASE_STROKE', id: state.selectedEraseId! })}
                >
                  Delete
                </button>
              )}
              <button
                className="btn btn-ghost"
                style={{ fontSize: 10, padding: '3px 8px', color: '#fc8181' }}
                title="Clear all erase strokes"
                onClick={() => dispatch({ type: 'CLEAR_ERASE_STROKES' })}
              >
                ✕ Clear All
              </button>
            </>
          )}
        </>
      )}

      {/* Snapshot (copy area) mode indicator */}
      {state.currentTool === 'snapshot' && (
        <>
          <div className="toolbar-divider" />
          <span style={{ fontSize: 12, color: '#6dc8e8', fontWeight: 600 }}>
            Drag to copy an area
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '3px 8px' }}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: 'select' })}
          >
            Cancel (Esc)
          </button>
        </>
      )}

      {/* Export area selection mode indicator */}
      {state.currentTool === 'export' && (
        <>
          <div className="toolbar-divider" />
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            Drag to select export area
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '3px 8px' }}
            onClick={() => dispatch({ type: 'SET_TOOL', tool: 'select' })}
          >
            Cancel (Esc)
          </button>
        </>
      )}

      <div className="toolbar-divider" />

      <button
        className={`btn-icon ${state.showDimensions ? 'active' : ''}`}
        title="Toggle Dimensions"
        onClick={() => dispatch({ type: 'TOGGLE_DIMENSIONS' })}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 8px' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 4h20M2 4v2M22 4v2" />
          <path d="M2 20h20M2 20v-2M22 20v-2" />
          <path d="M12 7v10" />
          <path d="M9 9l3-2 3 2" />
          <path d="M9 17l3 2 3-2" />
        </svg>
        <span style={{ fontSize: 9, lineHeight: 1, opacity: 0.7 }}>Dims</span>
      </button>

      <div className="toolbar-divider" />

      {/* Undo/Redo */}
      <button
        className="btn-icon"
        title="Undo (Ctrl+Z)"
        onClick={undo}
        disabled={!canUndo}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6M3 13C5 8 9 5 14 5c5 0 9 4 9 9s-4 9-9 9-8-3-9-7" />
        </svg>
      </button>
      <button
        className="btn-icon"
        title="Redo (Ctrl+Y)"
        onClick={redo}
        disabled={!canRedo}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6M21 13c-2-5-6-8-11-8-5 0-9 4-9 9s4 9 9 9 7-3 8-7" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      {/* Zoom */}
      <button className="btn-icon" title="Zoom Out" onClick={onZoomOut}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" />
        </svg>
      </button>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'center' }}>
        {(state.stageScale * 100).toFixed(0)}%
      </span>
      <button className="btn-icon" title="Zoom In" onClick={onZoomIn}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
        </svg>
      </button>
      <button className="btn-icon" title="Fit to View" onClick={onZoomFit}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" />
        </svg>
      </button>

      <div className="toolbar-divider" />

      {/* Projects & Export */}
      <button
        className="btn btn-ghost"
        style={{ fontSize: 11, padding: '5px 10px' }}
        onClick={onOpenProjectModal}
        title="Projects"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        Projects
      </button>

      <button
        className="btn btn-ghost"
        style={{ fontSize: 11, padding: '5px 10px' }}
        onClick={onOpenExportModal}
        title="Export"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Export
      </button>
    </div>
  );
}
