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
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
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
    setExpandedScenario(prev => (prev === scenarioId ? null : scenarioId));
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Test Scenarios & Cases</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" onClick={handleCreateScenario} className="px-2 py-0.5 h-7">
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={loadScenarios} className="px-2 py-0.5 h-7">
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {scenarios.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-xs">
                <p>No scenarios found. Create your first test scenario to get started.</p>
              </div>
            ) : (
              scenarios.map((scenario) => (
                <Collapsible
                  key={scenario.id}
                  open={expandedScenario === scenario.id}
                  onOpenChange={() => toggleScenario(scenario.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 border border-gray-200">
                      <div className="flex items-center gap-2">
                        {expandedScenario === scenario.id ? (
                          <ChevronDown className="w-3 h-3 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        )}
                        <span className="font-medium text-gray-900 text-sm">{scenario.name}</span>
                        <Badge className={`${getPriorityColor(scenario.priority)} text-xs px-1 py-0`} variant="outline">
                          {scenario.priority}
                        </Badge>
                        <span className="text-[11px] text-gray-400">{scenario.test_cases?.length || 0} cases</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={(e) => { e.stopPropagation(); handleRunScenario(scenario.id, scenario.name); }}>
                              <Play className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Run scenario</p>
                          </TooltipContent>
                        </Tooltip>
                        <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditScenario(scenario); }}>
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-1 h-6 w-6" onClick={(e) => { e.stopPropagation(); handleAddTestCase(scenario.id); }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="p-1 h-6 w-6 text-red-600 hover:text-red-700" onClick={e => e.stopPropagation()}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Delete Scenario</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs">
                                Are you sure you want to delete "{scenario.name}"? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="px-2 py-1 text-xs">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteScenario(scenario.id)} className="bg-red-600 hover:bg-red-700 px-2 py-1 text-xs">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-1 space-y-1">
                      {scenario.test_cases && scenario.test_cases.length > 0 ? (
                        scenario.test_cases.map((testCase) => (
                          <div key={testCase.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded border border-blue-200">
                            <span className="text-sm text-blue-900">{testCase.title}</span>
                            <Badge className={`${getStatusColor(testCase.status)} text-xs px-1 py-0`} variant="outline">
                              {testCase.status}
                            </Badge>
                            <span className="text-[11px] text-blue-600">v{testCase.version}</span>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 py-1">No test cases yet.</div>
                      )}
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
