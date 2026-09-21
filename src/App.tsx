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
import {
  saveProject,
  purgeAutoSaves,
  DRAFT_AUTOSAVE_ID,
  getDraftAutosave,
  deleteDraftAutosave,
  getLastCorruptionReport,
  clearLastCorruptionReport,
  getAllProjects,
} from './lib/projectStorage';
import { buildProjectSnapshot } from './lib/projectSnapshot';
import { ExportRegion } from './lib/exportHelper';
import { Tool, Project } from './types';
import { v4 as uuidv4 } from 'uuid';
import {
  AUTOSAVE_INTERVAL_MS,
  BUTTON_ZOOM_FACTOR,
  ZOOM_MIN, ZOOM_MAX,
  ZOOM_FIT_PADDING_PX,
} from './config/constants';
import ShortcutHelpModal from './components/Modals/ShortcutHelpModal';

interface CtxMenu {
  x: number;
  y: number;
  itemId: string | null;
}

export default function App() {
  const { state, dispatch, loadProject, newProject, undo, redo } = useApp();
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

  // FIX #7.2a (project storage audit): non-blocking banner state for
  // auto-save failures. Only shows when auto-save has been suspended so the
  // designer can react (Save Now / Export JSON) instead of losing work.
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  // FIX #7.6d (project storage audit): on startup, look for an unnamed
  // auto-save draft with actual content and offer to restore it. Also
  // surface any store-corruption backup so the user knows their data is
  // still recoverable.
  const [recoveryDraft, setRecoveryDraft] = useState<Project | null>(null);
  const [corruptionMsg, setCorruptionMsg] = useState<string | null>(null);

  // FIX #3.2 (code quality audit): visible "last saved" indicator so the
  // designer can tell auto-save is alive without opening the Projects modal.
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<number | null>(null);

  // FIX #3.8 (code quality audit): shortcut cheat-sheet.
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

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

  // FIX #7.6d (project storage audit): on startup, look for a non-empty draft
  // auto-save and any corruption report from projectStorage. Runs once.
  useEffect(() => {
    try {
      // Trigger a read so the corruption detector has a chance to log/backup.
      getAllProjects();
      const rep = getLastCorruptionReport();
      if (rep) {
        setCorruptionMsg(
          `Your saved projects file was unreadable. A backup was kept at "${rep.backupKey || '<unavailable>'}" (${rep.rawByteLength} bytes). Contact support if you need it restored.`
        );
        clearLastCorruptionReport();
      }
      const draft = getDraftAutosave();
      if (draft && draft.items.length > 0) setRecoveryDraft(draft);
    } catch (err) {
      console.warn('Startup recovery check failed:', err);
    }
  }, []);

  // FIX #5.5 (code quality audit): auto-save every 30 seconds (spec compliance;
  // was 5 minutes — up to 5 min of work could be lost between saves).
  useEffect(() => {
    // FIX #2 (drag/drop audit): if a quota-exceeded (or other) failure
    // happens, DO NOT call the blocking alert() — it froze the event loop
    // and could cancel any in-flight HTML5 drag. Also stop retrying once we
    // hit a persistent quota error to avoid a fresh failure every N s.
    // FIX #7.2a (project storage audit): also surface a non-blocking banner
    // so the user KNOWS auto-save has stopped and can save manually / export.
    let quotaHit = false;
    const interval = setInterval(() => {
      if (quotaHit) return;
      const s = stateRef.current;
      if (s.items.length === 0) return; // nothing to save

      try {
        // FIX #4.6 (code quality audit): single snapshot builder instead of
        // duplicated Project literals in every save site.
        if (s.currentProject) {
          saveProject(buildProjectSnapshot(s, {
            id: s.currentProject.id,
            name: s.currentProject.name,
            createdAt: s.currentProject.createdAt,
          }));
        } else {
          saveProject(buildProjectSnapshot(s, {
            id: DRAFT_AUTOSAVE_ID,
            name: 'Untitled Draft',
          }));
          if (!autoSavePromptDismissedRef.current) {
            setShowAutoSavePrompt(true);
          }
        }
        if (autoSaveError) setAutoSaveError(null);
        dispatch({ type: 'MARK_CLEAN' });
        // FIX #3.2 (code quality audit)
        setLastAutoSaveAt(Date.now());
      } catch (err) {
        console.error('Auto-save failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setAutoSaveError(msg);
        if (/quota|storage/i.test(msg)) {
          quotaHit = true;
          console.warn('Auto-save disabled for this session (storage full).');
        }
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // dispatch is stable; interval registered once — deps empty on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX #7.4d (project storage audit): warn on tab close / reload when there
  // are unsaved changes. The dirty flag is maintained by the reducer; this
  // effect only wires the beforeunload handler.
  useEffect(() => {
    if (!state.dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom text — the presence of preventDefault
      // and returnValue is what triggers the native prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.dirty]);

  const handleAutoSaveNamed = useCallback((name: string) => {
    // FIX #4.6 (code quality audit)
    const project: Project = buildProjectSnapshot(state, { id: uuidv4(), name });
    try {
      saveProject(project);
      // FIX #7.6e (project storage audit): delete the leftover unnamed draft
      // once it has been named, so it doesn't linger as a duplicate.
      try { deleteDraftAutosave(); } catch { /* best effort */ }
      // FIX #7.3d (project storage audit): route through loadProject so undo
      // history from the draft session doesn't corrupt the named project.
      loadProject(project);
    } catch (err) {
      // FIX #7.2b: non-blocking error surface (banner) rather than alert().
      setAutoSaveError(err instanceof Error ? err.message : 'Failed to save project.');
    }
    setShowAutoSavePrompt(false);
  }, [state, loadProject]);

  // FIX #7.4c + #7.4d (project storage audit): explicit New Project flow
  // that clears items / floor plan / scale / measurements / erase strokes /
  // history and warns before discarding unsaved changes.
  const handleNewProject = useCallback(() => {
    if (state.dirty) {
      const ok = window.confirm('You have unsaved changes. Start a new project anyway?');
      if (!ok) return;
    }
    newProject();
  }, [state.dirty, newProject]);

  // FIX #2.7 / #6.7 (code quality audit): listen for CustomEvents from
  // deeper components so we don't have to prop-drill callbacks.
  useEffect(() => {
    const onOpenScale = () => setShowScaleModal(true);
    const onFileDrop = async (e: Event) => {
      const file = (e as CustomEvent).detail as File | undefined;
      if (!file) return;
      // Reuse the toolbar's upload path indirectly via SET_FLOOR_PLAN.
      try {
        const { renderPdfToBase64, readImageFile } = await import('./lib/pdfHelper');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const result = isPdf ? await renderPdfToBase64(file) : await readImageFile(file);
        dispatch({
          type: 'SET_FLOOR_PLAN',
          floorPlan: { imageData: result.dataUrl, width: result.width, height: result.height },
        });
        dispatch({ type: 'SET_STAGE', x: 20, y: 20, scale: 1 });
        setShowScaleModal(true);
      } catch (err) {
        console.error('External file drop failed:', err);
        setAutoSaveError(err instanceof Error ? err.message : 'Failed to load dropped file.');
      }
    };
    window.addEventListener('mirabello:open-scale', onOpenScale);
    window.addEventListener('mirabello:file-drop', onFileDrop as EventListener);
    return () => {
      window.removeEventListener('mirabello:open-scale', onOpenScale);
      window.removeEventListener('mirabello:file-drop', onFileDrop as EventListener);
    };
  }, [dispatch]);

  // FIX #7.6d (project storage audit): recovery actions offered on startup.
  const handleRestoreDraft = useCallback(() => {
    if (!recoveryDraft) return;
    loadProject(recoveryDraft);
    setRecoveryDraft(null);
  }, [recoveryDraft, loadProject]);
  const handleDiscardDraft = useCallback(() => {
    try { deleteDraftAutosave(); } catch { /* best effort */ }
    setRecoveryDraft(null);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (document.querySelector('.modal-overlay')) return;
      // FIX #5.6 (code quality audit): Ctrl/Cmd+Z / Ctrl/Cmd+Y / Ctrl+Shift+Z
      // now actually call undo() / redo(). Previously the handler caught the
      // key and only called preventDefault, so undo/redo were unreachable
      // from the keyboard.
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      // FIX #3.8 (code quality audit): show the shortcut cheat-sheet.
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutHelp(v => !v);
        return;
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
  }, [dispatch, state.currentTool, undo, redo]);

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
    // FIX #4.4 (code quality audit): constants for zoom bounds
    const newScale = Math.min(state.stageScale * BUTTON_ZOOM_FACTOR, ZOOM_MAX);
    dispatch({ type: 'SET_STAGE', x: state.stageX, y: state.stageY, scale: newScale });
  }, [state.stageScale, state.stageX, state.stageY, dispatch]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(state.stageScale / BUTTON_ZOOM_FACTOR, ZOOM_MIN);
    dispatch({ type: 'SET_STAGE', x: state.stageX, y: state.stageY, scale: newScale });
  }, [state.stageScale, state.stageX, state.stageY, dispatch]);

  // FIX #3.7 (code quality audit): Zoom Fit now centers on the content's
  // bounding box (items + floor plan) rather than hard-coding (20, 20, 1).
  // Previously items panned far off screen were unreachable from Zoom Fit.
  const handleZoomFit = useCallback(() => {
    const stage = stageRef.current;
    // Collect bounds of items and floor plan.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const item of state.items) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + item.widthPx);
      maxY = Math.max(maxY, item.y + item.heightPx);
    }
    if (state.floorPlan) {
      minX = Math.min(minX, 0);
      minY = Math.min(minY, 0);
      maxX = Math.max(maxX, state.floorPlan.width);
      maxY = Math.max(maxY, state.floorPlan.height);
    }
    if (!isFinite(minX)) {
      dispatch({ type: 'SET_STAGE', x: 20, y: 20, scale: 1 });
      return;
    }
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const vw = (stage?.width() ?? 800) - ZOOM_FIT_PADDING_PX * 2;
    const vh = (stage?.height() ?? 600) - ZOOM_FIT_PADDING_PX * 2;
    const scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(vw / bw, vh / bh)));
    // Center content in the viewport.
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const x = (stage?.width() ?? 800) / 2 - cx * scale;
    const y = (stage?.height() ?? 600) / 2 - cy * scale;
    dispatch({ type: 'SET_STAGE', x, y, scale });
  }, [state.items, state.floorPlan, dispatch]);

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
        // FIX #7.4c (project storage audit): New Project button.
        onNewProject={handleNewProject}
        // FIX #7.4d: reflect unsaved state on the toolbar (used for the
        // "unsaved" indicator).
        dirty={state.dirty}
        // FIX #3.8 (code quality audit): shortcut help.
        onShowShortcutHelp={() => setShowShortcutHelp(true)}
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
          // FIX #6 (drag/drop audit): pass the stable state setter directly
          // instead of an inline arrow, so handleContextMenu inside
          // CanvasStage doesn't churn on every App render.
          onContextMenu={setContextMenu}
          eraseMode={eraseMode}
          eraseBrushSize={eraseBrushSize}
          onExportRegionSelected={handleExportRegionSelected}
          onCancelExportSelection={handleCancelExportSelection}
        />

        {/* Properties panel */}
        <PropertiesPanel />
      </div>

      {/* Status bar */}
      {/* FIX #3.2 (code quality audit): passes last-saved timestamp */}
      <StatusBar lastAutoSaveAt={lastAutoSaveAt} />

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

      {/* FIX #7.2a (project storage audit): auto-save failure banner.
          Non-blocking; offers Save Now and Dismiss. */}
      {autoSaveError && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%',
          transform: 'translateX(-50%)',
          background: '#5a1a1a',
          border: '1px solid #a04040',
          color: '#ffd5d5',
          padding: '10px 18px', borderRadius: 8,
          fontSize: 13, zIndex: 2000,
          display: 'flex', gap: 12, alignItems: 'center',
          boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
          maxWidth: '90vw',
        }}>
          <span>⚠ Auto-save failed: {autoSaveError}. Open Projects → Save now, or Export JSON.</span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '3px 8px', color: '#ffd5d5', borderColor: '#a04040' }}
            onClick={() => setShowProjectModal(true)}
          >
            Open Projects
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '3px 8px', color: '#ffd5d5', borderColor: '#a04040' }}
            onClick={() => setAutoSaveError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* FIX #7.3a (project storage audit): corruption warning. */}
      {corruptionMsg && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-title">Project store recovered</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {corruptionMsg}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => setCorruptionMsg(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* FIX #3.8 (code quality audit): keyboard shortcut cheat sheet.
          Toggled with the '?' key. */}
      {showShortcutHelp && (
        <ShortcutHelpModal onClose={() => setShowShortcutHelp(false)} />
      )}

      {/* FIX #7.6d (project storage audit): crash-recovery prompt on
          startup — only appears when a non-empty draft exists. */}
      {recoveryDraft && !corruptionMsg && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-title">Restore last session?</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              We found an auto-saved draft from your last session
              ({recoveryDraft.items.length} items,
              updated {new Date(recoveryDraft.updatedAt).toLocaleString()}).
              Would you like to restore it?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={handleDiscardDraft}>Discard</button>
              <button className="btn btn-ghost" onClick={() => setRecoveryDraft(null)}>Later</button>
              <button className="btn btn-primary" onClick={handleRestoreDraft}>Restore</button>
            </div>
          </div>
        </div>
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
