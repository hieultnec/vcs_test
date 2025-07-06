
import apiClient from '@/config/api';

export interface TestRun {
  run_id: string;
  project_id: string;
  scenario_id: string;
  test_case_id: string;
  executed_by: string;
  executed_at: string;
  status: 'pass' | 'fail' | 'skipped';
  logs: string;
  attachment_url?: string;
  version: string;
}

export interface CreateTestRunData {
  project_id: string;
  scenario_id: string;
  test_case_id: string;
  executed_by: string;
  status: 'pass' | 'fail' | 'skipped';
  logs: string;
  attachment_url?: string;
  version?: string;
}

export const testRunService = {
  // Record a new test run
  async recordTestRun(data: CreateTestRunData): Promise<TestRun> {
    const response = await apiClient.post('/api/test_run/record', {
      ...data,
      version: data.version || '1.0',
    });
    return response.data.result || response.data;
  },

  // Get test runs by test case ID
  async getTestRunsByCase(projectId: string, testCaseId: string): Promise<TestRun[]> {
    const response = await apiClient.get(`/api/test_run/list_by_case?project_id=${projectId}&test_case_id=${testCaseId}`);
    return response.data.result || response.data;
  },

  // Get test runs by scenario ID
  async getTestRunsByScenario(projectId: string, scenarioId: string): Promise<TestRun[]> {
    const response = await apiClient.get(`/api/test_run/list_by_scenario?project_id=${projectId}&scenario_id=${scenarioId}`);
    return response.data.result || response.data;
  },

  // Get test runs by project ID
  async getTestRunsByProject(projectId: string, limit?: number): Promise<TestRun[]> {
    const url = limit 
      ? `/api/test_run/list_by_project?project_id=${projectId}&limit=${limit}`
      : `/api/test_run/list_by_project?project_id=${projectId}`;
    const response = await apiClient.get(url);
    return response.data.result || response.data;
  },

  // Get latest test run for a test case
  async getLatestTestRun(projectId: string, testCaseId: string): Promise<TestRun | null> {
    try {
      const response = await apiClient.get(`/api/test_run/latest?project_id=${projectId}&test_case_id=${testCaseId}`);
      return response.data.result || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get specific test run
  async getTestRun(runId: string): Promise<TestRun> {
    const response = await apiClient.get(`/api/test_run/get?run_id=${runId}`);
    return response.data.result || response.data;
  },

  // Update test run
  async updateTestRun(runId: string, data: Partial<TestRun>): Promise<TestRun> {
    const response = await apiClient.put('/api/test_run/update', {
      run_id: runId,
      update_data: data,
    });
    return response.data.result || response.data;
  },

  // Delete test run
  async deleteTestRun(runId: string): Promise<void> {
    await apiClient.delete(`/api/test_run/delete?run_id=${runId}`);
  },
};
