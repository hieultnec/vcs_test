
import apiClient from '@/config/api';
import { TestCase } from './scenarioService';

export interface CreateTestCaseData {
  title: string;
  description: string;
  steps: string[];
  expected_result: string;
  scriptFileName?: string;
  scriptContent?: string;
  status: 'untested' | 'passed' | 'failed';
  version?: string;
}

export const testCaseService = {
  // Get all test cases for a scenario
  async getTestCases(projectId: string, scenarioId: string): Promise<TestCase[]> {
    const response = await apiClient.get(`/api/test_case/list?project_id=${projectId}&scenario_id=${scenarioId}`);
    return response.data.result || response.data;
  },

  // Get specific test case
  async getTestCase(projectId: string, scenarioId: string, testCaseId: string): Promise<TestCase> {
    const response = await apiClient.get(`/api/test_case/get?project_id=${projectId}&scenario_id=${scenarioId}&test_case_id=${testCaseId}`);
    return response.data.result || response.data;
  },

  // Create test case
  async createTestCase(projectId: string, scenarioId: string, data: CreateTestCaseData): Promise<TestCase> {
    const response = await apiClient.post('/api/test_case/create', {
      project_id: projectId,
      scenario_id: scenarioId,
      test_case_data: {
        ...data,
        version: data.version || '1.0',
      },
    });
    return response.data.result || response.data;
  },

  // Update test case
  async updateTestCase(projectId: string, scenarioId: string, testCaseId: string, data: Partial<TestCase>): Promise<TestCase> {
    const response = await apiClient.put('/api/test_case/update', {
      project_id: projectId,
      scenario_id: scenarioId,
      test_case_id: testCaseId,
      update_data: data,
    });
    return response.data.result || response.data;
  },

  // Delete test case
  async deleteTestCase(projectId: string, scenarioId: string, testCaseId: string): Promise<void> {
    await apiClient.delete(`/api/test_case/delete?project_id=${projectId}&scenario_id=${scenarioId}&test_case_id=${testCaseId}`);
  },

  // Save multiple test cases
  async saveTestCases(projectId: string, scenarioId: string, testCases: CreateTestCaseData[]): Promise<void> {
    await apiClient.post('/api/test_case/save', {
      project_id: projectId,
      scenario_id: scenarioId,
      test_cases: testCases,
    });
  },
};
