import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Line, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useApp } from '../../store/AppContext';
import { CanvasItem, FurnitureDefinition, MeasurementLine, EraseStroke } from '../../types';
import { ExportRegion } from '../../lib/exportHelper';
import { getDefaultColor } from '../../lib/furnitureDefinitions';
import FurnitureShape from './FurnitureShape';
import { v4 as uuidv4 } from 'uuid';
import {
  WHEEL_ZOOM_FACTOR, ZOOM_MIN, ZOOM_MAX,
  GRID_SIZE_CM, GRID_RENDER_MARGIN_PX,
  SNAP_TO_OBJECT_TOLERANCE_PX,
  TRANSFORMER_ANCHOR_SIZE, TRANSFORMER_ANCHOR_CORNER_RADIUS,
  ROTATION_SNAPS, ROTATION_SNAP_TOLERANCE_DEG,
  MASS_DELETE_CONFIRM_THRESHOLD,
} from '../../config/constants';

interface ContextMenu {
  x: number;
  y: number;
  itemId: string | null;
}

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  onContextMenu: (menu: ContextMenu) => void;
  eraseMode: 'brush' | 'rect';
  eraseBrushSize: number;
  onExportRegionSelected?: (region: ExportRegion) => void;
  onCancelExportSelection?: () => void;
}

