import React, { useState } from 'react';

interface Props {
  onSave: (name: string) => void;
  onSkip: () => void;
}

export default function AutoSaveNameModal({ onSave, onSkip }: Props) {
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 380 }}>
        <div className="modal-title">Name Your Project</div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Your work is ready to be auto-saved. Give this project a name so your progress is kept safe.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label className="label">Project Name</label>
          <input
            className="input"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Ground Floor Layout..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onSkip} style={{ fontSize: 12 }}>
            Skip for now
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ fontSize: 12 }}
          >
            Save Project
          </button>
        </div>
      </div>
    </div>
  );
}
