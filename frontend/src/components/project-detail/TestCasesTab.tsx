
import React, { useState } from 'react';
import { Plus, Edit3, History, Copy, Database, ChevronDown, ChevronRight, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TestCaseFormModal from './TestCaseFormModal';

interface TestCase {
  id: string;
  title: string;
  description: string;
  scenarioId: string;
  scenarioName: string;
  expectedResult: string;
  steps: string[];
  status: 'untested' | 'passed' | 'failed';
  tags: string[];
  version: string;
  lastUpdated: string;
}

interface TestCasesTabProps {
  onOpenPromptModal: () => void;
}

const mockTestCases: TestCase[] = [
  {
    id: '1',
    title: 'Register with valid email',
    description: 'Test user registration with valid email format',
    scenarioId: '1',
    scenarioName: 'User Registration Flow',
    expectedResult: 'User successfully registered and verification email sent',
    steps: [
      'Navigate to registration page',
      'Enter valid email address',
      'Enter strong password',
      'Confirm password',
      'Click Register button'
    ],
    status: 'passed',
    tags: ['Regression', 'Smoke'],
    version: 'v1.2',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    title: 'Register with invalid email format',
    description: 'Test validation for invalid email format during registration',
    scenarioId: '1',
    scenarioName: 'User Registration Flow',
    expectedResult: 'Error message displayed for invalid email format',
    steps: [
      'Navigate to registration page',
      'Enter invalid email format (e.g., invalid@)',
      'Enter password',
      'Click Register button'
    ],
    status: 'failed',
    tags: ['Negative', 'Validation'],
    version: 'v1.1',
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    title: 'Process credit card payment',
    description: 'Test successful credit card payment processing',
    scenarioId: '2',
    scenarioName: 'Payment Processing',
    expectedResult: 'Payment processed successfully and confirmation displayed',
    steps: [
      'Add items to cart',
      'Proceed to checkout',
      'Enter valid credit card details',
      'Click Pay Now button',
      'Verify payment confirmation'
    ],
    status: 'untested',
    tags: ['Critical', 'Integration'],
    version: 'v1.0',
    lastUpdated: '2024-01-13'
  }
];

const TestCasesTab: React.FC<TestCasesTabProps> = ({ onOpenPromptModal }) => {
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);
  const [expandedCases, setExpandedCases] = useState<string[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const toggleTestCase = (caseId: string) => {
    setExpandedCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleCreateTestCase = () => {
    setModalMode('create');
    setEditingTestCase(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setModalMode('edit');
    setEditingTestCase(testCase);
    setIsFormModalOpen(true);
  };

  const handleRunTestCase = (testCaseId: string, testCaseTitle: string) => {
    console.log(`Running test case: ${testCaseTitle} (ID: ${testCaseId})`);
    // Mock test case run - in real implementation, this would trigger test execution
  };

  const handleDuplicateTestCase = (testCase: TestCase) => {
    const duplicated = {
      ...testCase,
      id: Date.now().toString(),
      title: `${testCase.title} (Copy)`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setTestCases(prev => [...prev, duplicated]);
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== testCaseId));
  };

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      'Regression': 'bg-blue-50 text-blue-700 border-blue-200',
      'Smoke': 'bg-green-50 text-green-700 border-green-200',
      'Critical': 'bg-red-50 text-red-700 border-red-200',
      'Negative': 'bg-orange-50 text-orange-700 border-orange-200',
      'Validation': 'bg-purple-50 text-purple-700 border-purple-200',
      'Integration': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[tag] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: 'untested' | 'passed' | 'failed') => {
    const colors = {
      'untested': 'bg-gray-50 text-gray-700 border-gray-200',
      'passed': 'bg-green-50 text-green-700 border-green-200',
      'failed': 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status];
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Test Cases</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onOpenPromptModal} className="px-3 py-1">
                <Database className="w-4 h-4 mr-1" />
                Generate Test Data
              </Button>
              <Button size="sm" onClick={handleCreateTestCase} className="px-3 py-1">
                <Plus className="w-4 h-4 mr-1" />
                Add Test Case
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {testCases.map((testCase) => (
              <Collapsible
                key={testCase.id}
                open={expandedCases.includes(testCase.id)}
                onOpenChange={() => toggleTestCase(testCase.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3">
                      {expandedCases.includes(testCase.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{testCase.title}</h4>
                          <Badge className={`${getStatusColor(testCase.status)} text-xs px-2 py-0`} variant="outline">
                            {testCase.status}
                          </Badge>
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
                        <p className="text-xs text-gray-600 mb-2">Scenario: {testCase.scenarioName}</p>
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          {testCase.tags.map((tag) => (
                            <Badge key={tag} className={`${getTagColor(tag)} text-xs px-2 py-0`} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Version: {testCase.version}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">Updated: {testCase.lastUpdated}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-6 p-3 bg-white border border-gray-200 rounded-md">
                    <div className="space-y-3">
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2 text-sm">Description:</h6>
                        <p className="text-xs text-gray-700 mb-3">{testCase.description}</p>
                      </div>
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
                      <div className="flex gap-2 pt-2 border-t border-gray-100 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleEditTestCase(testCase)} className="px-3 py-1">
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDuplicateTestCase(testCase)} className="px-3 py-1">
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button variant="outline" size="sm" className="px-3 py-1">
                          <History className="w-4 h-4 mr-1" />
                          History
                        </Button>
                        <Button variant="outline" size="sm" className="px-3 py-1">
                          <Database className="w-4 h-4 mr-1" />
                          Generate Data
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
                              <AlertDialogTitle className="text-lg">Delete Test Case</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Are you sure you want to delete "{testCase.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="px-4 py-2">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTestCase(testCase.id)} className="bg-red-600 hover:bg-red-700 px-4 py-2">
                                Delete Test Case
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      <TestCaseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        testCase={editingTestCase}
        mode={modalMode}
      />
    </TooltipProvider>
  );
};

export default TestCasesTab;
