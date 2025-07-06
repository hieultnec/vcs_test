import apiClient from '@/config/api';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

export interface ProjectDocument {
  document_id: string;
  project_id: string;
  filename: string;
  filepath: string;
  dify_document_id?: string;
  is_current: boolean;
  uploaded_at: string;
  metadata?: Record<string, unknown>;
}

export interface Project {
  id: string;
  project_id: string;
  name: string;
  description: string;
  owner: string;
  status: string;
  version: string;
  created_at: string;
  lastUpdated: string;
  uploaded_documents?: ProjectDocument[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  owner?: string;
  is_current?: boolean;
  file?: File[];
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  result?: T;
}

// Type guard to check if response is ApiResponse
function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return data && typeof data === 'object' && 'status' in (data as object) && 'message' in (data as object);
}

export const projectService = {
  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      const response = await apiClient.get('/api/projects');
      // Handle both response formats
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (isApiResponse<Project[]>(response.data)) {
        return response.data.result || [];
      }
      return [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to fetch projects:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get project by ID
  async getProject(id: string): Promise<Project> {
    try {
      const response = await apiClient.get(`/api/project/get?id=${id}`);
      // Handle both response formats
      if (isApiResponse<Project>(response.data)) {
        if (!response.data.result) {
          throw new Error('Project not found');
        }
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch project ${id}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Create project with file upload
  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.owner) formData.append('owner', data.owner);
      if (data.is_current !== undefined) formData.append('is_current', data.is_current.toString());
      
      if (data.file && data.file.length > 0) {
        data.file.forEach((file) => {
          formData.append('file', file);
        });
      }

      const response = await apiClient.post('/api/project/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Handle both response formats
      if (isApiResponse<Project>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to create project');
        }
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to create project:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Update project
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const response = await apiClient.put('/api/project/update', {
        id,
        ...data,
      });
      // Handle both response formats
      if (isApiResponse<Project>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to update project');
        }
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to update project ${id}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/project/delete?id=${id}`);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to delete project ${id}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },
};
