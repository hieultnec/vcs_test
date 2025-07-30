import apiClient from '@/config/api';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

export interface Bug {
  id: string;
  project_id: string;
  task_id?: string;
  scenario_id?: string;
  summary: string;
  description: string;
  severity: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  environment?: Record<string, unknown>;
}

export interface BugFix {
  id: string;
  bug_id: string;
  fix_description: string;
  fixed_by: string;
  fix_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBugData {
  project_id: string;
  task_id?: string;
  scenario_id?: string;
  summary: string;
  description: string;
  severity: string;
  status: string;
  created_by: string;
  environment?: Record<string, unknown>;
}

export interface CreateBugFixData {
  bug_id: string;
  fix_description: string;
  fixed_by: string;
  fix_status: string;
}

export interface CreateBugsBatchData {
  project_id: string;
  task_id?: string;
  scenario_id?: string;
  bugs: {
    summary: string;
    description: string;
    severity: string;
    status?: string;
    created_by?: string;
    environment?: Record<string, unknown>;
  }[];
}

export interface CreateBugsBatchResponse {
  project_id: string;
  task_id?: string;
  scenario_id?: string;
  bugs: Bug[];
  total_created: number;
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

// Helper function to map API response to Bug interface
function mapApiBugToBug(apiBug: any): Bug {
  return {
    id: apiBug.bug_id || apiBug.id,
    project_id: apiBug.project_id,
    task_id: apiBug.task_id,
    scenario_id: apiBug.scenario_id,
    summary: apiBug.summary,
    description: apiBug.description,
    severity: apiBug.severity,
    status: apiBug.status,
    created_by: apiBug.created_by,
    created_at: apiBug.created_at,
    updated_at: apiBug.updated_at,
    environment: apiBug.environment
  };
}

// Helper function to map API response to BugFix interface
function mapApiBugFixToBugFix(apiBugFix: any): BugFix {
  return {
    id: apiBugFix.fix_id || apiBugFix.id,
    bug_id: apiBugFix.bug_id,
    fix_description: apiBugFix.fix_description,
    fixed_by: apiBugFix.fixed_by,
    fix_status: apiBugFix.fix_status,
    created_at: apiBugFix.created_at,
    updated_at: apiBugFix.updated_at
  };
}

export const bugService = {
  // Create bug
  async createBug(data: CreateBugData): Promise<Bug> {
    try {
      const response = await apiClient.post('/api/bug/create', data);
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to create bug');
        }
        return mapApiBugToBug(response.data.result);
      }
      return mapApiBugToBug(response.data);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to create bug:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get bugs with filters
  async getBugs(projectId: string, filters?: {
    status?: string;
    severity?: string;
    task_id?: string;
    scenario_id?: string;
  }): Promise<Bug[]> {
    try {
      const response = await apiClient.get('/api/bug/list', {
        params: { project_id: projectId, ...filters }
      });
      // Handle both response formats
      if (Array.isArray(response.data)) {
        return response.data.map(mapApiBugToBug);
      }
      if (isApiResponse<any[]>(response.data)) {
        return (response.data.result || []).map(mapApiBugToBug);
      }
      return [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to fetch bugs:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get bug by ID
  async getBug(bugId: string): Promise<Bug> {
    try {
      const response = await apiClient.get(`/api/bug/get?bug_id=${bugId}`);
      // Handle both response formats
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Bug not found');
        }
        return mapApiBugToBug(response.data.result);
      }
      return mapApiBugToBug(response.data);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch bug ${bugId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Update bug
  async updateBug(bugId: string, data: Partial<Bug>): Promise<Bug> {
    try {
      const response = await apiClient.put('/api/bug/update', {
        bug_id: bugId,
        ...data,
      });
      // Handle both response formats
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to update bug');
        }
        return mapApiBugToBug(response.data.result);
      }
      return mapApiBugToBug(response.data);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to update bug ${bugId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Delete bug
  async deleteBug(bugId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/bug/delete?bug_id=${bugId}`);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to delete bug ${bugId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Create bug fix
  async createBugFix(data: CreateBugFixData): Promise<BugFix> {
    try {
      const response = await apiClient.post('/api/bug/fix/create', data);
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to create bug fix');
        }
        return mapApiBugFixToBugFix(response.data.result);
      }
      return mapApiBugFixToBugFix(response.data);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to create bug fix:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Verify bug fix
  async verifyBugFix(fixId: string, verificationStatus: string): Promise<BugFix> {
    try {
      const response = await apiClient.put('/api/bug/fix/verify', {
        fix_id: fixId,
        verification_status: verificationStatus,
      });
      // Handle both response formats
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to verify bug fix');
        }
        return mapApiBugFixToBugFix(response.data.result);
      }
      return mapApiBugFixToBugFix(response.data);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to verify bug fix ${fixId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get bug fixes
  async getBugFixes(bugId: string): Promise<BugFix[]> {
    try {
      const response = await apiClient.get(`/api/bug/fix/list?bug_id=${bugId}`);
      // Handle both response formats
      if (Array.isArray(response.data)) {
        return response.data.map(mapApiBugFixToBugFix);
      }
      if (isApiResponse<any[]>(response.data)) {
        return (response.data.result || []).map(mapApiBugFixToBugFix);
      }
      return [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch bug fixes for bug ${bugId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Create bugs in batch
  async createBugsBatch(data: CreateBugsBatchData): Promise<CreateBugsBatchResponse> {
    try {
      const response = await apiClient.post('/api/bug/create_batch', data);
      if (isApiResponse<any>(response.data)) {
        if (!response.data.result) {
          throw new Error('Failed to create bugs batch');
        }
        return {
          ...response.data.result,
          bugs: response.data.result.bugs.map(mapApiBugToBug)
        };
      }
      return {
        ...response.data,
        bugs: response.data.bugs.map(mapApiBugToBug)
      };
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to create bugs batch:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },
};