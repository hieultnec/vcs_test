
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface TestCaseFormData {
  title: string;
  description: string;
  scenarioId: string;
  expectedResult: string;
  steps: string[];
  status: 'untested' | 'passed' | 'failed';
}

interface TestCaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase?: TestCaseFormData & { id: string; version: string };
  mode: 'create' | 'edit';
  prefilledScenarioId?: string;
}

const TestCaseFormModal: React.FC<TestCaseFormModalProps> = ({ 
  isOpen, 
  onClose, 
  testCase, 
  mode,
  prefilledScenarioId 
}) => {
  const [steps, setSteps] = useState<string[]>(testCase?.steps || ['']);
  const [selectedScenario, setSelectedScenario] = useState(prefilledScenarioId || testCase?.scenarioId || '');
  const [selectedStatus, setSelectedStatus] = useState<'untested' | 'passed' | 'failed'>(testCase?.status || 'untested');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TestCaseFormData>({
    defaultValues: testCase || { title: '', description: '', scenarioId: prefilledScenarioId || '', expectedResult: '', steps: [''], status: 'untested' }
  });

  React.useEffect(() => {
    if (prefilledScenarioId) {
      setSelectedScenario(prefilledScenarioId);
      setValue('scenarioId', prefilledScenarioId);
    }
  }, [prefilledScenarioId, setValue]);

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

  const onSubmit = (data: TestCaseFormData) => {
    const formData = {
      ...data,
      scenarioId: selectedScenario,
      status: selectedStatus,
      steps: steps.filter(step => step.trim() !== ''),
      project_id: 'current-project-id', // This should come from context/props
      version: mode === 'edit' ? testCase?.version : 'v1.0'
    };
    console.log(`${mode} test case:`, formData);
    // Here you would call the API: POST /api/test_case/create or PUT /api/test_case/update
    reset();
    setSteps(['']);
    setSelectedScenario('');
    setSelectedStatus('untested');
    onClose();
  };

  const handleClose = () => {
    reset();
    setSteps(['']);
    setSelectedScenario('');
    setSelectedStatus('untested');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {mode === 'create' ? 'Create New Test Case' : 'Edit Test Case'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create' 
              ? 'Define a new test case with steps, expected results, and status.'
              : 'Update the test case details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">User Registration Flow</SelectItem>
                <SelectItem value="2">Payment Processing</SelectItem>
                <SelectItem value="3">Product Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Test Steps</Label>
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
            <Button type="button" variant="outline" onClick={handleClose} className="px-4 py-2">
              Cancel
            </Button>
            <Button type="submit" className="px-4 py-2">
              {mode === 'create' ? 'Create Test Case' : 'Update Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestCaseFormModal;
