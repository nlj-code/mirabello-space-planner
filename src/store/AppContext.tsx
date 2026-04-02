import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import { AppState, AppAction, CanvasItem, Tool, ScaleCalibration, FloorPlan, Project, MeasurementLine } from '../types';
import { produce } from 'immer';

const initialScale: ScaleCalibration = {
  pixelsPerMeter: 100,
  referenceLinePx: 0,
  referenceLineMeters: 0,
  calibrated: false,
};

const initialState: AppState = {
  currentTool: 'select',
  scale: initialScale,
  items: [],
  selectedIds: [],
  floorPlan: null,
  stageX: 0,
  stageY: 0,
  stageScale: 1,
  snapToObjects: true,
  showDimensions: false,
  currentProject: null,
  measurementLines: [],
  eraseStrokes: [],
  selectedEraseId: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  return produce(state, draft => {
    switch (action.type) {
      case 'SET_TOOL':
        draft.currentTool = action.tool as Tool;
        break;
      case 'SET_SCALE':
        draft.scale = action.scale;
        break;
      case 'SET_FLOOR_PLAN':
        draft.floorPlan = action.floorPlan;
        break;
      case 'ADD_ITEM':
        draft.items.push(action.item);
        break;
      case 'UPDATE_ITEM': {
        const idx = draft.items.findIndex(i => i.id === action.id);
        if (idx !== -1) Object.assign(draft.items[idx], action.updates);
        break;
      }
      case 'DELETE_ITEMS':
        draft.items = draft.items.filter(i => !action.ids.includes(i.id));
        draft.selectedIds = draft.selectedIds.filter(id => !action.ids.includes(id));
        break;
      case 'SET_SELECTED':
        draft.selectedIds = action.ids;
        break;
      case 'SET_STAGE':
        draft.stageX = action.x;
        draft.stageY = action.y;
        draft.stageScale = action.scale;
        break;
      case 'TOGGLE_SNAP_OBJECTS':
        draft.snapToObjects = !draft.snapToObjects;
        break;
      case 'TOGGLE_DIMENSIONS':
        draft.showDimensions = !draft.showDimensions;
        break;
      case 'SET_ITEMS':
        draft.items = action.items;
        break;
      case 'LOAD_PROJECT': {
        const p = action.project;
        draft.floorPlan = p.floorPlan;
        draft.scale = p.scale;
        draft.items = p.items;
        draft.stageX = p.stageX;
        draft.stageY = p.stageY;
        draft.stageScale = p.stageScale;
        draft.selectedIds = [];
        draft.currentProject = p;
        break;
      }
      case 'BRING_FORWARD': {
        const item = draft.items.find(i => i.id === action.id);
        if (item) item.zIndex = Math.max(...draft.items.map(i => i.zIndex)) + 1;
        break;
      }
      case 'SEND_BACKWARD': {
        const item = draft.items.find(i => i.id === action.id);
        if (item) item.zIndex = Math.min(...draft.items.map(i => i.zIndex)) - 1;
        break;
      }
      case 'GROUP_ITEMS': {
        const toGroup = draft.items.filter(i => action.ids.includes(i.id));
        if (toGroup.length < 2) break;
        const minX = Math.min(...toGroup.map(i => i.x));
        const minY = Math.min(...toGroup.map(i => i.y));
        const maxX = Math.max(...toGroup.map(i => i.x + i.widthPx));
        const maxY = Math.max(...toGroup.map(i => i.y + i.heightPx));
        const groupId = `group-${Date.now()}`;
        const groupItem: CanvasItem = {
          id: groupId, defId: 'group', name: 'Group', category: 'Group',
          x: minX, y: minY,
          widthPx: maxX - minX, heightPx: maxY - minY,
          widthCm: 0, heightCm: 0,
          rotation: 0, fill: 'transparent', opacity: 1, label: '',
          locked: false, zIndex: Math.max(...toGroup.map(i => i.zIndex)),
          shape: 'rect', isGroup: true,
          groupItems: toGroup.map(i => ({ ...i, x: i.x - minX, y: i.y - minY })) as CanvasItem[],
        };
        draft.items = draft.items.filter(i => !action.ids.includes(i.id));
        draft.items.push(groupItem);
        draft.selectedIds = [groupId];
        break;
      }
      case 'UNGROUP_ITEM': {
        const grp = draft.items.find(i => i.id === action.id);
        if (!grp?.isGroup || !grp.groupItems) break;
        const grpRot = grp.rotation || 0;
        const grpFlipH = grp.flipH || false;
        const grpFlipV = grp.flipV || false;
        const rad = (grpRot * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const ungrouped = grp.groupItems.map((gi, idx) => {
          // Apply group rotation to child position (rotate around group origin)
          let cx = gi.x;
          let cy = gi.y;
          if (grpFlipH) cx = grp.widthPx - cx - gi.widthPx;
          if (grpFlipV) cy = grp.heightPx - cy - gi.heightPx;
          const rx = cx * cosA - cy * sinA;
          const ry = cx * sinA + cy * cosA;
          return {
            ...gi,
            id: `${gi.id}-${Date.now()}-${idx}`,
            x: grp.x + rx,
            y: grp.y + ry,
            rotation: ((gi.rotation || 0) + grpRot) % 360,
            flipH: grpFlipH ? !gi.flipH : gi.flipH,
            flipV: grpFlipV ? !gi.flipV : gi.flipV,
          };
        });
        draft.items = draft.items.filter(i => i.id !== action.id);
        draft.items.push(...ungrouped);
        draft.selectedIds = ungrouped.map(i => i.id);
        break;
      }
      case 'ADD_MEASUREMENT':
        draft.measurementLines.push(action.measurement);
        break;
      case 'REMOVE_MEASUREMENT':
        draft.measurementLines = draft.measurementLines.filter(m => m.id !== action.id);
        break;
      case 'CLEAR_MEASUREMENTS':
        draft.measurementLines = [];
        break;
      case 'ADD_ERASE_STROKE':
        draft.eraseStrokes.push(action.stroke);
        break;
      case 'UNDO_LAST_ERASE':
        draft.eraseStrokes.pop();
        break;
      case 'DELETE_ERASE_STROKE':
        draft.eraseStrokes = draft.eraseStrokes.filter(s => s.id !== action.id);
        if (draft.selectedEraseId === action.id) draft.selectedEraseId = null;
        break;
      case 'SELECT_ERASE_STROKE':
        draft.selectedEraseId = action.id;
        break;
      case 'CLEAR_ERASE_STROKES':
        draft.eraseStrokes = [];
        draft.selectedEraseId = null;
        break;
    }
  });
}

// History hook integrated in context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const historyRef = useRef<CanvasItem[][]>([]);
  const futureRef = useRef<CanvasItem[][]>([]);

  const pushHistory = useCallback(() => {
    historyRef.current = [...historyRef.current, state.items.map(i => ({ ...i }))];
    if (historyRef.current.length > 50) historyRef.current.shift();
    futureRef.current = [];
  }, [state.items]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    futureRef.current = [state.items, ...futureRef.current];
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    dispatch({ type: 'SET_ITEMS', items: prev });
  }, [state.items]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    historyRef.current = [...historyRef.current, state.items];
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    dispatch({ type: 'SET_ITEMS', items: next });
  }, [state.items]);

  return (
    <AppContext.Provider value={{
      state, dispatch, undo, redo,
      canUndo: historyRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
      pushHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
