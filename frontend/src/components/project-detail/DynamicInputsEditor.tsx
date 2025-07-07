import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

export interface WorkflowInputField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string;
  options?: string[];
}

interface DynamicInputsEditorProps {
  inputs: WorkflowInputField[];
  setInputs: (inputs: WorkflowInputField[]) => void;
}

const inputTypes = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'document', label: 'Document' },
];

const DynamicInputsEditor: React.FC<DynamicInputsEditorProps> = ({ inputs, setInputs }) => {
  const handleChange = (idx: number, field: Partial<WorkflowInputField>) => {
    const newInputs = [...inputs];
    newInputs[idx] = { ...newInputs[idx], ...field };
    setInputs(newInputs);
  };

  const handleRemove = (idx: number) => {
    const newInputs = [...inputs];
    newInputs.splice(idx, 1);
    setInputs(newInputs);
  };

  const handleAdd = () => {
    setInputs([
      ...inputs,
      { name: '', type: 'text', label: '', required: false, default: '' },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">Workflow Inputs</h4>
        <Button type="button" size="sm" onClick={handleAdd}>Add Input</Button>
      </div>
      {inputs.length === 0 && <div className="text-gray-400">No inputs defined.</div>}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {inputs.map((input, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2 relative bg-gray-50 shadow-sm">
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <Label>Name</Label>
                <Input
                  value={input.name}
                  onChange={e => handleChange(idx, { name: e.target.value })}
                  placeholder="input_name"
                  required
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <Label>Label</Label>
                <Input
                  value={input.label}
                  onChange={e => handleChange(idx, { label: e.target.value })}
                  placeholder="Input Label"
                  required
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <Label>Type</Label>
                <Select value={input.type} onValueChange={val => handleChange(idx, { type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inputTypes.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemove(idx)} title="Remove Input">
                  &times;
                </Button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <Label>Default</Label>
                <Input
                  value={input.default || ''}
                  onChange={e => handleChange(idx, { default: e.target.value })}
                  placeholder="Default value"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 mt-6 min-w-[120px]">
                <input
                  type="checkbox"
                  checked={!!input.required}
                  onChange={e => handleChange(idx, { required: e.target.checked })}
                  id={`required-${idx}`}
                />
                <Label htmlFor={`required-${idx}`}>Required</Label>
              </div>
            </div>
            {input.type === 'select' && (
              <div>
                <Label>Options (comma separated)</Label>
                <Textarea
                  value={input.options ? input.options.join(',') : ''}
                  onChange={e => handleChange(idx, { options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean) })}
                  placeholder="option1, option2, option3"
                  rows={2}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicInputsEditor; 