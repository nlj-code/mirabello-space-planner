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
  const previousToolRef = useRef<Tool>('select');

  // One-time cleanup: remove legacy duplicate Auto-save entries on startup
  useEffect(() => { purgeAutoSaves(); }, []);

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.items.length === 0) return; // nothing to save

      if (state.currentProject) {
        // Named project — save silently in the background
        const project = {
          id: state.currentProject.id,
          name: state.currentProject.name,
          createdAt: state.currentProject.createdAt,
          updatedAt: new Date().toISOString(),
          floorPlan: state.floorPlan,
          scale: state.scale,
          items: state.items,
          stageX: state.stageX,
          stageY: state.stageY,
          stageScale: state.stageScale,
        };
        saveProject(project);
      } else {
        // Unnamed project — prompt the user to name it (first save only)
        setShowAutoSavePrompt(true);
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [state]);

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
    saveProject(project);
    dispatch({ type: 'LOAD_PROJECT', project });
    setShowAutoSavePrompt(false);
  }, [state, dispatch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
          onSkip={() => setShowAutoSavePrompt(false)}
        />
      )}
      {showExportModal && (
        <ExportModal
          stageRef={stageRef}
          exportRegion={exportRegion}
          onClose={() => { setShowExportModal(false); setExportRegion(null); }}
        />
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
