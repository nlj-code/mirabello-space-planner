import React, { useRef, useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { useApp } from './store/AppContext';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import CanvasStage from './components/Canvas/CanvasStage';
import PropertiesPanel from './components/Properties/PropertiesPanel';
import ScaleModal from './components/Modals/ScaleModal';
import ProjectModal from './components/Modals/ProjectModal';
import ExportModal from './components/Modals/ExportModal';
import ContextMenu from './components/Canvas/ContextMenu';
import StatusBar from './components/Canvas/StatusBar';
import AutoSaveNameModal from './components/Modals/AutoSaveNameModal';
import { saveProject, purgeAutoSaves } from './lib/projectStorage';
import { ExportRegion } from './lib/exportHelper';
import { Tool } from './types';
import { v4 as uuidv4 } from 'uuid';

interface CtxMenu {
  x: number;
  y: number;
  itemId: string | null;
}

export default function App() {
  const { state, dispatch } = useApp();
  const stageRef = useRef<Konva.Stage>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<CtxMenu | null>(null);
  const [eraseMode, setEraseMode] = useState<'brush' | 'rect'>('brush');
  const [eraseBrushSize, setEraseBrushSize] = useState(20);
  const [exportRegion, setExportRegion] = useState<ExportRegion | null>(null);
  const [showAutoSavePrompt, setShowAutoSavePrompt] = useState(false);
  const [exportNoticeHidden, setExportNoticeHidden] = useState(false);
  const exportNoticeCardRef = useRef<HTMLDivElement>(null);
  const autoSavePromptDismissedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const previousToolRef = useRef<Tool>('select');

  // Reset export notice visibility whenever export mode is (re-)entered
  useEffect(() => {
    if (state.currentTool === 'export') {
      setExportNoticeHidden(false);
    }
  }, [state.currentTool]);

  // Fade the export notice the moment the user begins dragging on the canvas
  useEffect(() => {
    if (state.currentTool !== 'export' || exportNoticeHidden) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && exportNoticeCardRef.current?.contains(target)) return;
      setExportNoticeHidden(true);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [state.currentTool, exportNoticeHidden]);

  // One-time cleanup: remove legacy duplicate Auto-save entries on startup
  useEffect(() => { purgeAutoSaves(); }, []);

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.items.length === 0) return; // nothing to save

      try {
        if (s.currentProject) {
          // Named project — save silently in the background
          saveProject({
            id: s.currentProject.id,
            name: s.currentProject.name,
            createdAt: s.currentProject.createdAt,
            updatedAt: new Date().toISOString(),
            floorPlan: s.floorPlan,
            scale: s.scale,
            items: s.items,
            stageX: s.stageX,
            stageY: s.stageY,
            stageScale: s.stageScale,
          });
        } else {
          // Unnamed project — silently persist as draft so work isn't lost
          saveProject({
            id: 'draft-autosave',
            name: 'Untitled Draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            floorPlan: s.floorPlan,
            scale: s.scale,
            items: s.items,
            stageX: s.stageX,
            stageY: s.stageY,
            stageScale: s.stageScale,
          });
          // Prompt to name it, but only once per session
          if (!autoSavePromptDismissedRef.current) {
            setShowAutoSavePrompt(true);
          }
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
        alert(err instanceof Error ? err.message : 'Auto-save failed.');
      }
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleAutoSaveNamed = useCallback((name: string) => {
    const project = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      floorPlan: state.floorPlan,
      scale: state.scale,
      items: state.items,
      stageX: state.stageX,
      stageY: state.stageY,
      stageScale: state.stageScale,
    };
    try {
      saveProject(project);
      dispatch({ type: 'LOAD_PROJECT', project });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save project.');
    }
    setShowAutoSavePrompt(false);
  }, [state, dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (document.querySelector('.modal-overlay')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Handled in context
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
      }
      if (e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'SET_TOOL', tool: 'pan' });
      }
      if (e.key === 'v' || e.key === 'V') {
        if (!e.metaKey && !e.ctrlKey) {
          dispatch({ type: 'SET_TOOL', tool: 'select' });
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          dispatch({ type: 'SET_TOOL', tool: 'measure' });
        }
      }
      if (e.key === 'Escape') {
        if (state.currentTool === 'export') {
          dispatch({ type: 'SET_TOOL', tool: previousToolRef.current });
        } else {
          dispatch({ type: 'SET_SELECTED', ids: [] });
          dispatch({ type: 'SET_TOOL', tool: 'select' });
        }
        setContextMenu(null);
      }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        dispatch({ type: 'SET_TOOL', tool: 'select' });
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [dispatch, state.currentTool]);

  // ── Export area selection callbacks ──
  const handleStartExportSelection = useCallback(() => {
    previousToolRef.current = state.currentTool;
    dispatch({ type: 'SET_TOOL', tool: 'export' });
    setExportRegion(null);
  }, [state.currentTool, dispatch]);

  const handleExportRegionSelected = useCallback((region: ExportRegion) => {
    setExportRegion(region);
    setShowExportModal(true);
    dispatch({ type: 'SET_TOOL', tool: previousToolRef.current });
  }, [dispatch]);

  const handleCancelExportSelection = useCallback(() => {
    dispatch({ type: 'SET_TOOL', tool: previousToolRef.current });
  }, [dispatch]);

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(state.stageScale * 1.2, 10);
    dispatch({ type: 'SET_STAGE', x: state.stageX, y: state.stageY, scale: newScale });
  }, [state.stageScale, state.stageX, state.stageY, dispatch]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(state.stageScale / 1.2, 0.05);
    dispatch({ type: 'SET_STAGE', x: state.stageX, y: state.stageY, scale: newScale });
  }, [state.stageScale, state.stageX, state.stageY, dispatch]);

  const handleZoomFit = useCallback(() => {
    dispatch({ type: 'SET_STAGE', x: 20, y: 20, scale: 1 });
  }, [dispatch]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <Toolbar
        onOpenScaleModal={() => setShowScaleModal(true)}
        onOpenProjectModal={() => setShowProjectModal(true)}
        onOpenExportModal={handleStartExportSelection}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        eraseMode={eraseMode}
        setEraseMode={setEraseMode}
        eraseBrushSize={eraseBrushSize}
        setEraseBrushSize={setEraseBrushSize}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />

        {/* Canvas */}
        <CanvasStage
          stageRef={stageRef}
          onContextMenu={(menu) => setContextMenu(menu)}
          eraseMode={eraseMode}
          eraseBrushSize={eraseBrushSize}
          onExportRegionSelected={handleExportRegionSelected}
          onCancelExportSelection={handleCancelExportSelection}
        />

        {/* Properties panel */}
        <PropertiesPanel />
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Modals */}
      {showScaleModal && <ScaleModal onClose={() => setShowScaleModal(false)} />}
      {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
      {showAutoSavePrompt && (
        <AutoSaveNameModal
          onSave={handleAutoSaveNamed}
          onSkip={() => {
            autoSavePromptDismissedRef.current = true;
            setShowAutoSavePrompt(false);
          }}
        />
      )}
      {showExportModal && (
        <ExportModal
          stageRef={stageRef}
          exportRegion={exportRegion}
          onClose={() => { setShowExportModal(false); setExportRegion(null); }}
        />
      )}

      {/* Export-area selection notice (non-blocking; fades out once user begins dragging) */}
      {state.currentTool === 'export' && (
        <div style={{
          position: 'fixed',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1000,
          opacity: exportNoticeHidden ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}>
          <div
            ref={exportNoticeCardRef}
            style={{
              pointerEvents: exportNoticeHidden ? 'none' : 'auto',
              background: 'rgba(22,33,62,0.96)',
              border: '1px solid rgba(232,184,109,0.5)',
              borderRadius: 10,
              padding: '18px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              minWidth: 280,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
              Drag to select export area
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Click and drag on the canvas to define the region you want to export.
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11 }}
              onClick={() => dispatch({ type: 'SET_TOOL', tool: 'select' })}
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          itemId={contextMenu.itemId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Empty state hint */}
      {!state.floorPlan && state.items.length === 0 && (
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.15)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⬡</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(232,184,109,0.3)' }}>
            Mirabello Space Planner
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Upload a floor plan or drag furniture from the library to start
          </div>
        </div>
      )}
    </div>
  );
}
