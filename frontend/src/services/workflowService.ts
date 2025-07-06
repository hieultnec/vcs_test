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

  // Get workflow execution history for a project
  async getExecutionHistory(projectId: string): Promise<WorkflowExecution[]> {
    try {
      const response = await apiClient.get(`/api/workflow/executions?project_id=${projectId}`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.result || [];
    } catch (error) {
      const apiError = ApiErrorHandler.handleError(error);
      console.error(`Failed to fetch execution history for project ${projectId}:`, apiError);
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
  }
}; 