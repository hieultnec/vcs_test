import React, { useState, useEffect } from 'react';
import { Plus, Edit3, History, RefreshCw, Eye, ChevronDown, ChevronRight, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ScenarioFormModal from './ScenarioFormModal';
import TestCaseFormModal from './TestCaseFormModal';
import { scenarioService, Scenario, CreateScenarioData } from '@/services/scenarioService';
import { testCaseService, CreateTestCaseData } from '@/services/testCaseService';
import { useToast } from '@/hooks/use-toast';

interface TestRun {
  id: string;
  executedBy: string;
  executedAt: string;
  status: 'pass' | 'fail' | 'skipped';
  logs: string;
  version: string;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  status: 'untested' | 'passed' | 'failed';
  version: string;
  lastUpdated: string;
  testRuns: TestRun[];
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  version: string;
  priority: 'High' | 'Medium' | 'Low';
  testCases: TestCase[];
}

interface TestScenariosTabProps {
  projectId: string;
}

const TestScenariosTab: React.FC<TestScenariosTabProps> = ({ projectId }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScenarios, setExpandedScenarios] = useState<string[]>([]);
  const [expandedTestCases, setExpandedTestCases] = useState<string[]>([]);
  const [expandedTestRuns, setExpandedTestRuns] = useState<string[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | undefined>();
  const [selectedScenarioForTestCase, setSelectedScenarioForTestCase] = useState<string | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();

  // Load scenarios on component mount
  useEffect(() => {
    loadScenarios();
  }, [projectId]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const fetchedScenarios = await scenarioService.getScenarios(projectId);
      setScenarios(fetchedScenarios);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      toast({
        title: "Error",
        description: "Failed to load scenarios. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScenario = () => {
    setModalMode('create');
    setEditingScenario(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditScenario = (scenario: Scenario) => {
    setModalMode('edit');
    setEditingScenario(scenario);
    setIsFormModalOpen(true);
  };

  const handleScenarioSubmit = async (data: CreateScenarioData) => {
    try {
      if (modalMode === 'create') {
        await scenarioService.createScenario(projectId, data);
        toast({
          title: "Success",
          description: "Scenario created successfully",
        });
      } else if (editingScenario) {
        await scenarioService.updateScenario(projectId, editingScenario.id, data);
        toast({
          title: "Success",
          description: "Scenario updated successfully",
        });
      }
      setIsFormModalOpen(false);
      loadScenarios(); // Refresh the list
    } catch (error) {
      console.error('Failed to save scenario:', error);
      toast({
        title: "Error",
        description: "Failed to save scenario. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      await scenarioService.deleteScenario(projectId, scenarioId);
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
      loadScenarios(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete scenario:', error);
      toast({
        title: "Error",
        description: "Failed to delete scenario. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTestCase = (scenarioId: string) => {
    setSelectedScenarioForTestCase(scenarioId);
    setIsTestCaseModalOpen(true);
  };

  const handleTestCaseSubmit = async (data: {
    title: string;
    description: string;
    scenarioId: string;
    expectedResult: string;
    steps: string[];
    scriptFileName: string;
    scriptContent: string;
    status: 'untested' | 'passed' | 'failed';
  }) => {
    try {
      // Handle freestyle scenario
      const scenarioId = data.scenarioId === 'freestyle' ? null : data.scenarioId;
      
      const testCaseData: CreateTestCaseData = {
        title: data.title,
        description: data.description,
        steps: data.steps,
        expected_result: data.expectedResult,
        scriptFileName: data.scriptFileName,
        scriptContent: data.scriptContent,
        status: data.status,
        version: '1.0'
      };

      if (scenarioId) {
        await testCaseService.createTestCase(projectId, scenarioId, testCaseData);
      } else {
        // For freestyle test cases, we might need a different approach
        // For now, we'll create it under a default scenario or handle it differently
        console.log('Freestyle test case:', testCaseData);
      }

      toast({
        title: "Success",
        description: "Test case created successfully",
      });
      setIsTestCaseModalOpen(false);
      loadScenarios(); // Refresh the list
    } catch (error) {
      console.error('Failed to save test case:', error);
      toast({
        title: "Error",
        description: "Failed to save test case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setExpandedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const toggleTestCase = (testCaseId: string) => {
    setExpandedTestCases(prev =>
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const toggleTestRuns = (testCaseId: string) => {
    setExpandedTestRuns(prev =>
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const handleRunScenario = (scenarioId: string, scenarioName: string) => {
    console.log(`Running scenario: ${scenarioName} (ID: ${scenarioId})`);
  };

  const handleRunTestCase = (testCaseId: string, testCaseName: string) => {
    console.log(`Running test case: ${testCaseName} (ID: ${testCaseId})`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'untested': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRunStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 text-green-700 border-green-200';
      case 'fail': return 'bg-red-50 text-red-700 border-red-200';
      case 'skipped': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading scenarios...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Test Scenarios & Cases</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateScenario} className="px-3 py-1">
                <Plus className="w-4 h-4 mr-1" />
                Add Scenario
              </Button>
              <Button size="sm" variant="outline" onClick={loadScenarios} className="px-3 py-1">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {scenarios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No scenarios found. Create your first test scenario to get started.</p>
              </div>
            ) : (
              scenarios.map((scenario) => (
                <Collapsible
                  key={scenario.id}
                  open={expandedScenarios.includes(scenario.id)}
                  onOpenChange={() => toggleScenario(scenario.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200">
                      <div className="flex items-center gap-3">
                        {expandedScenarios.includes(scenario.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{scenario.name}</h4>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRunScenario(scenario.id, scenario.name);
                                  }}
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Run this scenario</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Version: {scenario.version}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">Updated: {new Date(scenario.updated_at).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{scenario.test_cases?.length || 0} test cases</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(scenario.priority)} text-xs px-2 py-0`} variant="outline">
                          {scenario.priority}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 ml-6 space-y-2">
                      {/* Scenario Actions */}
                      <div className="p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 text-sm">Scenario Actions</h5>
                          <Button
                            size="sm"
                            onClick={() => handleAddTestCase(scenario.id)}
                            className="px-3 py-1"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Test Case
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleEditScenario(scenario)} className="px-3 py-1">
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit Scenario
                          </Button>
                          <Button variant="outline" size="sm" className="px-3 py-1">
                            <History className="w-4 h-4 mr-1" />
                            Version History
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 px-3 py-1">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg">Delete Test Scenario</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                  Are you sure you want to delete "{scenario.name}"? This action cannot be undone and will also delete all associated test cases.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="px-4 py-2">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteScenario(scenario.id)} className="bg-red-600 hover:bg-red-700 px-4 py-2">
                                  Delete Scenario
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Test Cases */}
                      <div className="space-y-2">
                        <h6 className="font-medium text-gray-900 text-sm px-3">Test Cases ({scenario.test_cases?.length || 0})</h6>
                        {scenario.test_cases && scenario.test_cases.length > 0 ? (
                          scenario.test_cases.map((testCase) => (
                            <div key={testCase.id} className="p-3 bg-blue-50 rounded-md border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-blue-900 text-sm">{testCase.title}</h5>
                                  <p className="text-xs text-blue-600 mt-1">{testCase.description}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className={`${getStatusColor(testCase.status)} text-xs px-2 py-0`} variant="outline">
                                      {testCase.status}
                                    </Badge>
                                    <span className="text-xs text-blue-600">Version: {testCase.version}</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                  <Play className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No test cases yet. Add your first test case to this scenario.
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ScenarioFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        scenario={editingScenario}
        mode={modalMode}
        projectId={projectId}
        onSubmit={handleScenarioSubmit}
      />

      <TestCaseFormModal
        isOpen={isTestCaseModalOpen}
        onClose={() => setIsTestCaseModalOpen(false)}
        mode="create"
        prefilledScenarioId={selectedScenarioForTestCase}
        projectId={projectId}
        scenarios={scenarios}
        onSubmit={handleTestCaseSubmit}
      />
    </TooltipProvider>
  );
};

export default TestScenariosTab;