/** Format a distance in cm for display */
function formatDistance(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(2)} m`;
  return `${cm.toFixed(1)} cm`;
}

// FIX #2.2 / #2.3 / #1.13 (code quality audit): safe pointer accessors.
// Konva's getPointerPosition / getRelativePointerPosition can return null
// (event fired before the pointer has ever entered the stage). Using `!` here
// caused a silent-crash class of bugs.
function safePointer(stage: Konva.Stage | null | undefined) {
  if (!stage) return null;
  const p = stage.getPointerPosition();
  return p ?? null;
}
function safeRelPointer(stage: Konva.Stage | null | undefined) {
  if (!stage) return null;
  const p = stage.getRelativePointerPosition();
  return p ?? null;
}

export default function CanvasStage({ stageRef, onContextMenu, eraseMode, eraseBrushSize, onExportRegionSelected, onCancelExportSelection }: Props) {
  const { state, dispatch, pushHistory } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const floorImageRef = useRef<HTMLImageElement | null>(null);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [, forceUpdate] = useState(0);

  // ── Ref mirror of state for use in native DOM event handlers (avoids stale closures) ──
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Stable ref for pushHistory so DnD listeners don't re-register on every item change ──
  const pushHistoryRef = useRef(pushHistory);
  pushHistoryRef.current = pushHistory;

  // ── Measurement state ──
  const measureStartRef = useRef<{ x: number; y: number } | null>(null);
  const [tempMeasureEnd, setTempMeasureEnd] = useState<{ x: number; y: number } | null>(null);

  // ── Erase state ──
  const eraseDrawingRef = useRef(false);
  const eraseBrushPointsRef = useRef<number[]>([]);
  const eraseRectStartRef = useRef<{ x: number; y: number } | null>(null);
  const [tempErasePoints, setTempErasePoints] = useState<number[]>([]);
  const [tempEraseRect, setTempEraseRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── Export area selection state ──
  const exportRectStartRef = useRef<{ x: number; y: number } | null>(null);
  const [tempExportRect, setTempExportRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Global mouseup/pointerup: clear all stuck interaction state if mouse is released outside the canvas
  useEffect(() => {
    const onPointerUp = () => {
      isPanningRef.current = false;
      lastPosRef.current = null;
      // If selStartRef is stuck (released outside canvas), clear it so subsequent
      // handleMouseMove calls don't fire setSelectionRect and re-render during item drags,
      // which would reset Konva node positions mid-drag and break dragging.
      if (selStartRef.current) {
        selStartRef.current = null;
        setSelectionRect(null);
      }
    };
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  // Load floor plan image
  useEffect(() => {
    if (!state.floorPlan) {
      setFloorImage(null);
      return;
    }
    // FIX #4 (drag/drop audit): guard against a stale onload firing after a
    // newer floor plan swap. Without this, a slow-loading previous image
    // could overwrite floorImageRef/setFloorImage after the user swapped it.
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (!alive) return;
      floorImageRef.current = img;
      setFloorImage(img);
    };
    // FIX #7.3c (project storage audit): handle broken/corrupt image data
    // (e.g. from a malformed import) rather than silently showing nothing.
    img.onerror = () => {
      if (!alive) return;
      console.warn('[CanvasStage] Floor plan image failed to decode.');
      floorImageRef.current = null;
      setFloorImage(null);
    };
    img.src = state.floorPlan.imageData;
    return () => { alive = false; };
  }, [state.floorPlan]);

  // Update transformer
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const lockedIds = new Set(state.items.filter(i => i.locked).map(i => i.id));
    const nodes = state.selectedIds
      .filter(id => !lockedIds.has(id))
      .map(id => stage.findOne('#' + id))
      .filter(Boolean) as Konva.Node[];
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [state.selectedIds, state.items, stageRef]);

  // ── Snapshot (copy area) state ──
  const snapshotRectStartRef = useRef<{ x: number; y: number } | null>(null);
  const [tempSnapshotRect, setTempSnapshotRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // Ref mirror of tempSnapshotRect — always has latest value for use in Konva event handlers (avoids stale closure)
  const tempSnapshotRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [snapshotAdjusting, setSnapshotAdjusting] = useState(false);
  const snapshotAdjustingRef = useRef(false);
  const adjustHandleRef = useRef<string | null>(null);
  const adjustStartRef = useRef<{ mx: number; my: number; rect: { x: number; y: number; w: number; h: number } } | null>(null);

  // Wrapper that keeps ref and state in sync (use this everywhere instead of setTempSnapshotRect directly)
  const setSnapshotRect = useCallback((val: { x: number; y: number; w: number; h: number } | null) => {
    tempSnapshotRectRef.current = val;
    setTempSnapshotRect(val);
  }, []);

  // Clean up erase temp state when tool changes away from 'erase'
  useEffect(() => {
    if (state.currentTool !== 'erase') {
      eraseDrawingRef.current = false;
      eraseBrushPointsRef.current = [];
      eraseRectStartRef.current = null;
      setTempErasePoints([]);
      setTempEraseRect(null);
    }
  }, [state.currentTool]);

  // Clean up snapshot state when tool changes away from 'snapshot'
  useEffect(() => {
    if (state.currentTool !== 'snapshot') {
      snapshotRectStartRef.current = null;
      snapshotAdjustingRef.current = false;
      setSnapshotAdjusting(false);
      adjustHandleRef.current = null;
      adjustStartRef.current = null;
      setSnapshotRect(null);
    }
  }, [state.currentTool]);

  const captureSnapshot = useCallback(() => {
    const rect = tempSnapshotRectRef.current;
    snapshotAdjustingRef.current = false;
    setSnapshotAdjusting(false);
    adjustHandleRef.current = null;
    adjustStartRef.current = null;
    setTempSnapshotRect(null);
    if (rect && rect.w > 5 && rect.h > 5) {
      const stage = stageRef.current;
      if (stage) {
        const snapshotOverlay = stage.findOne('.snapshot-overlay');
        const transformer = transformerRef.current;
        if (snapshotOverlay) snapshotOverlay.visible(false);
        if (transformer) transformer.visible(false);

        const oldPos = { x: stage.x(), y: stage.y() };
        const oldScale = { x: stage.scaleX(), y: stage.scaleY() };
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });

        const dataUrl = stage.toDataURL({
          x: rect.x,
          y: rect.y,
          width: rect.w,
          height: rect.h,
          pixelRatio: 2,
        });

        stage.position(oldPos);
        stage.scale(oldScale);
        if (snapshotOverlay) snapshotOverlay.visible(true);
        if (transformer) transformer.visible(true);

        const ppm = state.scale.pixelsPerMeter;
        const widthPx = rect.w;
        const heightPx = rect.h;
        const widthCm = (widthPx / ppm) * 100;
        const heightCm = (heightPx / ppm) * 100;
        const maxZ = state.items.length > 0 ? Math.max(...state.items.map(it => it.zIndex)) : 0;

        const newItem: CanvasItem = {
          id: uuidv4(),
          defId: 'pasted-image',
          name: 'Area Copy',
          category: 'Images',
          x: rect.x + 20,
          y: rect.y + 20,
          widthPx,
          heightPx,
          widthCm,
          heightCm,
          rotation: 0,
          fill: '#edeae4',
          opacity: 1,
          label: '',
          locked: false,
          zIndex: maxZ + 1,
          shape: 'rect',
          imageData: dataUrl,
        };
        pushHistory();
        dispatch({ type: 'ADD_ITEM', item: newItem });
        dispatch({ type: 'SET_SELECTED', ids: [newItem.id] });
        dispatch({ type: 'SET_TOOL', tool: 'select' });
      }
    }
  }, [stageRef, state.scale.pixelsPerMeter, state.items, pushHistory, dispatch, setSnapshotRect]);

  // Keyboard events
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      // Don't fire shortcuts when a modal/dialog overlay is open
      if (document.querySelector('.modal-overlay')) return;
      const ppm = state.scale.pixelsPerMeter;
      const nudgePx = ppm * 0.01; // 1cm

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.currentTool === 'erase' && state.selectedEraseId) {
          dispatch({ type: 'DELETE_ERASE_STROKE', id: state.selectedEraseId });
        } else if (state.currentTool === 'measure' && state.measurementLines.length > 0) {
          dispatch({ type: 'CLEAR_MEASUREMENTS' });
        } else if (state.selectedIds.length > 0) {
          // FIX #3.5 (code quality audit): confirm mass-delete of many items.
          if (state.selectedIds.length >= MASS_DELETE_CONFIRM_THRESHOLD) {
            const ok = window.confirm(`Delete ${state.selectedIds.length} items?`);
            if (!ok) return;
          }
          pushHistory();
          dispatch({ type: 'DELETE_ITEMS', ids: state.selectedIds });
        }
      }
      if (e.key === 'Enter' && state.currentTool === 'snapshot' && snapshotAdjustingRef.current) {
        e.preventDefault();
        captureSnapshot();
        return;
      }
      if (e.key === 'Escape') {
        if (state.currentTool === 'export') {
          exportRectStartRef.current = null;
          setTempExportRect(null);
          onCancelExportSelection?.();
        } else if (state.currentTool === 'snapshot') {
          snapshotRectStartRef.current = null;
          snapshotAdjustingRef.current = false;
          setSnapshotAdjusting(false);
          adjustHandleRef.current = null;
          adjustStartRef.current = null;
          setSnapshotRect(null);
          dispatch({ type: 'SET_TOOL', tool: 'select' });
        } else if (state.currentTool === 'measure') {
          // Cancel current measurement in progress
          measureStartRef.current = null;
          setTempMeasureEnd(null);
          // If there are measurements, clear them
          if (state.measurementLines.length > 0) {
            dispatch({ type: 'CLEAR_MEASUREMENTS' });
          }
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        pushHistory();
        // FIX #5.2 (code quality audit): Shift+Arrow nudges by 10 cm.
        const step = e.shiftKey ? nudgePx * 10 : nudgePx;
        state.selectedIds.forEach(id => {
          const item = state.items.find(i => i.id === id);
          if (!item || item.locked) return;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
          dispatch({ type: 'UPDATE_ITEM', id, updates: { x: item.x + dx, y: item.y + dy } });
        });
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'g') {
        e.preventDefault();
        if (state.selectedIds.length >= 2) {
          pushHistory();
          dispatch({ type: 'GROUP_ITEMS', ids: state.selectedIds });
        }
      }
      // FIX #5.11 (code quality audit): Ctrl+Shift+G to ungroup a group.
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        for (const id of state.selectedIds) {
          const it = state.items.find(i => i.id === id);
          if (it?.isGroup) {
            pushHistory();
            dispatch({ type: 'UNGROUP_ITEM', id });
            break;
          }
        }
      }
      // ── Tool shortcuts ──
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 's') { dispatch({ type: 'SET_TOOL', tool: 'select' }); }
        if (k === 'c') { dispatch({ type: 'SET_TOOL', tool: 'scale' }); }
        if (k === 'p') { dispatch({ type: 'SET_TOOL', tool: 'pan' }); }
        if (k === 'm') { dispatch({ type: 'SET_TOOL', tool: 'measure' }); }
        if (k === 'e') { dispatch({ type: 'SET_TOOL', tool: 'erase' }); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedIds, state.items, state.scale, state.currentTool, state.measurementLines, state.selectedEraseId, dispatch, pushHistory, captureSnapshot]);

  // ── Native DOM drag-and-drop listeners ──
  // Using native listeners instead of React synthetic events prevents Konva's
  // pointer capture and React re-render batching from swallowing drop events.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      // Clear any stuck interaction state so the canvas doesn't fight the drop
      isPanningRef.current = false;
      lastPosRef.current = null;
      if (selStartRef.current) {
        selStartRef.current = null;
        setSelectionRect(null);
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const stg = stageRef.current;
      if (!stg) return;

      const data = e.dataTransfer?.getData('furniture');
      if (!data) return;

      let def: FurnitureDefinition;
      try { def = JSON.parse(data); }
      catch { return; }

      // FIX #1 (drag/drop audit): read stage transform directly from the live
      // Konva stage instead of stateRef.stageX/stageY/stageScale. React state
      // can lag Konva after a fast wheel/pan burst (batched updates); reading
      // from stg.x()/y()/scaleX() guarantees drops land where the user sees.
      const s = stateRef.current;
      const stageBox = stg.container().getBoundingClientRect();
      const liveX = stg.x();
      const liveY = stg.y();
      const liveScale = stg.scaleX();
      const x = (e.clientX - stageBox.left - liveX) / liveScale;
      const y = (e.clientY - stageBox.top - liveY) / liveScale;

      const ppm = s.scale.pixelsPerMeter;
      const widthPx = (def.widthCm / 100) * ppm;
      const heightPx = (def.heightCm / 100) * ppm;

      let snappedX = x - widthPx / 2;
      let snappedY = y - heightPx / 2;
      // FIX #5.2 (code quality audit): snap to 10 cm grid on drop.
      if (s.snapToGrid) {
        const step = (GRID_SIZE_CM / 100) * ppm;
        if (step > 0) {
          snappedX = Math.round(snappedX / step) * step;
          snappedY = Math.round(snappedY / step) * step;
        }
      }

      const maxZ = s.items.length > 0 ? Math.max(...s.items.map(i => i.zIndex)) : 0;

      // FIX #3.11 (code quality audit): if the definition is a group with
      // child definitions, materialise the children into `groupItems` with
      // parent-relative positions. Previously group definitions dropped as
      // empty rectangles (Lobby Cluster / Hotel Bed Set were visibly broken).
      let groupItems: CanvasItem[] | undefined;
      if (def.isGroup && Array.isArray(def.groupItems) && def.groupItems.length > 0) {
        const cols = Math.max(1, Math.ceil(Math.sqrt(def.groupItems.length)));
        const cellW = widthPx / cols;
        const cellH = heightPx / Math.ceil(def.groupItems.length / cols);
        groupItems = def.groupItems.map((gi, idx) => {
          const gw = (gi.widthCm / 100) * ppm;
          const gh = (gi.heightCm / 100) * ppm;
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cx = col * cellW + (cellW - gw) / 2;
          const cy = row * cellH + (cellH - gh) / 2;
          return {
            id: `${uuidv4()}`,
            defId: gi.id,
            name: gi.name,
            category: def.category,
            x: Math.max(0, cx),
            y: Math.max(0, cy),
            widthPx: gw, heightPx: gh,
            widthCm: gi.widthCm, heightCm: gi.heightCm,
            rotation: 0,
            fill: getDefaultColor(def.category),
            opacity: 1,
            label: '',
            locked: false,
            zIndex: idx,
            shape: gi.shape,
          } as CanvasItem;
        });
      }

      const newItem: CanvasItem = {
        id: uuidv4(),
        defId: def.id,
        name: def.name,
        category: def.category,
        x: snappedX,
        y: snappedY,
        widthPx,
        heightPx,
        widthCm: def.widthCm,
        heightCm: def.heightCm,
        rotation: 0,
        fill: getDefaultColor(def.category),
        opacity: 1,
        label: '',
        locked: false,
        zIndex: maxZ + 1,
        shape: def.shape,
        isGroup: def.isGroup || false,
        groupItems,
      };

      pushHistoryRef.current();
      dispatch({ type: 'ADD_ITEM', item: newItem });
      dispatch({ type: 'SET_SELECTED', ids: [newItem.id] });
    };

    // FIX #6.7 (code quality audit): accept native file drops (PDF / image
    // from desktop) — otherwise the drop is silently ignored. This forwards
    // to a custom event that Toolbar can listen to; simpler than plumbing a
    // callback through props.
    const onFileDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      // Only handle if we didn't already handle a sidebar-furniture drop.
      const furn = e.dataTransfer.getData('furniture');
      if (furn) return;
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      window.dispatchEvent(new CustomEvent('mirabello:file-drop', { detail: file }));
    };

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('dragenter', onDragEnter);
    el.addEventListener('drop', onDrop);
    // FIX #6.7 (code quality audit)
    el.addEventListener('drop', onFileDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('dragenter', onDragEnter);
      el.removeEventListener('drop', onDrop);
      el.removeEventListener('drop', onFileDrop);
    };
  }, [stageRef, dispatch]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    // FIX #4.4 (code quality audit): named zoom constants
    const scaleBy = WHEEL_ZOOM_FACTOR;
    const oldScale = state.stageScale;
    const pointer = safePointer(stage);
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - state.stageX) / oldScale,
      y: (pointer.y - state.stageY) / oldScale,
    };

    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, ZOOM_MAX)
      : Math.max(oldScale / scaleBy, ZOOM_MIN);

    dispatch({
      type: 'SET_STAGE',
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
      scale: newScale,
    });
  }, [state.stageScale, state.stageX, state.stageY, dispatch, stageRef]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Middle mouse or space+click = pan (always available)
    if (e.evt.button === 1 || (e.evt.button === 0 && state.currentTool === 'pan')) {
      isPanningRef.current = true;
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // Scale tool
    if (state.currentTool === 'scale') return;

    // ── Measure tool ──
    if (state.currentTool === 'measure' && e.evt.button === 0) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      if (!measureStartRef.current) {
        // First click: set start point
        measureStartRef.current = pos;
        setTempMeasureEnd(pos);
      } else {
        // Second click: finalize measurement
        const start = measureStartRef.current;
        const measurement: MeasurementLine = {
          id: uuidv4(),
          startX: start.x,
          startY: start.y,
          endX: pos.x,
          endY: pos.y,
        };
        dispatch({ type: 'ADD_MEASUREMENT', measurement });
        measureStartRef.current = null;
        setTempMeasureEnd(null);
      }
      return;
    }

    // ── Erase tool ──
    if (state.currentTool === 'erase' && e.evt.button === 0) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      // Check if we clicked on an existing erase stroke (handled via konva name attr)
      const target = e.target;
      const eraseName = target.name?.();
      if (eraseName && eraseName.startsWith('erase-stroke-')) {
        const strokeId = eraseName.replace('erase-stroke-', '');
        dispatch({ type: 'SELECT_ERASE_STROKE', id: strokeId });
        return;
      }
      // Deselect any selected erase stroke
      if (state.selectedEraseId) {
        dispatch({ type: 'SELECT_ERASE_STROKE', id: null });
      }
      // Start new erase drawing
      if (eraseMode === 'brush') {
        eraseDrawingRef.current = true;
        eraseBrushPointsRef.current = [pos.x, pos.y];
        setTempErasePoints([pos.x, pos.y]);
      } else {
        eraseRectStartRef.current = pos;
        setTempEraseRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      }
      return;
    }

    // ── Export area selection tool ──
    if (state.currentTool === 'export' && e.evt.button === 0) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      exportRectStartRef.current = pos;
      setTempExportRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    // ── Snapshot (copy area) tool ──
    if (state.currentTool === 'snapshot' && e.evt.button === 0) {
      const pos = safeRelPointer(stage);
      if (!pos) return;

      if (snapshotAdjustingRef.current && tempSnapshotRectRef.current) {
        // In adjust phase: check if clicking on a handle or inside rect
        const rect = tempSnapshotRectRef.current;
        const hs = 12; // constant screen-space hit area (px)

        const handles: Record<string, [number, number]> = {
          nw: [rect.x, rect.y],
          n:  [rect.x + rect.w / 2, rect.y],
          ne: [rect.x + rect.w, rect.y],
          e:  [rect.x + rect.w, rect.y + rect.h / 2],
          se: [rect.x + rect.w, rect.y + rect.h],
          s:  [rect.x + rect.w / 2, rect.y + rect.h],
          sw: [rect.x, rect.y + rect.h],
          w:  [rect.x, rect.y + rect.h / 2],
        };

        for (const [handle, [hx, hy]] of Object.entries(handles)) {
          if (Math.abs(pos.x - hx) <= hs && Math.abs(pos.y - hy) <= hs) {
            adjustHandleRef.current = handle;
            adjustStartRef.current = { mx: pos.x, my: pos.y, rect: { ...rect } };
            return;
          }
        }

        // Inside body: move handle
        if (pos.x >= rect.x && pos.x <= rect.x + rect.w &&
            pos.y >= rect.y && pos.y <= rect.y + rect.h) {
          adjustHandleRef.current = 'move';
          adjustStartRef.current = { mx: pos.x, my: pos.y, rect: { ...rect } };
          return;
        }

        // Clicked outside: cancel adjusting and start fresh draw
        snapshotAdjustingRef.current = false;
        setSnapshotAdjusting(false);
      }

      snapshotRectStartRef.current = pos;
      setSnapshotRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    // Click on empty = deselect + start selection rect
    if (e.target === stage || e.target.getParent() === stage.findOne('Layer')) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      if (e.evt.button === 0 && !e.evt.shiftKey) {
        dispatch({ type: 'SET_SELECTED', ids: [] });
        selStartRef.current = pos;
        setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      }
    }
  }, [stageRef, state.currentTool, state.selectedEraseId, state.stageScale, eraseMode, dispatch]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isPanningRef.current && lastPosRef.current) {
      const dx = e.evt.clientX - lastPosRef.current.x;
      const dy = e.evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      dispatch({
        type: 'SET_STAGE',
        x: state.stageX + dx,
        y: state.stageY + dy,
        scale: state.stageScale,
      });
      return;
    }

    // ── Measure tool: update preview line ──
    if (state.currentTool === 'measure' && measureStartRef.current) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      setTempMeasureEnd(pos);
      return;
    }

    // ── Erase tool: update preview ──
    if (state.currentTool === 'erase') {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      if (eraseMode === 'brush' && eraseDrawingRef.current) {
        eraseBrushPointsRef.current.push(pos.x, pos.y);
        setTempErasePoints([...eraseBrushPointsRef.current]);
        return;
      }
      if (eraseMode === 'rect' && eraseRectStartRef.current) {
        const start = eraseRectStartRef.current;
        setTempEraseRect({
          x: Math.min(pos.x, start.x),
          y: Math.min(pos.y, start.y),
          w: Math.abs(pos.x - start.x),
          h: Math.abs(pos.y - start.y),
        });
        return;
      }
    }

    // ── Export tool: update preview rect ──
    if (state.currentTool === 'export' && exportRectStartRef.current) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      const start = exportRectStartRef.current;
      setTempExportRect({
        x: Math.min(pos.x, start.x),
        y: Math.min(pos.y, start.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
      return;
    }

    // ── Snapshot tool: handle adjust drag or update preview rect ──
    if (state.currentTool === 'snapshot') {
      if (adjustHandleRef.current && adjustStartRef.current) {
        const pos = safeRelPointer(stage);
        if (!pos) return;
        const { mx, my, rect: startRect } = adjustStartRef.current;
        const dx = pos.x - mx;
        const dy = pos.y - my;
        let { x, y, w, h } = startRect;
        switch (adjustHandleRef.current) {
          case 'move': x += dx; y += dy; break;
          case 'nw': x += dx; y += dy; w -= dx; h -= dy; break;
          case 'n':  y += dy; h -= dy; break;
          case 'ne': w += dx; y += dy; h -= dy; break;
          case 'e':  w += dx; break;
          case 'se': w += dx; h += dy; break;
          case 's':  h += dy; break;
          case 'sw': x += dx; w -= dx; h += dy; break;
          case 'w':  x += dx; w -= dx; break;
        }
        if (w < 0) { x = x + w; w = -w; }
        if (h < 0) { y = y + h; h = -h; }
        if (w < 10) w = 10;
        if (h < 10) h = 10;
        setSnapshotRect({ x, y, w, h });
        return;
      }
      if (snapshotRectStartRef.current) {
        const pos = safeRelPointer(stage);
        if (!pos) return;
        const start = snapshotRectStartRef.current;
        setSnapshotRect({
          x: Math.min(pos.x, start.x),
          y: Math.min(pos.y, start.y),
          w: Math.abs(pos.x - start.x),
          h: Math.abs(pos.y - start.y),
        });
        return;
      }
    }

    if (selStartRef.current) {
      const pos = safeRelPointer(stage);
      if (!pos) return;
      setSelectionRect({
        x: Math.min(pos.x, selStartRef.current.x),
        y: Math.min(pos.y, selStartRef.current.y),
        w: Math.abs(pos.x - selStartRef.current.x),
        h: Math.abs(pos.y - selStartRef.current.y),
      });
    }
  }, [stageRef, state.stageX, state.stageY, state.stageScale, state.currentTool, eraseMode, dispatch]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
    lastPosRef.current = null;

    // Don't clear selection rect if we're in measure mode
    if (state.currentTool === 'measure') return;

    // ── Export tool: finalize selection ──
    if (state.currentTool === 'export') {
      const rect = tempExportRect;
      exportRectStartRef.current = null;
      setTempExportRect(null);
      if (rect && rect.w > 10 && rect.h > 10) {
        onExportRegionSelected?.({
          x: rect.x,
          y: rect.y,
          width: rect.w,
          height: rect.h,
        });
      }
      return;
    }

    // ── Snapshot tool ──
    if (state.currentTool === 'snapshot') {
      // End of handle drag
      if (adjustHandleRef.current) {
        adjustHandleRef.current = null;
        adjustStartRef.current = null;
        return;
      }
      // End of initial draw
      snapshotRectStartRef.current = null;
      if (!snapshotAdjustingRef.current) {
        const rect = tempSnapshotRectRef.current;
        if (rect && rect.w > 5 && rect.h > 5) {
          // Enter adjust/crop phase
          snapshotAdjustingRef.current = true;
          setSnapshotAdjusting(true);
        } else {
          setSnapshotRect(null);
        }
      }
      return;
    }

    // ── Erase tool: finalize stroke ──
    if (state.currentTool === 'erase') {
      if (eraseMode === 'brush' && eraseDrawingRef.current) {
        eraseDrawingRef.current = false;
        const pts = eraseBrushPointsRef.current;
        if (pts.length >= 4) {
          const stroke: EraseStroke = {
            id: uuidv4(),
            type: 'brush',
            points: [...pts],
            strokeWidth: eraseBrushSize,
          };
          dispatch({ type: 'ADD_ERASE_STROKE', stroke });
        }
        eraseBrushPointsRef.current = [];
        setTempErasePoints([]);
      }
      if (eraseMode === 'rect' && eraseRectStartRef.current) {
        const rect = tempEraseRect;
        eraseRectStartRef.current = null;
        if (rect && rect.w > 2 && rect.h > 2) {
          const stroke: EraseStroke = {
            id: uuidv4(),
            type: 'rect',
            x: rect.x,
            y: rect.y,
            width: rect.w,
            height: rect.h,
          };
          dispatch({ type: 'ADD_ERASE_STROKE', stroke });
        }
        setTempEraseRect(null);
      }
      return;
    }

    if (selectionRect && selStartRef.current && (selectionRect.w > 5 || selectionRect.h > 5)) {
      // Select items within rect — account for rotation by checking if any corner of
      // the rotated item AABB falls within the selection rect
      const ir = selectionRect!;
      const selected = state.items
        .filter(item => {
          const rot = (item.rotation || 0) * Math.PI / 180;
          if (Math.abs(rot) < 0.001) {
            // No rotation: fast AABB check
            return item.x < ir.x + ir.w && item.x + item.widthPx > ir.x &&
              item.y < ir.y + ir.h && item.y + item.heightPx > ir.y;
          }
          // Compute rotated bounding box corners
          const cos = Math.cos(rot), sin = Math.sin(rot);
          const cx = item.x, cy = item.y;
          const corners = [
            [0, 0], [item.widthPx, 0], [item.widthPx, item.heightPx], [0, item.heightPx]
          ].map(([px, py]) => ({
            x: cx + px * cos - py * sin,
            y: cy + px * sin + py * cos,
          }));
          const minX = Math.min(...corners.map(c => c.x));
          const maxX = Math.max(...corners.map(c => c.x));
          const minY = Math.min(...corners.map(c => c.y));
          const maxY = Math.max(...corners.map(c => c.y));
          return minX < ir.x + ir.w && maxX > ir.x && minY < ir.y + ir.h && maxY > ir.y;
        })
        .map(i => i.id);
      dispatch({ type: 'SET_SELECTED', ids: selected });
    }
    selStartRef.current = null;
    setSelectionRect(null);
  }, [selectionRect, state.items, state.currentTool, state.scale.pixelsPerMeter, eraseMode, eraseBrushSize, tempEraseRect, tempExportRect, onExportRegionSelected, stageRef, dispatch, pushHistory, setSnapshotRect]);

  const handleItemSelect = useCallback((e: any, id: string) => {
    if (state.currentTool === 'measure' || state.currentTool === 'erase' || state.currentTool === 'export' || state.currentTool === 'snapshot') return; // Don't select items in measure/erase/export/snapshot mode
    e.cancelBubble = true;
    if (e.evt.shiftKey) {
      const ids = state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id];
      dispatch({ type: 'SET_SELECTED', ids });
    } else {
      dispatch({ type: 'SET_SELECTED', ids: [id] });
    }
  }, [state.selectedIds, state.currentTool, dispatch]);

  const handleItemDragEnd = useCallback((id: string, x: number, y: number) => {
    // FIX #5.2 / #5.3 (code quality audit): apply snap-to-grid and/or
    // snap-to-object at drop of an item drag.
    let sx = x, sy = y;
    const s = stateRef.current;
    if (s.snapToGrid) {
      const step = (GRID_SIZE_CM / 100) * s.scale.pixelsPerMeter;
      if (step > 0) {
        sx = Math.round(sx / step) * step;
        sy = Math.round(sy / step) * step;
      }
    }
    if (s.snapToObjects) {
      const item = s.items.find(i => i.id === id);
      if (item) {
        const tol = SNAP_TO_OBJECT_TOLERANCE_PX / (s.stageScale || 1);
        const w = item.widthPx, h = item.heightPx;
        // Candidate left/center/right and top/mid/bottom edges of other items.
        const xEdges: number[] = [];
        const yEdges: number[] = [];
        for (const other of s.items) {
          if (other.id === id) continue;
          xEdges.push(other.x, other.x + other.widthPx / 2, other.x + other.widthPx);
          yEdges.push(other.y, other.y + other.heightPx / 2, other.y + other.heightPx);
        }
        const trySnap = (v: number, edges: number[], size: number) => {
          const candidates = [v, v + size / 2, v + size];
          let best = { d: tol, offset: 0 };
          for (const e of edges) for (const c of candidates) {
            const d = Math.abs(c - e);
            if (d < best.d) best = { d, offset: e - c };
          }
          return v + best.offset;
        };
        sx = trySnap(sx, xEdges, w);
        sy = trySnap(sy, yEdges, h);
      }
    }
    pushHistory();
    dispatch({ type: 'UPDATE_ITEM', id, updates: { x: sx, y: sy } });
    forceUpdate(n => n + 1);
  }, [dispatch, pushHistory]);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Clear live preview
    window.dispatchEvent(new CustomEvent('transform-preview', { detail: null }));
    pushHistory();
    state.selectedIds.forEach(id => {
      const node = stage.findOne('#' + id) as Konva.Group;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      // Read width/height from the node's data attrs to avoid stale state race condition
      const baseW = node.getAttr('data-widthPx') as number | undefined;
      const baseH = node.getAttr('data-heightPx') as number | undefined;
      const item = baseW != null && baseH != null ? null : state.items.find(i => i.id === id);
      const widthPx = baseW ?? item?.widthPx ?? 10;
      const heightPx = baseH ?? item?.heightPx ?? 10;
      const newW = Math.max(10, widthPx * scaleX);
      const newH = Math.max(10, heightPx * scaleY);
      const ppm = state.scale.pixelsPerMeter;
      node.scaleX(1);
      node.scaleY(1);
      dispatch({
        type: 'UPDATE_ITEM', id, updates: {
          x: node.x(), y: node.y(),
          widthPx: newW, heightPx: newH,
          widthCm: (newW / ppm) * 100,
          heightCm: (newH / ppm) * 100,
          rotation: node.rotation(),
        }
      });
    });
  }, [stageRef, state.selectedIds, state.items, state.scale, dispatch, pushHistory]);

  const handleContextMenu = useCallback((e: any, id: string) => {
    e.evt.preventDefault();
    onContextMenu({ x: e.evt.clientX, y: e.evt.clientY, itemId: id });
  }, [onContextMenu]);

  // FIX #1.4 (code quality audit): memoize the sorted items array so it
  // doesn't rebuild every render (frequent during pan/zoom/drag).
  const sortedItems = useMemo(
    () => [...state.items].sort((a, b) => a.zIndex - b.zIndex),
    [state.items],
  );

  // ── Helper to render a single measurement line ──
  const ppm = state.scale.pixelsPerMeter;
  const invScale = 1 / state.stageScale; // For keeping stroke/text size constant on screen

  const renderMeasurementLine = (
    sx: number, sy: number, ex: number, ey: number,
    key: string, isTemp: boolean = false,
  ) => {
    const dx = ex - sx, dy = ey - sy;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distCm = (distPx / ppm) * 100;
    const len = distPx || 1;
    // Perpendicular direction for tick marks
    const nx = -dy / len, ny = dx / len;
    const tickLen = 8 * invScale;
    // Midpoint for label
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    // Offset label perpendicular to line — clamp so it doesn't drift at extreme zoom
    const clampedInvScale = Math.min(Math.max(invScale, 0.5), 4);
    const labelOffX = nx * 14 * clampedInvScale;
    const labelOffY = ny * 14 * clampedInvScale;

    return (
      <Group key={key} listening={false}>
        {/* Main line */}
        <Line
          points={[sx, sy, ex, ey]}
          stroke={isTemp ? 'rgba(232,184,109,0.7)' : '#e8b86d'}
          strokeWidth={(isTemp ? 1.5 : 2) * invScale}
          dash={[8 * invScale, 4 * invScale]}
        />
        {/* Start tick mark */}
        <Line
          points={[sx + nx * tickLen, sy + ny * tickLen, sx - nx * tickLen, sy - ny * tickLen]}
          stroke="#e8b86d"
          strokeWidth={2 * invScale}
        />
        {/* End tick mark */}
        <Line
          points={[ex + nx * tickLen, ey + ny * tickLen, ex - nx * tickLen, ey - ny * tickLen]}
          stroke="#e8b86d"
          strokeWidth={2 * invScale}
        />
        {/* Start point */}
        <Circle
          x={sx} y={sy} radius={4 * invScale}
          fill="#e8b86d" stroke="white" strokeWidth={1.5 * invScale}
        />
        {/* End point */}
        <Circle
          x={ex} y={ey} radius={4 * invScale}
          fill="#e8b86d" stroke="white" strokeWidth={1.5 * invScale}
        />
        {/* Distance label */}
        {distPx > 5 && (
          <Group x={mx + labelOffX} y={my + labelOffY}>
            {/* Background pill for readability */}
            <Rect
              x={-4 * invScale}
              y={-2 * invScale}
              width={(formatDistance(distCm).length * 7 + 12) * invScale}
              height={16 * invScale}
              fill="rgba(0,0,0,0.75)"
              cornerRadius={3 * invScale}
            />
            <Text
              text={formatDistance(distCm)}
              fontSize={11 * invScale}
              fill="#e8b86d"
              fontStyle="bold"
            />
          </Group>
        )}
      </Group>
    );
  };

  // Determine cursor
  let cursor = 'default';
  if (state.currentTool === 'pan') cursor = 'grab';
  if (state.currentTool === 'measure') cursor = 'crosshair';
  if (state.currentTool === 'erase') cursor = 'crosshair';
  if (state.currentTool === 'export') cursor = 'crosshair';
  if (state.currentTool === 'snapshot') cursor = 'crosshair';

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', background: '#1a1a2e', position: 'relative' }}
    >
      {/* FIX #2.7 (code quality audit): persistent non-blocking banner when
          the user is placing items without a calibrated scale. Items render
          at the default 100 px/m and will not match the plan. Clicking the
          banner opens the scale modal via a bubbling custom event. */}
      {!state.scale.calibrated && (state.items.length > 0 || state.floorPlan) && (
        <div
          onClick={() => window.dispatchEvent(new CustomEvent('mirabello:open-scale'))}
          style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(246,173,85,0.14)',
            border: '1px solid rgba(246,173,85,0.5)',
            color: '#f6ad55',
            padding: '5px 12px', borderRadius: 6, fontSize: 12,
            zIndex: 15, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          title="Click to calibrate — items are rendering at the default 100 px/m"
        >
          ⚠ Scale not calibrated — click to set it now
        </div>
      )}
      <Stage
        ref={stageRef as React.RefObject<Konva.Stage>}
        width={size.width}
        height={size.height}
        x={state.stageX}
        y={state.stageY}
        scaleX={state.stageScale}
        scaleY={state.stageScale}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor }}
      >
        {/* Floor plan layer */}
        <Layer>
          {floorImage && (
            <KonvaImage
              image={floorImage}
              x={0} y={0}
              width={state.floorPlan?.width || 800}
              height={state.floorPlan?.height || 600}
              listening={false}
            />
          )}
        </Layer>

        {/* FIX #5.1 (code quality audit): 10 cm grid overlay, only rendered
            when the toggle is on. Draws inside the visible viewport plus a
            small margin to keep line counts bounded at extreme zoom-out. */}
        {state.showGrid && state.scale.pixelsPerMeter > 0 && (() => {
          const step = (GRID_SIZE_CM / 100) * state.scale.pixelsPerMeter;
          if (step <= 0) return null;
          // Content-space extent visible on screen, plus margin.
          const invScale = 1 / (state.stageScale || 1);
          const marginContent = GRID_RENDER_MARGIN_PX * invScale;
          const x0 = (-state.stageX) * invScale - marginContent;
          const y0 = (-state.stageY) * invScale - marginContent;
          const x1 = (size.width - state.stageX) * invScale + marginContent;
          const y1 = (size.height - state.stageY) * invScale + marginContent;
          const firstX = Math.floor(x0 / step) * step;
          const firstY = Math.floor(y0 / step) * step;
          const lines: React.ReactNode[] = [];
          // Cap total lines to avoid pathological output.
          let n = 0;
          const cap = 800;
          for (let x = firstX; x <= x1 && n < cap; x += step, n++) {
            const isMajor = Math.round(x / step) % 10 === 0; // every 1 m
            lines.push(
              <Line
                key={`gx${x}`}
                points={[x, y0, x, y1]}
                stroke={isMajor ? 'rgba(232,184,109,0.28)' : 'rgba(232,184,109,0.10)'}
                strokeWidth={(isMajor ? 1 : 0.5) * invScale}
                listening={false}
              />
            );
          }
          for (let y = firstY; y <= y1 && n < cap * 2; y += step, n++) {
            const isMajor = Math.round(y / step) % 10 === 0;
            lines.push(
              <Line
                key={`gy${y}`}
                points={[x0, y, x1, y]}
                stroke={isMajor ? 'rgba(232,184,109,0.28)' : 'rgba(232,184,109,0.10)'}
                strokeWidth={(isMajor ? 1 : 0.5) * invScale}
                listening={false}
              />
            );
          }
          return <Layer listening={false}>{lines}</Layer>;
        })()}

        {/* Items layer (erase strokes render here too, in the same compositing context) */}
        <Layer>
          {/* Erase strokes — rendered in same layer as items so they composite correctly */}
          {state.eraseStrokes.map(s => {
            const isSelected = s.id === state.selectedEraseId;
            const isEraseActive = state.currentTool === 'erase';
            if (s.type === 'brush' && s.points) {
              return (
                <React.Fragment key={s.id}>
                  <Line
                    name={`erase-stroke-${s.id}`}
                    points={s.points}
                    stroke="white"
                    strokeWidth={s.strokeWidth || 20}
                    lineCap="round"
                    lineJoin="round"
                    listening={isEraseActive}
                    hitStrokeWidth={isEraseActive ? (s.strokeWidth || 20) + 10 : 0}
                  />
                  {isSelected && (
                    <Line
                      points={s.points}
                      stroke="#e8b86d"
                      strokeWidth={(s.strokeWidth || 20) + 4}
                      lineCap="round"
                      lineJoin="round"
                      dash={[8, 6]}
                      opacity={0.7}
                      listening={false}
                    />
                  )}
                </React.Fragment>
              );
            }
            if (s.type === 'rect' && s.x != null && s.y != null && s.width != null && s.height != null) {
              return (
                <React.Fragment key={s.id}>
                  <Rect
                    name={`erase-stroke-${s.id}`}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    fill="white"
                    listening={isEraseActive}
                  />
                  {isSelected && (
                    <Rect
                      x={s.x - 2}
                      y={s.y - 2}
                      width={s.width + 4}
                      height={s.height + 4}
                      stroke="#e8b86d"
                      strokeWidth={2}
                      dash={[8, 6]}
                      fill="transparent"
                      listening={false}
                    />
                  )}
                </React.Fragment>
              );
            }
            return null;
          })}

          {/* Live brush preview */}
          {tempErasePoints.length >= 4 && (
            <Line
              points={tempErasePoints}
              stroke="white"
              strokeWidth={eraseBrushSize}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}

          {/* Live rect preview */}
          {tempEraseRect && tempEraseRect.w > 0 && tempEraseRect.h > 0 && (
            <Rect
              x={tempEraseRect.x}
              y={tempEraseRect.y}
              width={tempEraseRect.w}
              height={tempEraseRect.h}
              fill="white"
              stroke="#e8b86d"
              strokeWidth={1 / state.stageScale}
              dash={[6 / state.stageScale, 4 / state.stageScale]}
              listening={false}
            />
          )}

          {sortedItems.map(item => (
            <FurnitureShape
              key={item.id}
              item={item}
              isSelected={state.selectedIds.includes(item.id)}
              // FIX #6 (drag/drop audit): pass stable handlers (no per-item
              // inline arrows) so React.memo(FurnitureShape) can skip renders.
              onSelect={handleItemSelect}
              onDragStart={pushHistory}
              onDragEnd={handleItemDragEnd}
              onContextMenu={handleContextMenu}
              draggable={state.currentTool === 'select'}
              showDimensions={state.showDimensions}
            />
          ))}

          {/* Selection rectangle */}
          {selectionRect && (
            <Rect
              x={selectionRect.x} y={selectionRect.y}
              width={selectionRect.w} height={selectionRect.h}
              fill="rgba(232,184,109,0.1)"
              stroke="#e8b86d"
              strokeWidth={1 / state.stageScale}
              listening={false}
            />
          )}

          {/* Export area selection rectangle */}
          {tempExportRect && tempExportRect.w > 0 && tempExportRect.h > 0 && (
            <Group listening={false}>
              <Rect
                x={tempExportRect.x}
                y={tempExportRect.y}
                width={tempExportRect.w}
                height={tempExportRect.h}
                fill="rgba(232,184,109,0.08)"
                stroke="#e8b86d"
                strokeWidth={2 / state.stageScale}
                dash={[8 / state.stageScale, 4 / state.stageScale]}
              />
              <Text
                x={tempExportRect.x}
                y={tempExportRect.y - 18 / state.stageScale}
                text={`${Math.round(tempExportRect.w)} × ${Math.round(tempExportRect.h)} px`}
                fontSize={12 / state.stageScale}
                fill="#e8b86d"
              />
            </Group>
          )}

          {/* Snapshot area selection rectangle */}
          {tempSnapshotRect && tempSnapshotRect.w > 0 && tempSnapshotRect.h > 0 && (
            <Group listening={snapshotAdjusting} name="snapshot-overlay">
              {/* Body: move handle when adjusting */}
              <Rect
                x={tempSnapshotRect.x}
                y={tempSnapshotRect.y}
                width={tempSnapshotRect.w}
                height={tempSnapshotRect.h}
                fill="rgba(109,200,232,0.08)"
                stroke="#6dc8e8"
                strokeWidth={2 / state.stageScale}
                dash={snapshotAdjusting ? undefined : [8 / state.stageScale, 4 / state.stageScale]}
                listening={snapshotAdjusting}
              />
              <Text
                x={tempSnapshotRect.x + 4 / state.stageScale}
                y={tempSnapshotRect.y - 20 / state.stageScale}
                text={snapshotAdjusting ? 'Adjust crop area — Enter to capture, Esc to cancel' : 'Copy Area'}
                fontSize={11 / state.stageScale}
                fill="#6dc8e8"
                listening={false}
              />
              {/* Resize handles — only visible in adjust phase */}
              {snapshotAdjusting && (() => {
                const { x, y, w, h } = tempSnapshotRect;
                const hs = 7 / state.stageScale;
                const handleDefs: Array<[string, number, number]> = [
                  ['nw', x, y], ['n', x + w / 2, y], ['ne', x + w, y],
                  ['e', x + w, y + h / 2],
                  ['se', x + w, y + h], ['s', x + w / 2, y + h], ['sw', x, y + h],
                  ['w', x, y + h / 2],
                ];
                return handleDefs.map(([id, hx, hy]) => (
                  <Rect
                    key={id}
                    x={hx - hs / 2}
                    y={hy - hs / 2}
                    width={hs}
                    height={hs}
                    fill="#6dc8e8"
                    stroke="#1a1a2e"
                    strokeWidth={1 / state.stageScale}
                    listening={true}
                  />
                ));
              })()}
            </Group>
          )}

          <Transformer
            ref={transformerRef}
            borderStroke="#e8b86d"
            borderStrokeWidth={1}
            anchorStroke="#e8b86d"
            anchorFill="#1a1a2e"
            // FIX #3.4 (code quality audit): bigger, easier-to-hit anchors
            anchorSize={TRANSFORMER_ANCHOR_SIZE}
            anchorCornerRadius={TRANSFORMER_ANCHOR_CORNER_RADIUS}
            rotateAnchorOffset={22}
            onTransformEnd={handleTransformEnd}
            onTransform={() => {
              // Broadcast live dimensions via CustomEvent (avoids state mutation during transform)
              const stage = stageRef.current;
              if (!stage) return;
              state.selectedIds.forEach(id => {
                const node = stage.findOne('#' + id) as Konva.Group;
                if (!node) return;
                // Read base dimensions from node attrs (set by FurnitureShape) to avoid stale state
                const baseW = (node.getAttr('data-widthPx') as number | undefined);
                const baseH = (node.getAttr('data-heightPx') as number | undefined);
                if (baseW == null || baseH == null) return;
                const newWPx = Math.max(10, baseW * node.scaleX());
                const newHPx = Math.max(10, baseH * node.scaleY());
                const p = state.scale.pixelsPerMeter;
                window.dispatchEvent(new CustomEvent('transform-preview', {
                  detail: { widthCm: (newWPx / p) * 100, heightCm: (newHPx / p) * 100 },
                }));
              });
            }}
            // FIX #4.4 (code quality audit)
            rotationSnaps={ROTATION_SNAPS}
            rotationSnapTolerance={ROTATION_SNAP_TOLERANCE_DEG}
            keepRatio={false}
          />
        </Layer>

        {/* ── Measurement lines layer (on top of everything) ── */}
        <Layer>
          {/* Saved measurements */}
          {state.measurementLines.map(m =>
            renderMeasurementLine(m.startX, m.startY, m.endX, m.endY, m.id)
          )}

          {/* Temporary measurement being drawn */}
          {measureStartRef.current && tempMeasureEnd && (
            renderMeasurementLine(
              measureStartRef.current.x, measureStartRef.current.y,
              tempMeasureEnd.x, tempMeasureEnd.y,
              'temp-measure', true,
            )
          )}
        </Layer>
      </Stage>

      {/* Crop adjust overlay buttons */}
      {snapshotAdjusting && tempSnapshotRect && (() => {
        const bx = (tempSnapshotRect.x + tempSnapshotRect.w) * state.stageScale + state.stageX;
        const by = (tempSnapshotRect.y + tempSnapshotRect.h) * state.stageScale + state.stageY + 10;
        return (
          <div
            style={{
              position: 'absolute',
              left: Math.min(bx, size.width - 200),
              top: Math.min(by, size.height - 48),
              display: 'flex',
              gap: 6,
              zIndex: 20,
              pointerEvents: 'auto',
              transform: 'translateX(-100%)',
            }}
          >
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={captureSnapshot}
            >
              Capture ↵
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => {
                snapshotAdjustingRef.current = false;
                setSnapshotAdjusting(false);
                adjustHandleRef.current = null;
                adjustStartRef.current = null;
                setSnapshotRect(null);
                dispatch({ type: 'SET_TOOL', tool: 'select' });
              }}
            >
              Cancel
            </button>
          </div>
        );
      })()}
    </div>
  );
}
