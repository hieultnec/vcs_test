import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Scenario } from '@/services/scenarioService';

interface TestCaseFormData {
  title: string;
  description: string;
  scenarioId: string;
  expectedResult: string;
  steps: string[];
  scriptFileName: string;
  scriptContent: string;
  status: 'untested' | 'passed' | 'failed';
}

interface TestCaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase?: TestCaseFormData & { id: string; version: string };
  mode: 'create' | 'edit';
  prefilledScenarioId?: string;
  projectId: string;
  scenarios: Scenario[];
  onSubmit: (data: TestCaseFormData) => Promise<void>;
}

const TestCaseFormModal: React.FC<TestCaseFormModalProps> = ({ 
  isOpen, 
  onClose, 
  testCase, 
  mode,
  prefilledScenarioId,
  projectId,
  scenarios,
  onSubmit
}) => {
  const [steps, setSteps] = useState<string[]>(testCase?.steps || ['']);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'untested' | 'passed' | 'failed'>(testCase?.status || 'untested');
  const [scriptFileName, setScriptFileName] = useState(testCase?.scriptFileName || '');
  const [scriptContent, setScriptContent] = useState(testCase?.scriptContent || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('steps');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TestCaseFormData>({
    defaultValues: testCase || { 
      title: '', 
      description: '', 
      scenarioId: '', 
      expectedResult: '', 
      steps: [''], 
      scriptFileName: '',
      scriptContent: '',
      status: 'untested' 
    }
  });

  // Set default scenario when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefilledScenarioId) {
        setSelectedScenario(prefilledScenarioId);
        setValue('scenarioId', prefilledScenarioId);
      } else {
        // Default to "freestyle" if no scenario is pre-selected
        setSelectedScenario('freestyle');
        setValue('scenarioId', 'freestyle');
      }
    }
  }, [isOpen, prefilledScenarioId, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSteps(['']);
      setSelectedScenario('');
      setSelectedStatus('untested');
      setScriptFileName('');
      setScriptContent('');
      setActiveTab('steps');
    }
  }, [isOpen, reset]);

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: TestCaseFormData) => {
    try {
      setIsSubmitting(true);
      const formData = {
        ...data,
        scenarioId: selectedScenario,
        status: selectedStatus,
        steps: steps.filter(step => step.trim() !== ''),
        scriptFileName,
        scriptContent,
      };
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit test case:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {mode === 'create' ? 'Create New Test Case' : 'Edit Test Case'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create' 
              ? 'Define a new test case with steps or script, expected results, and status.'
              : 'Update the test case details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">Test Case Title</Label>
            <Input
              id="title"
              placeholder="e.g., Register with valid email"
              className="text-sm"
              {...register('title', { required: 'Test case title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this test case validates..."
              rows={3}
              className="text-sm resize-none"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scenarioId" className="text-sm">Test Scenario</Label>
            <Select value={selectedScenario} onValueChange={(value) => {
              setSelectedScenario(value);
              setValue('scenarioId', value);
            }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freestyle">Freestyle</SelectItem>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Test Implementation</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="steps">Test Steps</TabsTrigger>
                <TabsTrigger value="script">Test Script</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Define test steps manually</Label>
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Step ${index + 1}`}
                        value={step}
                        className="text-sm"
                        onChange={(e) => updateStep(index, e.target.value)}
                      />
                      {steps.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="px-2 py-1"
                          onClick={() => removeStep(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addStep} className="px-3 py-1">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="script" className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Define test using script</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scriptFileName" className="text-sm">Script File Name</Label>
                    <Input
                      id="scriptFileName"
                      placeholder="e.g., test_login.py, test_registration.js"
                      value={scriptFileName}
                      onChange={(e) => setScriptFileName(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scriptContent" className="text-sm">Script Content</Label>
                    <Textarea
                      id="scriptContent"
                      placeholder="Enter your test script here..."
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                      rows={8}
                      className="text-sm font-mono resize-none"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedResult" className="text-sm">Expected Result</Label>
            <Textarea
              id="expectedResult"
              placeholder="Describe the expected outcome..."
              rows={3}
              className="text-sm resize-none"
              {...register('expectedResult', { required: 'Expected result is required' })}
            />
            {errors.expectedResult && (
              <p className="text-xs text-red-600">{errors.expectedResult.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm">Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as 'untested' | 'passed' | 'failed')}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="untested">Untested</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="px-4 py-2" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="px-4 py-2" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Test Case' : 'Update Test Case')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestCaseFormModal;
