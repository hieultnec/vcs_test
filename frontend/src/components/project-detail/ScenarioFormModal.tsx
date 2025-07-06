import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { CreateScenarioData } from '@/services/scenarioService';

interface ScenarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario?: CreateScenarioData & { id: string; version: string };
  mode: 'create' | 'edit';
  projectId: string;
  onSubmit: (data: CreateScenarioData) => Promise<void>;
}

const ScenarioFormModal: React.FC<ScenarioFormModalProps> = ({ 
  isOpen, 
  onClose, 
  scenario, 
  mode,
  projectId,
  onSubmit
}) => {
  const [selectedPriority, setSelectedPriority] = React.useState<'High' | 'Medium' | 'Low'>(scenario?.priority || 'Medium');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateScenarioData>({
    defaultValues: scenario || { name: '', description: '', priority: 'Medium' }
  });

  React.useEffect(() => {
    if (scenario && mode === 'edit') {
      setValue('name', scenario.name);
      setValue('description', scenario.description);
      setValue('priority', scenario.priority);
      setSelectedPriority(scenario.priority);
    }
  }, [scenario, mode, setValue]);

  const handleFormSubmit = async (data: CreateScenarioData) => {
    try {
      setIsSubmitting(true);
      const formData = {
        ...data,
        priority: selectedPriority,
      };
      await onSubmit(formData);
      reset();
      setSelectedPriority('Medium');
    } catch (error) {
      console.error('Failed to submit scenario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedPriority('Medium');
    onClose();
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value as 'High' | 'Medium' | 'Low');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {mode === 'create' ? 'Create New Test Scenario' : 'Edit Test Scenario'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {mode === 'create' 
              ? 'Define a new test scenario with name, description, and priority.'
              : 'Update the test scenario details.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Scenario Name</Label>
            <Input
              id="name"
              placeholder="e.g., User Registration Flow"
              className="text-sm"
              {...register('name', { required: 'Scenario name is required' })}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the test scenario in detail..."
              rows={4}
              className="text-sm resize-none"
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm">Priority</Label>
            <Select value={selectedPriority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="px-4 py-2" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="px-4 py-2" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Scenario' : 'Update Scenario')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioFormModal;
