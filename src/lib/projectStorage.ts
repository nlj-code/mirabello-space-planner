import { Project, CanvasItem, FloorPlan, ScaleCalibration } from '../types';

// FIX #7.5c (project storage audit): current on-disk schema version. Bump
// this whenever the Project shape changes, and add a case to `migrateProject`.
export const CURRENT_SCHEMA_VERSION = 1;

const PROJECTS_KEY = 'mirabello_projects';
// FIX #7.1a (project storage audit): content-addressed store for floor plan
// base64 blobs. Every project references its floor plan by hash; the actual
// bytes are stored once here and shared across all projects that use it.
const FLOORPLANS_KEY = 'mirabello_floorplans';
// FIX #7.3a (project storage audit): backup key for corrupt data so we never
// destroy anything even when we can't parse it.
const CORRUPT_BACKUP_PREFIX = 'mirabello_projects_corrupt_';

// Internal on-disk shape: the project row we actually persist. Callers of
// `getAllProjects()` / `hydrateProject()` never see this — they get a fully
// hydrated Project with imageData inline.
type PersistedProject = Project & { _floorPlanHash?: string };

// ──────────────────────────────────────────────────────────────────────────
// Hash helpers (FIX #7.1a)
// ──────────────────────────────────────────────────────────────────────────

/** Deterministic non-crypto content hash. base64 strings + length suffix
 *  make collisions negligible for the handful of unique floor plans a user
 *  will ever save. Same input → same hash, always. */
