
import React, { useState } from 'react';
import { Plus, Edit3, History, RefreshCw, Eye, ChevronDown, ChevronRight, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ScenarioFormModal from './ScenarioFormModal';
import TestCaseFormModal from './TestCaseFormModal';

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

const mockScenarios: TestScenario[] = [
  {
    id: '1',
    name: 'User Registration Flow',
    description: 'Complete user registration process including email verification',
    lastUpdated: '2024-01-15',
    version: 'v1.2',
    priority: 'High',
    testCases: [
      {
        id: '1',
        title: 'Register with valid email',
        description: 'Test user registration with valid email format',
        expectedResult: 'User successfully registered and verification email sent',
        steps: [
          'Navigate to registration page',
          'Enter valid email address',
          'Enter strong password',
          'Confirm password',
          'Click Register button'
        ],
        status: 'passed',
        version: 'v1.2',
        lastUpdated: '2024-01-15',
        testRuns: [
          {
            id: '1',
            executedBy: 'tester@example.com',
            executedAt: '2024-01-15 10:30:00',
            status: 'pass',
            logs: 'Test executed successfully',
            version: 'v1.2'
          }
        ]
      },
      {
        id: '2',
        title: 'Register with invalid email',
        description: 'Test user registration with invalid email format',
        expectedResult: 'Error message displayed for invalid email format',
        steps: [
          'Navigate to registration page',
          'Enter invalid email format',
          'Enter password',
          'Click Register button'
        ],
        status: 'failed',
        version: 'v1.1',
        lastUpdated: '2024-01-14',
        testRuns: [
          {
            id: '2',
            executedBy: 'tester@example.com',
            executedAt: '2024-01-14 16:20:00',
            status: 'fail',
            logs: 'Expected error message not displayed',
            version: 'v1.1'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Payment Processing',
    description: 'Credit card and PayPal payment flows with error handling',
    lastUpdated: '2024-01-14',
    version: 'v1.1',
    priority: 'High',
    testCases: [
      {
        id: '3',
        title: 'Process credit card payment',
        description: 'Test successful credit card payment processing',
        expectedResult: 'Payment processed successfully and confirmation displayed',
        steps: [
          'Add items to cart',
          'Proceed to checkout',
          'Enter valid credit card details',
          'Click Pay Now button',
          'Verify payment confirmation'
        ],
        status: 'untested',
        version: 'v1.0',
        lastUpdated: '2024-01-13',
        testRuns: []
      }
    ]
  }
];

const TestScenariosTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<TestScenario[]>(mockScenarios);
  const [expandedScenarios, setExpandedScenarios] = useState<string[]>([]);
  const [expandedTestCases, setExpandedTestCases] = useState<string[]>([]);
  const [expandedTestRuns, setExpandedTestRuns] = useState<string[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<TestScenario | undefined>();
  const [selectedScenarioForTestCase, setSelectedScenarioForTestCase] = useState<string | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

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

  const handleCreateScenario = () => {
    setModalMode('create');
    setEditingScenario(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditScenario = (scenario: TestScenario) => {
    setModalMode('edit');
    setEditingScenario(scenario);
    setIsFormModalOpen(true);
  };

  const handleAddTestCase = (scenarioId: string) => {
    setSelectedScenarioForTestCase(scenarioId);
    setIsTestCaseModalOpen(true);
  };

  const handleRunScenario = (scenarioId: string, scenarioName: string) => {
    console.log(`Running scenario: ${scenarioName} (ID: ${scenarioId})`);
  };

  const handleRunTestCase = (testCaseId: string, testCaseName: string) => {
    console.log(`Running test case: ${testCaseName} (ID: ${testCaseId})`);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {scenarios.map((scenario) => (
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
                          <span className="text-xs text-gray-500">Updated: {scenario.lastUpdated}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{scenario.testCases.length} test cases</span>
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
                      <h6 className="font-medium text-gray-900 text-sm px-3">Test Cases ({scenario.testCases.length})</h6>
                      {scenario.testCases.map((testCase) => (
                        <Collapsible
                          key={testCase.id}
                          open={expandedTestCases.includes(testCase.id)}
                          onOpenChange={() => toggleTestCase(testCase.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors border border-blue-200">
                              <div className="flex items-center gap-3">
                                {expandedTestCases.includes(testCase.id) ? (
                                  <ChevronDown className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-blue-600" />
                                )}
                                <div className="text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-blue-900 text-sm">{testCase.title}</h5>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 h-6 w-6"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRunTestCase(testCase.id, testCase.title);
                                          }}
                                        >
                                          <Play className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">Run this test case</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <p className="text-xs text-blue-600 mb-2">{testCase.description}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getStatusColor(testCase.status)} text-xs px-2 py-0`} variant="outline">
                                      {testCase.status}
                                    </Badge>
                                    <span className="text-xs text-blue-400">•</span>
                                    <span className="text-xs text-blue-600">Version: {testCase.version}</span>
                                    <span className="text-xs text-blue-400">•</span>
                                    <span className="text-xs text-blue-600">{testCase.testRuns.length} runs</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="mt-2 ml-6 p-3 bg-white border border-blue-200 rounded-md">
                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2 text-sm">Steps:</h6>
                                  <ol className="space-y-1">
                                    {testCase.steps.map((step, index) => (
                                      <li key={index} className="flex items-start text-xs text-gray-700">
                                        <span className="mr-2 text-blue-600 font-medium">{index + 1}.</span>
                                        {step}
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2 text-sm">Expected Result:</h6>
                                  <p className="text-xs text-gray-700">{testCase.expectedResult}</p>
                                </div>
                                
                                {/* Test Runs */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h6 className="font-medium text-gray-900 text-sm">Test Runs ({testCase.testRuns.length})</h6>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleTestRuns(testCase.id)}
                                      className="px-2 py-1"
                                    >
                                      {expandedTestRuns.includes(testCase.id) ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                  {expandedTestRuns.includes(testCase.id) && (
                                    <div className="space-y-2">
                                      {testCase.testRuns.map((testRun) => (
                                        <div key={testRun.id} className="p-2 bg-gray-50 rounded border">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Badge className={`${getRunStatusColor(testRun.status)} text-xs px-2 py-0`} variant="outline">
                                                {testRun.status}
                                              </Badge>
                                              <span className="text-xs text-gray-600">{testRun.executedBy}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{testRun.executedAt}</span>
                                          </div>
                                          <p className="text-xs text-gray-600">{testRun.logs}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 pt-2 border-t border-gray-100 flex-wrap">
                                  <Button variant="outline" size="sm" className="px-3 py-1">
                                    <Edit3 className="w-4 h-4 mr-1" />
                                    Edit Test Case
                                  </Button>
                                  <Button variant="outline" size="sm" className="px-3 py-1">
                                    <History className="w-4 h-4 mr-1" />
                                    History
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      <ScenarioFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        scenario={editingScenario}
        mode={modalMode}
      />

      <TestCaseFormModal
        isOpen={isTestCaseModalOpen}
        onClose={() => setIsTestCaseModalOpen(false)}
        mode="create"
        prefilledScenarioId={selectedScenarioForTestCase}
      />
    </TooltipProvider>
  );
};

export default TestScenariosTab;
