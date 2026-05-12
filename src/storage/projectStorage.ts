import { Project } from "../types/project";
import { mockProjects } from "../data/mockProjects";

const STORAGE_KEY = "imagext_projects";

export function getProjects(): Project[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Project[];
    } catch (e) {
      console.error("Failed to parse projects from localStorage", e);
    }
  }
  
  // If no projects in storage, initialize with mock projects
  saveProjects(mockProjects);
  return mockProjects;
}

export function getProjectById(projectId: string): Project | undefined {
  const projects = getProjects();
  return projects.find(p => p.id === projectId);
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function addProject(project: Project): void {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
}

export function updateProject(updatedProject: Project): void {
  const projects = getProjects();
  saveProjects(projects.map(project => project.id === updatedProject.id ? updatedProject : project));
}

export function deleteProject(projectId: string): void {
  const projects = getProjects();
  const updatedProjects = projects.filter(p => p.id !== projectId);
  saveProjects(updatedProjects);
}
