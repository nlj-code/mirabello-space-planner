import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Line, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useApp } from '../../store/AppContext';
import { CanvasItem, FurnitureDefinition, MeasurementLine, EraseStroke } from '../../types';
import { ExportRegion } from '../../lib/exportHelper';
import { getDefaultColor } from '../../lib/furnitureDefinitions';
import FurnitureShape from './FurnitureShape';
import { v4 as uuidv4 } from 'uuid';

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

  // Load floor plan image
  useEffect(() => {
    if (!state.floorPlan) {
      setFloorImage(null);
      return;
    }
    const img = new window.Image();
    img.src = state.floorPlan.imageData;
    img.onload = () => {
      floorImageRef.current = img;
      setFloorImage(img);
    };
  }, [state.floorPlan]);

  // Update transformer
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const nodes = state.selectedIds
      .map(id => stage.findOne('#' + id))
      .filter(Boolean) as Konva.Node[];
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [state.selectedIds, state.items, stageRef]);

  // Keyboard events
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const ppm = state.scale.pixelsPerMeter;
      const nudgePx = ppm * 0.01; // 1cm

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.currentTool === 'erase' && state.selectedEraseId) {
          dispatch({ type: 'DELETE_ERASE_STROKE', id: state.selectedEraseId });
        } else if (state.currentTool === 'measure' && state.measurementLines.length > 0) {
          dispatch({ type: 'CLEAR_MEASUREMENTS' });
        } else if (state.selectedIds.length > 0) {
          pushHistory();
          dispatch({ type: 'DELETE_ITEMS', ids: state.selectedIds });
        }
      }
      if (e.key === 'Escape') {
        if (state.currentTool === 'export') {
          exportRectStartRef.current = null;
          setTempExportRect(null);
          onCancelExportSelection?.();
        } else if (state.currentTool === 'snapshot') {
          snapshotRectStartRef.current = null;
          setTempSnapshotRect(null);
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
        state.selectedIds.forEach(id => {
          const item = state.items.find(i => i.id === id);
          if (!item || item.locked) return;
          const dx = e.key === 'ArrowLeft' ? -nudgePx : e.key === 'ArrowRight' ? nudgePx : 0;
          const dy = e.key === 'ArrowUp' ? -nudgePx : e.key === 'ArrowDown' ? nudgePx : 0;
          dispatch({ type: 'UPDATE_ITEM', id, updates: { x: item.x + dx, y: item.y + dy } });
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        if (state.selectedIds.length >= 2) {
          pushHistory();
          dispatch({ type: 'GROUP_ITEMS', ids: state.selectedIds });
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
  }, [state.selectedIds, state.items, state.scale, state.currentTool, state.measurementLines, state.selectedEraseId, dispatch, pushHistory]);

  // ── Snapshot (copy area) state ──
  const snapshotRectStartRef = useRef<{ x: number; y: number } | null>(null);
  const [tempSnapshotRect, setTempSnapshotRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const stg = stageRef.current;
    if (!stg) return;

    const data = e.dataTransfer.getData('furniture');
    if (!data) return;

    const def: FurnitureDefinition = JSON.parse(data);
    const stageBox = stg.container().getBoundingClientRect();
    const x = (e.clientX - stageBox.left - state.stageX) / state.stageScale;
    const y = (e.clientY - stageBox.top - state.stageY) / state.stageScale;

    const ppm = state.scale.pixelsPerMeter;
    const widthPx = (def.widthCm / 100) * ppm;
    const heightPx = (def.heightCm / 100) * ppm;

    const snappedX = x - widthPx / 2;
    const snappedY = y - heightPx / 2;

    const maxZ = state.items.length > 0 ? Math.max(...state.items.map(i => i.zIndex)) : 0;

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
    };

    pushHistory();
    dispatch({ type: 'ADD_ITEM', item: newItem });
    dispatch({ type: 'SET_SELECTED', ids: [newItem.id] });
  }, [stageRef, state, dispatch, pushHistory]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.08;
    const oldScale = state.stageScale;
    const pointer = stage.getPointerPosition()!;

    const mousePointTo = {
      x: (pointer.x - state.stageX) / oldScale,
      y: (pointer.y - state.stageY) / oldScale,
    };

    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 10)
      : Math.max(oldScale / scaleBy, 0.05);

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
      const pos = stage.getRelativePointerPosition()!;
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
      const pos = stage.getRelativePointerPosition()!;
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
      const pos = stage.getRelativePointerPosition()!;
      exportRectStartRef.current = pos;
      setTempExportRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    // ── Snapshot (copy area) tool ──
    if (state.currentTool === 'snapshot' && e.evt.button === 0) {
      const pos = stage.getRelativePointerPosition()!;
      snapshotRectStartRef.current = pos;
      setTempSnapshotRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    // Click on empty = deselect + start selection rect
    if (e.target === stage || e.target.getParent() === stage.findOne('Layer')) {
      const pos = stage.getRelativePointerPosition()!;
      if (e.evt.button === 0 && !e.evt.shiftKey) {
        dispatch({ type: 'SET_SELECTED', ids: [] });
        selStartRef.current = pos;
        setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      }
    }
  }, [stageRef, state.currentTool, state.selectedEraseId, eraseMode, dispatch]);

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
      const pos = stage.getRelativePointerPosition()!;
      setTempMeasureEnd(pos);
      return;
    }

    // ── Erase tool: update preview ──
    if (state.currentTool === 'erase') {
      const pos = stage.getRelativePointerPosition()!;
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
      const pos = stage.getRelativePointerPosition()!;
      const start = exportRectStartRef.current;
      setTempExportRect({
        x: Math.min(pos.x, start.x),
        y: Math.min(pos.y, start.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
      return;
    }

    // ── Snapshot tool: update preview rect ──
    if (state.currentTool === 'snapshot' && snapshotRectStartRef.current) {
      const pos = stage.getRelativePointerPosition()!;
      const start = snapshotRectStartRef.current;
      setTempSnapshotRect({
        x: Math.min(pos.x, start.x),
        y: Math.min(pos.y, start.y),
        w: Math.abs(pos.x - start.x),
        h: Math.abs(pos.y - start.y),
      });
      return;
    }

    if (selStartRef.current) {
      const pos = stage.getRelativePointerPosition()!;
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

    // ── Snapshot tool: capture area and add as item ──
    if (state.currentTool === 'snapshot') {
      const rect = tempSnapshotRect;
      snapshotRectStartRef.current = null;
      setTempSnapshotRect(null);
      if (rect && rect.w > 5 && rect.h > 5) {
        const stage = stageRef.current;
        if (stage) {
          // Hide overlays so they don't appear in the capture
          const snapshotOverlay = stage.findOne('.snapshot-overlay');
          const transformer = transformerRef.current;
          if (snapshotOverlay) snapshotOverlay.visible(false);
          if (transformer) transformer.visible(false);

          // Temporarily reset stage transform so content coordinates
          // map directly to pixel coordinates for accurate capture
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

          // Restore stage transform and overlays
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

          // Place copy offset slightly from original
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
      // Select items within rect
      const selected = state.items
        .filter(item => {
          const ir = selectionRect!;
          return item.x < ir.x + ir.w && item.x + item.widthPx > ir.x &&
            item.y < ir.y + ir.h && item.y + item.heightPx > ir.y;
        })
        .map(i => i.id);
      dispatch({ type: 'SET_SELECTED', ids: selected });
    }
    selStartRef.current = null;
    setSelectionRect(null);
  }, [selectionRect, state.items, state.currentTool, state.scale.pixelsPerMeter, eraseMode, eraseBrushSize, tempEraseRect, tempExportRect, tempSnapshotRect, onExportRegionSelected, stageRef, dispatch, pushHistory]);

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
    dispatch({ type: 'UPDATE_ITEM', id, updates: { x, y } });
    forceUpdate(n => n + 1);
  }, [dispatch]);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Clear live preview
    window.dispatchEvent(new CustomEvent('transform-preview', { detail: null }));
    state.selectedIds.forEach(id => {
      const node = stage.findOne('#' + id) as Konva.Group;
      if (!node) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const item = state.items.find(i => i.id === id);
      if (!item) return;
      const newW = Math.max(10, item.widthPx * scaleX);
      const newH = Math.max(10, item.heightPx * scaleY);
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
  }, [stageRef, state.selectedIds, state.items, state.scale, dispatch]);

  const handleContextMenu = useCallback((e: any, id: string) => {
    e.evt.preventDefault();
    onContextMenu({ x: e.evt.clientX, y: e.evt.clientY, itemId: id });
  }, [onContextMenu]);

  const sortedItems = [...state.items].sort((a, b) => a.zIndex - b.zIndex);

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
    // Offset label perpendicular to line
    const labelOffX = nx * 14 * invScale;
    const labelOffY = ny * 14 * invScale;

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
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
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

        {/* Erase layer — between floor plan and items */}
        <Layer>
          {/* Saved erase strokes */}
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
        </Layer>

        {/* Items layer */}
        <Layer>
          {sortedItems.map(item => (
            <FurnitureShape
              key={item.id}
              item={item}
              isSelected={state.selectedIds.includes(item.id)}
              onSelect={e => handleItemSelect(e, item.id)}
              onDragStart={pushHistory}
              onDragEnd={(x, y) => handleItemDragEnd(item.id, x, y)}
              onContextMenu={e => handleContextMenu(e, item.id)}
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
            <Group listening={false} name="snapshot-overlay">
              <Rect
                x={tempSnapshotRect.x}
                y={tempSnapshotRect.y}
                width={tempSnapshotRect.w}
                height={tempSnapshotRect.h}
                fill="rgba(109,200,232,0.1)"
                stroke="#6dc8e8"
                strokeWidth={2 / state.stageScale}
                dash={[8 / state.stageScale, 4 / state.stageScale]}
              />
              <Text
                x={tempSnapshotRect.x}
                y={tempSnapshotRect.y - 18 / state.stageScale}
                text="Copy Area"
                fontSize={12 / state.stageScale}
                fill="#6dc8e8"
              />
            </Group>
          )}

          <Transformer
            ref={transformerRef}
            borderStroke="#e8b86d"
            borderStrokeWidth={1}
            anchorStroke="#e8b86d"
            anchorFill="#1a1a2e"
            anchorSize={8}
            rotateAnchorOffset={20}
            onTransformEnd={handleTransformEnd}
            onTransform={() => {
              // Broadcast live dimensions via CustomEvent (avoids state mutation during transform)
              const stage = stageRef.current;
              if (!stage) return;
              state.selectedIds.forEach(id => {
                const node = stage.findOne('#' + id) as Konva.Group;
                if (!node) return;
                const item = state.items.find(i => i.id === id);
                if (!item) return;
                const newWPx = Math.max(10, item.widthPx * node.scaleX());
                const newHPx = Math.max(10, item.heightPx * node.scaleY());
                const p = state.scale.pixelsPerMeter;
                window.dispatchEvent(new CustomEvent('transform-preview', {
                  detail: { widthCm: (newWPx / p) * 100, heightCm: (newHPx / p) * 100 },
                }));
              });
            }}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
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
    </div>
  );
}
