import { Project } from '../types';

const PROJECTS_KEY = 'mirabello_projects';

export function getAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: Project): void {
  const projects = getAllProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    projects[idx] = updated;
  } else {
    projects.push(updated);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getAllProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/** One-time cleanup: removes all entries named 'Auto-save'. */
export function purgeAutoSaves(): void {
  const projects = getAllProjects().filter(p => p.name !== 'Auto-save');
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function exportProjectJson(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '_')}_mirabello.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectJson(file: File): Promise<Project> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const project = JSON.parse(e.target?.result as string) as Project;
        resolve(project);
      } catch {
        reject(new Error('Invalid project file'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
