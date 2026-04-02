import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { useApp } from '../../store/AppContext';

interface Props {
  onClose: () => void;
}

type CalibStep = 'intro' | 'drawing' | 'enter-length' | 'done';

export default function ScaleModal({ onClose }: Props) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState<CalibStep>('intro');
  const [p1, setP1] = useState<{ x: number; y: number } | null>(null);
  const [p2, setP2] = useState<{ x: number; y: number } | null>(null);
  const [realLength, setRealLength] = useState('');
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [floorImage, setFloorImage] = useState<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });
  const [imgScale, setImgScale] = useState(1);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Fit the image to fill the available viewport space
  // Since overlay is position:fixed inset:0, use window dimensions directly (always reliable)
  const fitImage = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const topBarH = 56;    // top bar approximate height
    const bottomBarH = 68; // bottom bar approximate height
    const pad = 32;        // padding
    const maxW = window.innerWidth - pad;
    const maxH = window.innerHeight - topBarH - bottomBarH - pad;
    const scaleW = maxW / img.width;
    const scaleH = maxH / img.height;
    // Allow scaling up to 3x for small images so they fill the screen
    const s = Math.min(scaleW, scaleH, 3);
    setImgScale(s);
    setStageSize({ w: Math.round(img.width * s), h: Math.round(img.height * s) });
  }, []);

  // Load the floor plan image
  useEffect(() => {
    if (!state.floorPlan) return;
    const img = new window.Image();
    img.src = state.floorPlan.imageData;
    img.onload = () => {
      imgRef.current = img;
      setFloorImage(img);
    };
  }, [state.floorPlan]);

  // Fit once the image is loaded
  // NOTE: Do NOT depend on `step` — changing step would re-fit and shift the calibration points.
  useEffect(() => {
    if (!floorImage) return;
    fitImage();
  }, [floorImage, fitImage]);

  // Re-fit when window resizes
  useEffect(() => {
    if (!floorImage) return;
    const handle = () => fitImage();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [floorImage, fitImage]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (step !== 'drawing') return;
    // Always get position from the Stage itself — not from e.target
    // (e.target could be a Circle/Line overlay which gives wrong coords)
    const stage = e.target.getStage()!;
    const pos = stage.getPointerPosition()!;
    if (!p1) {
      setP1(pos);
    } else if (!p2) {
      setP2(pos);
      setStep('enter-length');
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (step !== 'drawing') return;
    const stage = e.target.getStage()!;
    const pos = stage.getPointerPosition();
    setPreviewPos(pos || null);
  };

  const lineLen = p1 && p2
    ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
    : 0;

  const handleApply = () => {
    const m = parseFloat(realLength);
    if (isNaN(m) || m <= 0 || !lineLen) {
      alert('Please enter a valid length in meters');
      return;
    }
    // lineLen is measured on the scaled-down image in the modal
    // Convert to the full-resolution image pixel space:
    const lineLenAtFullRes = lineLen / imgScale;
    // pixelsPerMeter = how many pixels (in the full-res image) correspond to 1 real-world meter
    const pixelsPerMeter = lineLenAtFullRes / m;

    const oldPpm = state.scale.pixelsPerMeter;
    const newScale = {
      pixelsPerMeter,
      referenceLinePx: lineLenAtFullRes,
      referenceLineMeters: m,
      calibrated: true,
    };
    dispatch({ type: 'SET_SCALE', scale: newScale });

    // Rescale all existing items so their pixel sizes match the new pixelsPerMeter
    // Use a single SET_ITEMS dispatch to avoid loop-dispatch race condition
    if (state.items.length > 0 && oldPpm !== pixelsPerMeter) {
      const updatedItems = state.items.map(item => ({
        ...item,
        widthPx: (item.widthCm / 100) * pixelsPerMeter,
        heightPx: (item.heightCm / 100) * pixelsPerMeter,
        // Keep items in place — only rescale their pixel dimensions, not positions
      }));
      dispatch({ type: 'SET_ITEMS', items: updatedItems });
    }

    dispatch({ type: 'SET_TOOL', tool: 'select' });
    setStep('done');
  };

  const reset = () => {
    setP1(null); setP2(null); setRealLength(''); setPreviewPos(null);
    setStep('drawing');
  };

  // ---------- INTRO STEP ----------
  if (step === 'intro') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 520 }}>
          <div className="modal-title">Scale Calibration</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
            To place furniture accurately you need to set the real-world scale.<br />
            <strong style={{ color: 'var(--accent)' }}>How it works:</strong><br />
            ① Click the start of a known measurement on the plan (e.g. one end of a 5 m wall)<br />
            ② Click the end of that same measurement<br />
            ③ Type the real distance in metres → Done!
          </p>
          {!state.floorPlan && (
            <div style={{ color: '#fc8181', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(252,129,129,0.1)', borderRadius: 6 }}>
              ⚠ No floor plan uploaded yet. Please upload a plan first using the "Upload Plan" button.
            </div>
          )}
          {state.scale.calibrated && (
            <div style={{ color: '#68d391', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(104,211,145,0.1)', borderRadius: 6 }}>
              ✓ Currently calibrated: {state.scale.pixelsPerMeter.toFixed(1)} px/m
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {state.floorPlan && (
              <button className="btn btn-primary" onClick={() => setStep('drawing')}>
                Start Calibration →
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              {state.scale.calibrated ? 'Close' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DONE STEP ----------
  if (step === 'done') {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth: 440 }}>
          <div className="modal-title">Scale Calibration</div>
          <div style={{ color: '#68d391', fontSize: 16, marginBottom: 8 }}>✓ Scale calibrated successfully!</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
            {state.scale.pixelsPerMeter.toFixed(1)} pixels per metre<br />
            Your reference line of {state.scale.referenceLineMeters} m = {state.scale.referenceLinePx.toFixed(0)} image pixels<br />
            Furniture will now appear at the correct real-world size.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={onClose}>Start Designing</button>
            <button className="btn btn-ghost" onClick={reset}>Recalibrate</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DRAWING / ENTER-LENGTH STEP — true full-screen ----------
  const statusMsg = !p1
    ? '① Click the START point of a known measurement'
    : !p2
      ? '② Click the END point of the same measurement'
      : '✓ Line drawn — enter the real length below and click Apply';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Compact top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'var(--panel, #16213e)',
        borderBottom: '1px solid var(--border, #2a3a5c)',
        flexShrink: 0, minHeight: 36,
      }}>
        <span style={{ color: 'var(--accent, #e8b86d)', fontWeight: 700, fontSize: 14 }}>
          📐 Scale Calibration
        </span>
        <span style={{ color: 'var(--text-secondary, #8899aa)', fontSize: 13, flex: 1, textAlign: 'center' }}>
          {statusMsg}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8899aa', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          title="Cancel"
        >×</button>
      </div>

      {/* ── Canvas area — takes ALL remaining space ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          cursor: step === 'drawing' ? 'crosshair' : 'default',
          padding: 8,
          minHeight: 0,  // important for flex shrinking
        }}
      >
        {floorImage ? (
          <div style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden', lineHeight: 0 }}>
            <Stage
              width={stageSize.w} height={stageSize.h}
              onClick={handleStageClick}
              onMouseMove={handleStageMouseMove}
            >
              <Layer>
                <KonvaImage image={floorImage} x={0} y={0} width={stageSize.w} height={stageSize.h} />

                {/* Live preview line */}
                {p1 && !p2 && previewPos && (
                  <Line
                    points={[p1.x, p1.y, previewPos.x, previewPos.y]}
                    stroke="#e8b86d" strokeWidth={2} dash={[8, 4]} opacity={0.85}
                    listening={false}
                  />
                )}

                {/* Confirmed line */}
                {p1 && p2 && (
                  <>
                    <Line
                      points={[p1.x, p1.y, p2.x, p2.y]}
                      stroke="#e8b86d" strokeWidth={2.5} dash={[8, 4]}
                      listening={false}
                    />
                    {/* Tick marks at endpoints */}
                    {[p1, p2].map((pt, i) => {
                      const dx = p2.x - p1.x, dy = p2.y - p1.y;
                      const len = Math.sqrt(dx * dx + dy * dy) || 1;
                      const nx = -dy / len * 10, ny = dx / len * 10;
                      return (
                        <Line key={i}
                          points={[pt.x + nx, pt.y + ny, pt.x - nx, pt.y - ny]}
                          stroke="#e8b86d" strokeWidth={2}
                          listening={false}
                        />
                      );
                    })}
                    {/* Mid-label with background pill */}
                    {(() => {
                      const labelText = `${lineLen.toFixed(0)} px`;
                      const labelW = labelText.length * 9 + 16;
                      const labelH = 24;
                      const mx = (p1.x + p2.x) / 2;
                      const my = (p1.y + p2.y) / 2;
                      return (
                        <>
                          <Rect
                            x={mx - labelW / 2}
                            y={my - labelH - 8}
                            width={labelW}
                            height={labelH}
                            fill="rgba(0,0,0,0.8)"
                            cornerRadius={4}
                            listening={false}
                          />
                          <Text
                            x={mx - labelW / 2 + 8}
                            y={my - labelH - 8 + 5}
                            text={labelText}
                            fontSize={14}
                            fontStyle="bold"
                            fill="#e8b86d"
                            listening={false}
                          />
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Endpoint circles — listening=false so clicks pass through to stage */}
                {p1 && (
                  <Circle x={p1.x} y={p1.y} radius={7} fill="#e8b86d" stroke="white" strokeWidth={2} listening={false} />
                )}
                {p2 && (
                  <Circle x={p2.x} y={p2.y} radius={7} fill="#e8b86d" stroke="white" strokeWidth={2} listening={false} />
                )}
              </Layer>
            </Stage>
          </div>
        ) : (
          <div style={{ color: '#8899aa', fontSize: 14 }}>Loading floor plan…</div>
        )}
      </div>

      {/* ── Compact bottom bar ── */}
      <div style={{
        background: 'var(--panel, #16213e)',
        borderTop: '1px solid var(--border, #2a3a5c)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0, flexWrap: 'wrap', minHeight: 44,
      }}>
        {step === 'enter-length' && p1 && p2 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ color: 'var(--text-secondary, #8899aa)', fontSize: 13, whiteSpace: 'nowrap' }}>
              Real-world length:
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5.0"
                value={realLength}
                autoFocus
                onChange={e => setRealLength(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
                style={{
                  background: 'var(--bg, #1a1a2e)',
                  border: '2px solid var(--accent, #e8b86d)',
                  borderRadius: 6, color: 'white',
                  padding: '7px 44px 7px 12px',
                  fontSize: 16, width: 150,
                  outline: 'none',
                }}
              />
              <span style={{
                position: 'absolute', right: 12,
                color: 'var(--text-secondary, #8899aa)', fontSize: 14, pointerEvents: 'none',
              }}>m</span>
            </div>
            <button className="btn btn-primary" onClick={handleApply} style={{ padding: '7px 16px' }}>
              ✓ Apply Scale
            </button>
            <button className="btn btn-ghost" onClick={reset}>
              ↺ Redraw
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary, #8899aa)', fontSize: 13 }}>
            {!p1
              ? 'Click on the plan to place the first point of your measurement'
              : 'Now click the second point to complete the measurement line'}
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
