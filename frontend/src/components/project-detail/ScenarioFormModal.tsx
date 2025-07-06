
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';

interface ScenarioFormData {
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface ScenarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario?: ScenarioFormData & { id: string; version: string };
  mode: 'create' | 'edit';
}

const ScenarioFormModal: React.FC<ScenarioFormModalProps> = ({ 
  isOpen, 
  onClose, 
  scenario, 
  mode 
}) => {
  const [selectedPriority, setSelectedPriority] = React.useState<'High' | 'Medium' | 'Low'>(scenario?.priority || 'Medium');
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ScenarioFormData>({
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

  const onSubmit = (data: ScenarioFormData) => {
    const formData = {
      ...data,
      priority: selectedPriority,
      project_id: 'current-project-id', // This should come from context/props
      version: mode === 'edit' ? scenario?.version : 'v1.0'
    };
    console.log(`${mode} scenario:`, formData);
    // Here you would call the API: POST /api/scenario/create or PUT /api/scenario/update
    reset();
    setSelectedPriority('Medium');
    onClose();
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={handleClose} className="px-4 py-2">
              Cancel
            </Button>
            <Button type="submit" className="px-4 py-2">
              {mode === 'create' ? 'Create Scenario' : 'Update Scenario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioFormModal;