function hashFloorPlanData(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `${(h >>> 0).toString(16)}_${s.length.toString(36)}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Corruption-safe read helpers (FIX #7.3a)
// ──────────────────────────────────────────────────────────────────────────

/** Reason returned to the caller when getAllProjects couldn't parse the store. */
export interface CorruptionReport {
  backupKey: string;
  rawByteLength: number;
  message: string;
}

let lastCorruption: CorruptionReport | null = null;
/** Returns the most recent corruption report, if any. UI can surface it. */
export function getLastCorruptionReport(): CorruptionReport | null {
  return lastCorruption;
}
export function clearLastCorruptionReport(): void { lastCorruption = null; }

function safeReadJSON<T>(key: string, fallback: T, onCorrupt?: (raw: string, err: unknown) => void): T {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch { return fallback; }
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    onCorrupt?.(raw, err);
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Floor plan content store (FIX #7.1a)
// ──────────────────────────────────────────────────────────────────────────

function readFloorPlansStore(): Record<string, string> {
  return safeReadJSON<Record<string, string>>(FLOORPLANS_KEY, {});
}

function writeFloorPlansStore(store: Record<string, string>): void {
  localStorage.setItem(FLOORPLANS_KEY, JSON.stringify(store));
}

function putFloorPlanData(imageData: string): string {
  const hash = hashFloorPlanData(imageData);
  const store = readFloorPlansStore();
  if (!store[hash]) {
    store[hash] = imageData;
    writeFloorPlansStore(store);
  }
  return hash;
}

function getFloorPlanData(hash: string): string | null {
  const store = readFloorPlansStore();
  return store[hash] ?? null;
}

/** Remove any floor plan blobs no longer referenced by any stored project. */
function gcFloorPlans(persisted: PersistedProject[]): void {
  const referenced = new Set(persisted.map(p => p._floorPlanHash).filter(Boolean) as string[]);
  const store = readFloorPlansStore();
  let mutated = false;
  for (const k of Object.keys(store)) {
    if (!referenced.has(k)) { delete store[k]; mutated = true; }
  }
  if (mutated) writeFloorPlansStore(store);
}

// ──────────────────────────────────────────────────────────────────────────
// Sanitization and validation (FIX #7.2d, #7.3b, #7.5b)
// ──────────────────────────────────────────────────────────────────────────

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Filter out items that would crash Konva at render time. */
function sanitizeItems(items: unknown): CanvasItem[] {
  if (!Array.isArray(items)) return [];
  const out: CanvasItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const i = raw as CanvasItem;
    if (typeof i.id !== 'string' || !i.id) continue;
    if (!finite(i.x) || !finite(i.y) || !finite(i.widthPx) || !finite(i.heightPx)) {
      console.warn(`[projectStorage] Skipping item with non-finite geometry:`, i.id);
      continue;
    }
    if (!finite(i.rotation)) i.rotation = 0;
    if (!finite(i.opacity)) i.opacity = 1;
    if (!finite(i.zIndex)) i.zIndex = 0;
    if (typeof i.label !== 'string') i.label = '';
    if (typeof i.locked !== 'boolean') i.locked = false;
    out.push(i);
  }
  return out;
}

function sanitizeScale(s: unknown): ScaleCalibration {
  const def: ScaleCalibration = { pixelsPerMeter: 100, referenceLinePx: 0, referenceLineMeters: 0, calibrated: false };
  if (!s || typeof s !== 'object') return def;
  const raw = s as Partial<ScaleCalibration>;
  return {
    pixelsPerMeter: finite(raw.pixelsPerMeter) && raw.pixelsPerMeter > 0 ? raw.pixelsPerMeter : def.pixelsPerMeter,
    referenceLinePx: finite(raw.referenceLinePx) ? raw.referenceLinePx : 0,
    referenceLineMeters: finite(raw.referenceLineMeters) ? raw.referenceLineMeters : 0,
    calibrated: !!raw.calibrated,
  };
}

function sanitizeFloorPlan(fp: unknown): FloorPlan | null {
  if (!fp || typeof fp !== 'object') return null;
  const raw = fp as Partial<FloorPlan>;
  if (typeof raw.imageData !== 'string' || !raw.imageData) return null;
  // FIX #7.3c (project storage audit): reject anything that isn't a data: URL.
  if (!/^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(raw.imageData)) {
    console.warn('[projectStorage] Rejecting floor plan — not a data: URL');
    return null;
  }
  if (!finite(raw.width) || raw.width <= 0) return null;
  if (!finite(raw.height) || raw.height <= 0) return null;
  return { imageData: raw.imageData, width: raw.width, height: raw.height };
}

/** Full runtime validation for a project loaded from disk or imported. */
export function sanitizeProject(input: unknown): Project | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Partial<Project>;
  if (typeof p.id !== 'string' || !p.id) return null;
  if (typeof p.name !== 'string') p.name = 'Untitled';
  return {
    id: p.id,
    name: p.name,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    floorPlan: sanitizeFloorPlan(p.floorPlan),
    scale: sanitizeScale(p.scale),
    items: sanitizeItems(p.items),
    stageX: finite(p.stageX) ? p.stageX : 20,
    stageY: finite(p.stageY) ? p.stageY : 20,
    stageScale: finite(p.stageScale) && p.stageScale > 0 ? p.stageScale : 1,
    schemaVersion: typeof p.schemaVersion === 'number' ? p.schemaVersion : 0,
    measurementLines: Array.isArray(p.measurementLines) ? p.measurementLines : [],
    eraseStrokes: Array.isArray(p.eraseStrokes) ? p.eraseStrokes : [],
  };
}

/** Stricter than sanitizeProject — used for JSON imports to reject obviously
 *  wrong files up front. */
export function validateImportedProject(input: unknown): { ok: true; project: Project } | { ok: false; reason: string } {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'File is not a JSON object.' };
  const p = input as Partial<Project>;
  if (typeof p.id !== 'string') return { ok: false, reason: 'Missing project id.' };
  if (!('items' in p) || !Array.isArray(p.items)) return { ok: false, reason: 'Missing or malformed items array.' };
  if (!('scale' in p) || typeof p.scale !== 'object' || p.scale === null) {
    return { ok: false, reason: 'Missing scale calibration.' };
  }
  const sanitized = sanitizeProject(p);
  if (!sanitized) return { ok: false, reason: 'Project failed validation.' };
  return { ok: true, project: sanitized };
}

// ──────────────────────────────────────────────────────────────────────────
// Migration (FIX #7.5c)
// ──────────────────────────────────────────────────────────────────────────

/** Upgrade a persisted project through every schema version. */
function migrateProject(p: PersistedProject): PersistedProject {
  let out: PersistedProject = { ...p };
  const from = typeof out.schemaVersion === 'number' ? out.schemaVersion : 0;
  if (from < 1) {
    // 0 → 1: no on-disk changes; ensure the new optional fields exist.
    if (!Array.isArray(out.measurementLines)) out.measurementLines = [];
    if (!Array.isArray(out.eraseStrokes)) out.eraseStrokes = [];
  }
  out.schemaVersion = CURRENT_SCHEMA_VERSION;
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Persist / hydrate — the dedup boundary (FIX #7.1a)
// ──────────────────────────────────────────────────────────────────────────

/** Convert an in-memory Project into its on-disk row: floor plan replaced by
 *  a hash reference, imageData stored in the floorplans store. */
function persistProject(p: Project): PersistedProject {
  const persisted: PersistedProject = { ...p, schemaVersion: CURRENT_SCHEMA_VERSION };
  if (p.floorPlan && p.floorPlan.imageData) {
    const hash = putFloorPlanData(p.floorPlan.imageData);
    persisted._floorPlanHash = hash;
    persisted.floorPlan = { ...p.floorPlan, imageData: '' };
  } else {
    delete persisted._floorPlanHash;
  }
  return persisted;
}

/** Restore imageData onto the floor plan of a persisted project row. */
function hydrateProject(p: PersistedProject): Project {
  const migrated = migrateProject(p);
  const { _floorPlanHash, ...rest } = migrated;
  let floorPlan = rest.floorPlan;
  if (_floorPlanHash) {
    const imageData = getFloorPlanData(_floorPlanHash);
    if (imageData) {
      floorPlan = floorPlan
        ? { ...floorPlan, imageData }
        : { imageData, width: 0, height: 0 };
    } else if (floorPlan) {
      // Reference to a missing blob — clear rather than render broken.
      console.warn('[projectStorage] Missing floor plan blob for hash', _floorPlanHash);
      floorPlan = null;
    }
  }
  const clean = sanitizeProject({ ...rest, floorPlan }) ?? {
    ...rest, floorPlan,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    measurementLines: [], eraseStrokes: [],
  };
  return clean;
}

// ──────────────────────────────────────────────────────────────────────────
// Storage estimate (FIX #7.1b)
// ──────────────────────────────────────────────────────────────────────────

export interface StorageEstimate {
  usage?: number;   // bytes
  quota?: number;   // bytes
  ratio?: number;   // 0..1
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return {};
  try {
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? undefined;
    const quota = est.quota ?? undefined;
    return { usage, quota, ratio: usage && quota ? usage / quota : undefined };
  } catch { return {}; }
}

// ──────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────

export function getAllProjects(): Project[] {
  // FIX #7.3a (project storage audit): on parse failure, back up the raw
  // string so nothing is lost, then return []. UI surfaces the report.
  const persisted = safeReadJSON<PersistedProject[]>(
    PROJECTS_KEY, [],
    (raw, err) => {
      try {
        const backupKey = `${CORRUPT_BACKUP_PREFIX}${Date.now()}`;
        localStorage.setItem(backupKey, raw);
        lastCorruption = {
          backupKey,
          rawByteLength: raw.length,
          message: err instanceof Error ? err.message : String(err),
        };
        console.error(`[projectStorage] Corrupt project store backed up to "${backupKey}"`, err);
      } catch (backupErr) {
        // Backing up may fail if quota is exhausted — still log.
        lastCorruption = {
          backupKey: '',
          rawByteLength: raw.length,
          message: err instanceof Error ? err.message : String(err),
        };
        console.error('[projectStorage] Corrupt store and backup failed:', err, backupErr);
      }
    }
  );
  if (!Array.isArray(persisted)) return [];
  const hydrated: Project[] = [];
  for (const row of persisted) {
    try {
      hydrated.push(hydrateProject(row));
    } catch (err) {
      console.warn('[projectStorage] Skipping unreadable project row:', err);
    }
  }
  return hydrated;
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'QuotaExceededError'
    || err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || /quota/i.test(err.message);
}

function readPersistedRaw(): PersistedProject[] {
  const raw = safeReadJSON<PersistedProject[]>(PROJECTS_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

function writePersisted(rows: PersistedProject[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(rows));
  } catch (err) {
    console.error('Failed to write projects to localStorage:', err);
    if (isQuotaError(err)) {
      throw new Error(
        'Browser storage is full. Please delete an old project (or export it as JSON) and try again.'
      );
    }
    throw new Error('Failed to save: your browser blocked storage access.');
  }
}

export function saveProject(project: Project): void {
  // FIX #7.2d (project storage audit): sanitize before saving so a bug
  // producing NaN coordinates or partial state can't persist unrecoverable
  // rows.
  const clean = sanitizeProject(project);
  if (!clean) throw new Error('Project failed validation and was not saved.');
  const persisted = persistProject({ ...clean, updatedAt: new Date().toISOString() });

  const rows = readPersistedRaw();
  const idx = rows.findIndex(p => p.id === persisted.id);
  if (idx >= 0) rows[idx] = persisted;
  else rows.push(persisted);
  writePersisted(rows);
  // FIX #7.1a: reclaim floor plan blobs no longer referenced after this save.
  gcFloorPlans(rows);
}

export function deleteProject(id: string): void {
  const rows = readPersistedRaw().filter(p => p.id !== id);
  writePersisted(rows);
  gcFloorPlans(rows);
}

/** One-time cleanup: removes all entries named 'Auto-save'. */
export function purgeAutoSaves(): void {
  const rows = readPersistedRaw().filter(p => p.name !== 'Auto-save');
  writePersisted(rows);
  gcFloorPlans(rows);
}

// FIX #7.6d (project storage audit): the on-disk id used for the auto-saved
// draft is exported so the app can offer to restore it on next launch.
export const DRAFT_AUTOSAVE_ID = 'draft-autosave';
export function getDraftAutosave(): Project | null {
  const rows = readPersistedRaw();
  const draft = rows.find(r => r.id === DRAFT_AUTOSAVE_ID);
  if (!draft) return null;
  try { return hydrateProject(draft); } catch { return null; }
}
export function deleteDraftAutosave(): void {
  deleteProject(DRAFT_AUTOSAVE_ID);
}

export function exportProjectJson(project: Project): void {
  // Ensure schema version tag rides along on the exported file.
  const withVersion: Project = { ...project, schemaVersion: CURRENT_SCHEMA_VERSION };
  const blob = new Blob([JSON.stringify(withVersion, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // FIX #6.4 (code quality audit): filename-safe project name.
  const safe = (project.name || 'project').replace(/[^A-Za-z0-9 _.-]/g, '_').replace(/\s+/g, '_');
  a.download = `${safe || 'project'}_mirabello.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// FIX #7.5d (project storage audit): file-size warning threshold (soft) and
// refusal threshold (hard).
const IMPORT_WARN_BYTES = 5 * 1024 * 1024;   // 5 MB
const IMPORT_REJECT_BYTES = 50 * 1024 * 1024; // 50 MB

export function importProjectJson(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    if (file.size > IMPORT_REJECT_BYTES) {
      reject(new Error(`File is too large (${(file.size / 1e6).toFixed(1)} MB). Max 50 MB.`));
      return;
    }
    if (file.size > IMPORT_WARN_BYTES) {
      console.warn(`[projectStorage] Large import (${(file.size / 1e6).toFixed(1)} MB); parsing may take a moment.`);
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // FIX #7.5b (project storage audit): strict shape validation before
        // accepting an import. Random JSON is now rejected with a clear message.
        const check = validateImportedProject(parsed);
        if (!check.ok) {
          reject(new Error(`Invalid project file: ${check.reason}`));
          return;
        }
        resolve(check.project);
      } catch {
        reject(new Error('Invalid project file — not valid JSON.'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
