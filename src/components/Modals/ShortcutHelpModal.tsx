// FIX #3.8 (code quality audit): keyboard-shortcut cheat sheet.
// Triggered by the '?' key or the toolbar Help button.
import React from 'react';

interface Props { onClose: () => void }

const SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'Tools',
    rows: [
      ['V or S', 'Select tool'],
      ['P', 'Pan tool'],
      ['C', 'Calibrate scale'],
      ['M', 'Measure'],
      ['E', 'Erase'],
      ['Space (hold)', 'Temporary pan'],
    ],
  },
  {
    title: 'Editing',
    rows: [
      ['Ctrl+Z / ⌘Z', 'Undo'],
      ['Ctrl+Y / Ctrl+Shift+Z', 'Redo'],
      ['Delete / Backspace', 'Delete selected'],
      ['Arrow keys', 'Nudge by 1 cm'],
      ['Shift+Arrow', 'Nudge by 10 cm'],
      ['Ctrl+G / ⌘G', 'Group selected'],
      ['Escape', 'Clear selection / cancel'],
    ],
  },
  {
    title: 'Canvas',
    rows: [
      ['Mouse wheel', 'Zoom (cursor-centered)'],
      ['Middle mouse drag', 'Pan'],
      ['Shift+click', 'Add to selection'],
      ['Click empty + drag', 'Rubber-band select'],
      ['Right-click item', 'Context menu'],
    ],
  },
  {
    title: 'Help',
    rows: [
      ['?', 'Toggle this cheat-sheet'],
    ],
  },
];

export default function ShortcutHelpModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 520, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Keyboard Shortcuts</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {SECTIONS.map(sec => (
            <div key={sec.title}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
                {sec.title.toUpperCase()}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {sec.rows.map(([keys, desc]) => (
                    <tr key={keys}>
                      <td style={{ padding: '4px 8px 4px 0', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        <kbd style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border)',
                          borderRadius: 3,
                          padding: '1px 6px',
                          fontFamily: 'inherit',
                          fontSize: 11,
                        }}>{keys}</kbd>
                      </td>
                      <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
