import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { Project } from '../../types';
import {
  getAllProjects, saveProject, deleteProject,
  exportProjectJson, importProjectJson
} from '../../lib/projectStorage';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose: () => void;
}

export default function ProjectModal({ onClose }: Props) {
  const { state, dispatch } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjects(getAllProjects());
  }, []);

  const getCurrentProject = (): Project => ({
    id: state.currentProject?.id || uuidv4(),
    name: state.currentProject?.name || newName || 'Untitled Project',
    createdAt: state.currentProject?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    floorPlan: state.floorPlan,
    scale: state.scale,
    items: state.items,
    stageX: state.stageX,
    stageY: state.stageY,
    stageScale: state.stageScale,
  });

  const handleSaveNew = () => {
    const name = newName.trim() || 'Untitled Project';
    const project: Project = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      floorPlan: state.floorPlan,
      scale: state.scale,
      items: state.items,
      stageX: state.stageX,
      stageY: state.stageY,
      stageScale: state.stageScale,
    };
    try {
      saveProject(project);
      setProjects(getAllProjects());
      setNewName('');
      dispatch({ type: 'LOAD_PROJECT', project });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save project.');
    }
  };

  const handleSaveCurrent = () => {
    const proj = getCurrentProject();
    try {
      saveProject(proj);
      setProjects(getAllProjects());
      dispatch({ type: 'LOAD_PROJECT', project: proj });
      alert('Project saved!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save project.');
    }
  };

  const handleLoad = (project: Project) => {
    if (!confirm(`Load "${project.name}"? Unsaved changes will be lost.`)) return;
    dispatch({ type: 'LOAD_PROJECT', project });
    onClose();
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProject(id);
    setProjects(getAllProjects());
  };

  const handleRename = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    const all = getAllProjects();
    const proj = all.find(p => p.id === id);
    if (!proj) return;
    saveProject({ ...proj, name: trimmed });
    setProjects(getAllProjects());
    setEditingId(null);
  };

  const handleExport = (project: Project) => {
    exportProjectJson(project);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await importProjectJson(file);
      project.id = uuidv4(); // New ID to avoid conflict
      saveProject(project);
      setProjects(getAllProjects());
      alert(`Project "${project.name}" imported successfully!`);
    } catch (err) {
      console.error('Import failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to import project. Invalid file format.');
    }
    e.target.value = '';
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 500 }}>
        <div className="modal-title">Project Manager</div>

        {/* Save current */}
        <div style={{ background: 'rgba(232,184,109,0.08)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Current session: <strong style={{ color: 'var(--text-primary)' }}>
              {state.currentProject?.name || 'Unsaved'}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {state.currentProject ? (
              <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleSaveCurrent}>
                Save Current Project
              </button>
            ) : (
              <>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="New project name..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNew()}
                />
                <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={handleSaveNew}>
                  Save as New
                </button>
              </>
            )}
          </div>
        </div>

        {/* Import/Export buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => importRef.current?.click()}>
            Import JSON
          </button>
          {state.currentProject && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11 }}
              onClick={() => exportProjectJson(getCurrentProject())}
            >
              Export Current JSON
            </button>
          )}
        </div>

        {/* Projects list */}
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Saved Projects ({projects.length})
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {projects.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, padding: 12, textAlign: 'center' }}>
              No saved projects yet
            </div>
          )}
          {projects.map(project => (
            <div
              key={project.id}
              style={{
                background: project.id === state.currentProject?.id ? 'rgba(232,184,109,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${project.id === state.currentProject?.id ? 'rgba(232,184,109,0.3)' : 'var(--border)'}`,
                borderRadius: 6, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {editingId === project.id ? (
                <>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={editName}
                    autoFocus
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(project.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button className="btn-icon" onClick={() => handleRename(project.id)} title="Save">✓</button>
                  <button className="btn-icon" onClick={() => setEditingId(null)} title="Cancel">✕</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {project.name}
                      {project.id === state.currentProject?.id && (
                        <span style={{ fontSize: 9, color: 'var(--accent)', marginLeft: 6, verticalAlign: 'middle' }}>CURRENT</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {project.items.length} items · {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => handleLoad(project)}
                    title="Load"
                    style={{ fontSize: 11 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => { setEditingId(project.id); setEditName(project.name); }}
                    title="Rename"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleExport(project)}
                    title="Export JSON"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(project.id, project.name)}
                    title="Delete"
                    style={{ color: '#fc8181' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
