import apiClient from '@/config/api';
import { ApiErrorHandler } from '@/utils/apiErrorHandler';

export interface WorkflowVariable {
  id: string;
  variable_name: string;
  key: string;
  value: string;
  type: 'ssh_host' | 'ssh_port' | 'document' | 'custom';
  description?: string;
}

export interface WorkflowConfig {
  project_id: string;
  variables: WorkflowVariable[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkflowExecution {
  execution_id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  variables: WorkflowVariable[];
  result?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export const workflowService = {
  // Get workflow configuration for a project
  async getWorkflowConfig(projectId: string): Promise<WorkflowConfig> {
    try {
      const response = await apiClient.get(`/api/workflow/config?project_id=${projectId}`);
      if (response.data.result) {
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch workflow config for project ${projectId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Save workflow configuration
  async saveWorkflowConfig(config: WorkflowConfig): Promise<WorkflowConfig> {
    try {
      const response = await apiClient.post('/api/workflow/config', config);
      if (response.data.result) {
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to save workflow config:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Execute workflow
  async executeWorkflow(projectId: string, variables: WorkflowVariable[]): Promise<WorkflowExecution> {
    try {
      const response = await apiClient.post('/api/workflow/execute', {
        project_id: projectId,
        variables: variables
      });
      if (response.data.result) {
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to execute workflow:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get workflow execution status
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution> {
    try {
      const response = await apiClient.get(`/api/workflow/execution/${executionId}`);
      if (response.data.result) {
        return response.data.result;
      }
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to get execution status for ${executionId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get workflow execution history for a workflow
  async getExecutionHistory(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      const response = await apiClient.get(`/api/workflow/execution_history?workflow_id=${workflowId}`);
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch execution history for workflow ${workflowId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Cancel workflow execution
  async cancelExecution(executionId: string): Promise<void> {
    try {
      await apiClient.post(`/api/workflow/execution/${executionId}/cancel`);
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to cancel execution ${executionId}:`, apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Get available workflow templates
  async getTemplates(): Promise<{ name: string; variables: WorkflowVariable[] }[]> {
    try {
      const response = await apiClient.get('/api/workflow/templates');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to fetch workflow templates:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // CRUD for workflows
  async listWorkflows(projectId: string) {
    try {
      const response = await apiClient.get(`/api/workflow/list?project_id=${projectId}`);
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  async getWorkflow(workflowId: string) {
    try {
      const response = await apiClient.get(`/api/workflow/get?workflow_id=${workflowId}`);
      return response.data.result;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  async createWorkflow({ project_id, api_key, mode }: { project_id: string; api_key: string; mode: string }) {
    try {
      const response = await apiClient.post('/api/workflow/create', { project_id, api_key, mode });
      return response.data.result;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  async updateWorkflow({ workflow_id, update_data }: { workflow_id: string; update_data: unknown }) {
    try {
      const response = await apiClient.post('/api/workflow/update', {
        workflow_id,
        update_data,
      });
      return response.data.result;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  async deleteWorkflow(workflowId: string) {
    try {
      await apiClient.delete(`/api/workflow/delete?workflow_id=${workflowId}`);
      return workflowId;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  /**
   * Run a workflow via Dify and trace execution
   * @param project_id Project ID
   * @param workflow_id Workflow ID
   * @param inputs Workflow input variables
   * @param user User identifier (optional)
   * @param response_mode Dify response mode (optional, default 'blocking')
   * @returns { status, message, dify_response, execution_id, scenarios_saved }
   */
  async runDifyWorkflow({ project_id, workflow_id, inputs, user, response_mode }: {
    project_id: string;
    workflow_id: string;
    inputs: Record<string, unknown>;
    user?: string;
    response_mode?: string;
  }): Promise<{ status: number; message: string; dify_response: unknown; execution_id: string; scenarios_saved: boolean }> {
    console.log(`🚀 ~ { project_id, workflow_id, inputs, user, response_mode }:`, { project_id, workflow_id, inputs, user, response_mode })
    try {
      const response = await apiClient.post('/api/workflow/run', {
        project_id,
        workflow_id,
        inputs,
        user,
        response_mode,
      });
      return response.data;
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  /**
   * Get all workflow executions for a project
   */
  async getExecutionsByProject(projectId: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiClient.get(`/api/workflow/execution/list_by_project?project_id=${projectId}`);
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },

  // Sync workflow status from backend
  async syncWorkflowStatus(workflowId: string): Promise<{ updated: boolean }> {
    try {
      const response = await apiClient.get(`/api/workflow/sync_workflow?workflow_id=${workflowId}`);
      if (response.data && response.data.result) {
        return response.data.result;
      }
      return { updated: false };
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error('Failed to sync workflow status:', apiError);
      throw new Error(ApiErrorHandler.getErrorMessage(apiError));
    }
  },
}; 