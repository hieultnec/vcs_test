import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/services/projectService';
import { projectService } from '@/services/projectService';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await projectService.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError('Failed to load projects. Please try again.');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setError(null);
      await projectService.deleteProject(projectId);
      // Remove the deleted project from the list
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    } catch (err) {
      setError('Failed to delete project');
      console.error('Error deleting project:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    loadProjects,
    deleteProject,
    clearError,
  };
}; 