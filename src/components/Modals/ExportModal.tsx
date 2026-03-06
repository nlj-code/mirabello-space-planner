import React, { useState } from 'react';
import Konva from 'konva';
import { useApp } from '../../store/AppContext';
import { exportToPng, exportToPdf, ExportRegion } from '../../lib/exportHelper';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  exportRegion?: ExportRegion | null;
  onClose: () => void;
}

export default function ExportModal({ stageRef, exportRegion, onClose }: Props) {
  const { state } = useApp();
  const [projectName, setProjectName] = useState('');
  const [designerName, setDesignerName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [nameError, setNameError] = useState(false);

  const scaleLabel = state.scale.calibrated
    ? `1:${Math.round(100 / state.scale.pixelsPerMeter * 100)} (approx.)`
    : 'Scale not calibrated';

  const handleExportPng = async () => {
    if (!stageRef.current) return;
    if (!projectName.trim()) { setNameError(true); return; }
    setNameError(false);
    setExporting(true);
    try {
      await exportToPng(stageRef.current, { projectName: projectName.trim(), designerName, scaleLabel, region: exportRegion || undefined });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!stageRef.current) return;
    if (!projectName.trim()) { setNameError(true); return; }
    setNameError(false);
    setExporting(true);
    try {
      await exportToPdf(stageRef.current, { projectName: projectName.trim(), designerName, scaleLabel, region: exportRegion || undefined });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 420 }}>
        <div className="modal-title">Export Drawing</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Project Name</label>
            <input
              className="input"
              value={projectName}
              onChange={e => { setProjectName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
              placeholder="Project name..."
              style={nameError ? { borderColor: '#fc8181', outline: 'none', boxShadow: '0 0 0 2px rgba(252,129,129,0.25)' } : undefined}
            />
            {nameError && (
              <div style={{ fontSize: 11, color: '#fc8181', marginTop: 4 }}>
                Project name is required to export.
              </div>
            )}
          </div>
          <div>
            <label className="label">Designer Name</label>
            <input
              className="input"
              value={designerName}
              onChange={e => setDesignerName(e.target.value)}
              placeholder="Your name..."
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Scale Indicator</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{scaleLabel}</div>
            {!state.scale.calibrated && (
              <div style={{ fontSize: 11, color: '#f6ad55', marginTop: 4 }}>
                ⚠ Use the Scale Tool to calibrate for accurate scale bar
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Canvas info</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              {state.items.length} items
            </div>
          </div>

          {exportRegion && (
            <div style={{ background: 'rgba(232,184,109,0.08)', borderRadius: 6, padding: 10, border: '1px solid rgba(232,184,109,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Export Region</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {Math.round(exportRegion.width)} × {Math.round(exportRegion.height)} px
                &nbsp;→&nbsp; {Math.round(exportRegion.width * 2)} × {Math.round(exportRegion.height * 2)} px output (2×)
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={handleExportPng}
              disabled={exporting}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Export PNG
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={handleExportPdf}
              disabled={exporting}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Export PDF (A3)
            </button>
          </div>

          {exporting && (
            <div style={{ textAlign: 'center', color: 'var(--accent)', fontSize: 12 }}>
              Generating export...
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={exporting}>Close</button>
        </div>
      </div>
    </div>
  );
}
