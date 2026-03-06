export interface Point {
  x: number;
  y: number;
}

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: string;
  widthCm: number;
  heightCm: number;
  shape: 'rect' | 'circle' | 'lshape' | 'door' | 'window' | 'stair' | 'column-round' | 'custom';
  color?: string;
  isGroup?: boolean;
  groupItems?: Omit<FurnitureDefinition, 'category'>[];
}

export interface CanvasItem {
  id: string;
  defId: string;
  name: string;
  category: string;
  x: number;
  y: number;
  widthPx: number;
  heightPx: number;
  widthCm: number;
  heightCm: number;
  rotation: number;
  fill: string;
  opacity: number;
  label: string;
  locked: boolean;
  zIndex: number;
  shape: FurnitureDefinition['shape'];
  isGroup?: boolean;
  groupItems?: CanvasItem[];
  flipH?: boolean;
  flipV?: boolean;
  imageData?: string;  // base64 data URL for pasted images/screenshots
}

export interface ScaleCalibration {
  pixelsPerMeter: number;
  referenceLinePx: number;
  referenceLineMeters: number;
  calibrated: boolean;
}

export interface FloorPlan {
  imageData: string;  // base64
  width: number;
  height: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  floorPlan: FloorPlan | null;
  scale: ScaleCalibration;
  items: CanvasItem[];
  stageX: number;
  stageY: number;
  stageScale: number;
}

export type Tool = 'select' | 'scale' | 'pan' | 'measure' | 'erase' | 'export' | 'snapshot';

export interface EraseStroke {
  id: string;
  type: 'brush' | 'rect';
  points?: number[];       // flat [x1,y1,x2,y2,...] for brush
  strokeWidth?: number;    // brush width in px
  x?: number; y?: number;  // rect origin
  width?: number;          // rect dimensions
  height?: number;
}

export interface MeasurementLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface AppState {
  currentTool: Tool;
  scale: ScaleCalibration;
  items: CanvasItem[];
  selectedIds: string[];
  floorPlan: FloorPlan | null;
  stageX: number;
  stageY: number;
  stageScale: number;
  snapToObjects: boolean;
  showDimensions: boolean;
  currentProject: Project | null;
  measurementLines: MeasurementLine[];
  eraseStrokes: EraseStroke[];
  selectedEraseId: string | null;
}

export interface HistoryState {
  items: CanvasItem[];
}

export type AppAction =
  | { type: 'SET_TOOL'; tool: Tool }
  | { type: 'SET_SCALE'; scale: ScaleCalibration }
  | { type: 'SET_FLOOR_PLAN'; floorPlan: FloorPlan | null }
  | { type: 'ADD_ITEM'; item: CanvasItem }
  | { type: 'UPDATE_ITEM'; id: string; updates: Partial<CanvasItem> }
  | { type: 'DELETE_ITEMS'; ids: string[] }
  | { type: 'SET_SELECTED'; ids: string[] }
  | { type: 'SET_STAGE'; x: number; y: number; scale: number }
  | { type: 'TOGGLE_SNAP_OBJECTS' }
  | { type: 'TOGGLE_DIMENSIONS' }
  | { type: 'LOAD_PROJECT'; project: Project }
  | { type: 'SET_ITEMS'; items: CanvasItem[] }
  | { type: 'BRING_FORWARD'; id: string }
  | { type: 'SEND_BACKWARD'; id: string }
  | { type: 'GROUP_ITEMS'; ids: string[] }
  | { type: 'UNGROUP_ITEM'; id: string }
  | { type: 'ADD_MEASUREMENT'; measurement: MeasurementLine }
  | { type: 'REMOVE_MEASUREMENT'; id: string }
  | { type: 'CLEAR_MEASUREMENTS' }
  | { type: 'ADD_ERASE_STROKE'; stroke: EraseStroke }
  | { type: 'UNDO_LAST_ERASE' }
  | { type: 'DELETE_ERASE_STROKE'; id: string }
  | { type: 'SELECT_ERASE_STROKE'; id: string | null }
  | { type: 'CLEAR_ERASE_STROKES' };
