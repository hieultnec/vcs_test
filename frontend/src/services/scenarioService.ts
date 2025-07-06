import apiClient from '@/config/api';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  version: string;
  priority: 'High' | 'Medium' | 'Low';
  test_cases?: TestCase[];
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expected_result: string;
  status: 'untested' | 'passed' | 'failed';
  version: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateScenarioData {
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface WorkflowOutput {
  structured_output: {
    project_id: string;
    scenarios: Array<{
      scenario_id: string;
      project_id: string;
      scenario_name: string;
      description: string;
      test_cases: Array<{
        test_case_id: string;
        project_id: string;
        scenario_id: string;
        test_case_name: string;
        requirement: string;
        test_objective: string;
        scenario: string;
        expected_result: string;
        created_at: string;
        updated_at: string;
      }>;
      created_at: string;
      updated_at: string;
    }>;
  };
  text: string;
}

export const scenarioService = {
  // Get all scenarios for a project
  async getScenarios(projectId: string): Promise<Scenario[]> {
    const response = await apiClient.get(`/api/scenario/list?project_id=${projectId}`);
    return response.data.result || response.data;
  },

  // Get specific scenario by ID
  async getScenario(projectId: string, scenarioId: string): Promise<Scenario> {
    const response = await apiClient.get(`/api/scenario/get?project_id=${projectId}&scenario_id=${scenarioId}`);
    return response.data.result || response.data;
  },

  // Create scenario
  async createScenario(projectId: string, data: CreateScenarioData): Promise<Scenario> {
    const response = await apiClient.post('/api/scenario/create', {
      project_id: projectId,
      scenario_data: {
        ...data,
        version: '1.0',
      },
    });
    return response.data.result || response.data;
  },

  // Update scenario
  async updateScenario(projectId: string, scenarioId: string, data: Partial<Scenario>): Promise<Scenario> {
    const response = await apiClient.put('/api/scenario/update', {
      project_id: projectId,
      scenario_id: scenarioId,
      scenario_data: data,
    });
    return response.data.result || response.data;
  },

  // Delete scenario
  async deleteScenario(projectId: string, scenarioId: string): Promise<void> {
    await apiClient.delete(`/api/scenario/delete?project_id=${projectId}&scenario_id=${scenarioId}`);
  },

  // Save all scenarios
  async saveScenarios(projectId: string, scenarios: Scenario[]): Promise<void> {
    await apiClient.post('/api/scenario/save', {
      project_id: projectId,
      scenarios,
    });
  },

  // Save scenarios from workflow output
  async saveScenariosFromWorkflow(projectId: string, workflowOutput: WorkflowOutput): Promise<void> {
    await apiClient.post('/api/scenario/save_from_workflow', {
      project_id: projectId,
      workflow_output: workflowOutput,
    });
  },
};
