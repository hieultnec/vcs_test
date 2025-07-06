
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface TestDataFormData {
  testCaseId: string;
  testCaseName: string;
  inputValues: Record<string, any>;
  outputExpectation: string;
}

interface TestDataFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  testData?: TestDataFormData & { id: string };
  mode: 'create' | 'edit';
}

const TestDataFormModal: React.FC<TestDataFormModalProps> = ({ 
  isOpen, 
  onClose, 
  testData, 
  mode 
}) => {
  const [inputPairs, setInputPairs] = useState<Array<{key: string, value: string}>>(
    testData ? Object.entries(testData.inputValues).map(([key, value]) => ({key, value: String(value)})) : [{key: '', value: ''}]
  );

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TestDataFormData>({
    defaultValues: testData || { testCaseId: '', testCaseName: '', inputValues: {}, outputExpectation: '' }
  });

  const addInputPair = () => {
    setInputPairs([...inputPairs, {key: '', value: ''}]);
  };

  const updateInputPair = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...inputPairs];
    newPairs[index][field] = value;
    setInputPairs(newPairs);
  };

  const removeInputPair = (index: number) => {
    setInputPairs(inputPairs.filter((_, i) => i !== index));
  };

  const onSubmit = (data: TestDataFormData) => {
    const inputValues = inputPairs.reduce((acc, pair) => {
      if (pair.key.trim()) {
        acc[pair.key.trim()] = pair.value;
      }
      return acc;
    }, {} as Record<string, any>);

    const formData = {
      ...data,
      inputValues
    };
    console.log(`${mode} test data:`, formData);
    // Here you would handle the actual create/update
    reset();
    setInputPairs([{key: '', value: ''}]);
    onClose();
  };

  const handleClose = () => {
    reset();
    setInputPairs([{key: '', value: ''}]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Test Data' : 'Edit Test Data'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Define test data with input values and expected output.'
              : 'Update the test data values.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testCaseId">Test Case</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a test case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Register with valid email</SelectItem>
                <SelectItem value="2">Register with invalid email format</SelectItem>
                <SelectItem value="3">Process credit card payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testCaseName">Test Case Name</Label>
            <Input
              id="testCaseName"
              placeholder="e.g., Register with valid email"
              {...register('testCaseName', { required: 'Test case name is required' })}
            />
            {errors.testCaseName && (
              <p className="text-sm text-red-600">{errors.testCaseName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Input Values</Label>
            {inputPairs.map((pair, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Parameter name"
                  value={pair.key}
                  onChange={(e) => updateInputPair(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={pair.value}
                  onChange={(e) => updateInputPair(index, 'value', e.target.value)}
                />
                {inputPairs.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeInputPair(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addInputPair}>
              <Plus className="w-4 h-4 mr-2" />
              Add Input Pair
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputExpectation">Output Expectation</Label>
            <Textarea
              id="outputExpectation"
              placeholder="Describe the expected output..."
              rows={3}
              {...register('outputExpectation', { required: 'Output expectation is required' })}
            />
            {errors.outputExpectation && (
              <p className="text-sm text-red-600">{errors.outputExpectation.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create Test Data' : 'Update Test Data'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestDataFormModal;
