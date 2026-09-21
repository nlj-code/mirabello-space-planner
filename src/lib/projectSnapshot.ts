// FIX #4.6 / #4.9 (code quality audit): single builder that captures the
// current AppState into a Project payload. Previously this shape was
// duplicated in four places (App auto-save, App handleAutoSaveNamed,
// ProjectModal handleSaveNew, ProjectModal handleSaveCurrent), each of
// which forgot to include new fields when the Project type grew.
import { AppState, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SnapshotBase {
  id?: string;
  name?: string;
  createdAt?: string;
}

export function buildProjectSnapshot(state: AppState, base?: SnapshotBase): Project {
  const now = new Date().toISOString();
  return {
    id: base?.id ?? uuidv4(),
    name: base?.name ?? 'Untitled Project',
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
    floorPlan: state.floorPlan,
    scale: state.scale,
    items: state.items,
    stageX: state.stageX,
    stageY: state.stageY,
    stageScale: state.stageScale,
    measurementLines: state.measurementLines,
    eraseStrokes: state.eraseStrokes,
  };
}
