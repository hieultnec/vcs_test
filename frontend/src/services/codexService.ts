import apiClient from '@/config/api';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

export interface CodexTask {
  task_id: string;
  prompt: string;
  repo_label: string;
  environment_id?: string;
  status: string;
  created_at: string;
  message?: string;
}

export interface CodexRunRequest {
  prompt: string;
  repo_label: string;
  environment_id?: string;
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

export interface RepoOption {
  label: string;
  value: string;
}

export const codexService = {
  // Get list of repositories from Codex
  async getRepos(): Promise<RepoOption[]> {
    try {
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      return [
        { label: "innolabvn/byebug-backend", value: "innolabvn/byebug-backend" },
        { label: "innolabvn/asset-management", value: "innolabvn/asset-management" },
        { label: "innolabvn/byebug-codex-hub", value: "innolabvn/byebug-codex-hub" }
      ];
      
      // Original API call (commented out for development)
      // const response = await apiClient.get('/api/codex/repos');
      // if (isApiResponse<{ repos: RepoOption[] }>(response.data)) {
      //   return response.data.result?.repos || [];
      // }
      // return [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to fetch repositories:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Submit prompt to Codex with repository and environment
  async runCodex(data: CodexRunRequest): Promise<CodexTask> {
    try {
      const response = await apiClient.post('/api/codex/run', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (isApiResponse<CodexTask>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to submit prompt to Codex');
        }
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to run Codex:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get task status and result by task ID
  async getTask(taskId: string): Promise<CodexTask> {
    try {
      const response = await apiClient.get(`/api/codex/task/${taskId}`);
      if (isApiResponse<CodexTask>(response.data)) {
        if (!response.data.result) {
          throw new Error('Task not found');
        }
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch task ${taskId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get submitted tasks for a repository
  async getSubmittedTasks(repoLabel: string): Promise<CodexTask[]> {
    try {
      const response = await apiClient.get(`/api/codex/task/submitted?repo_label=${repoLabel}`);
      if (isApiResponse<{ submitted_tasks: CodexTask[] }>(response.data)) {
        return response.data.result?.submitted_tasks || [];
      }
      return [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch submitted tasks for ${repoLabel}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },
};