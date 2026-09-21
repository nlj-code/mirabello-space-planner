// FIX #4.4 (code quality audit): named constants replacing magic numbers.
// If a number appears here, don't inline it elsewhere.

// ─── Timing ────────────────────────────────────────────────────────────────
export const AUTOSAVE_INTERVAL_MS = 30_000; // FIX #5.5: spec says 30 s

// ─── Zoom / stage ──────────────────────────────────────────────────────────
export const WHEEL_ZOOM_FACTOR = 1.08;
export const ZOOM_MIN = 0.05;
export const ZOOM_MAX = 10;
export const BUTTON_ZOOM_FACTOR = 1.2;

// ─── History ───────────────────────────────────────────────────────────────
export const HISTORY_LIMIT = 50;

// ─── Snapping (FIX #5.2 / #5.3) ────────────────────────────────────────────
export const GRID_SIZE_CM = 10;                // spec: 10 cm grid
export const SNAP_TO_OBJECT_TOLERANCE_PX = 8;  // screen-px tolerance
// Grid rendering is expensive at huge extents — only draw within this many
// stage-pixels of the visible viewport in each direction.
export const GRID_RENDER_MARGIN_PX = 2000;

// ─── Konva anchors (FIX #3.4) ──────────────────────────────────────────────
export const TRANSFORMER_ANCHOR_SIZE = 12;
export const TRANSFORMER_ANCHOR_CORNER_RADIUS = 3;

// ─── Rotation snap ─────────────────────────────────────────────────────────
export const ROTATION_SNAPS = [0, 45, 90, 135, 180, 225, 270, 315];
export const ROTATION_SNAP_TOLERANCE_DEG = 5;

// ─── Export (FIX #7.5c hooked here for reuse) ──────────────────────────────
export const EXPORT_PIXEL_RATIO = 2;           // spec: PNG at 2×
export const DEFAULT_PDF_FORMAT = 'a3';        // spec: A3 landscape

// ─── Confirm thresholds (FIX #3.5) ─────────────────────────────────────────
export const MASS_DELETE_CONFIRM_THRESHOLD = 3;

// ─── Mass-delete safety net for out-of-view items (FIX #3.7) ───────────────
export const ZOOM_FIT_PADDING_PX = 60;
