import React, { useState } from 'react';

const STORAGE_KEY = 'mirabello_auth';
const PASSWORD = 'Mirabello';

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

interface Props {
  onAuth: () => void;
}

export default function PasswordGate({ onAuth }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '48px 40px',
        width: 360,
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Logo mark */}
        <div style={{ fontSize: 40, marginBottom: 16, color: 'var(--accent)' }}>⬡</div>

        <h1 style={{
          margin: '0 0 4px',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}>
          Mirabello Space Planner
        </h1>
        <p style={{
          margin: '0 0 32px',
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          Enter your password to continue
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
              animation: shake ? 'shake 0.4s ease' : 'none',
            }}
          />

          {error && (
            <p style={{
              margin: '8px 0 0',
              fontSize: 12,
              color: 'var(--danger)',
              textAlign: 'left',
            }}>
              Incorrect password. Please try again.
            </p>
          )}

          <button
            type="submit"
            style={{
              marginTop: 20,
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#1a1a2e',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Unlock
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
