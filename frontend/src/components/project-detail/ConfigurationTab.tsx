import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Settings, FileText, Globe, Server, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { workflowService, WorkflowVariable } from '@/services/workflowService';

const ConfigurationTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [variables, setVariables] = useState<WorkflowVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    workflowService.getWorkflowConfig(projectId)
      .then(config => setVariables(config.variables || []))
      .catch(err => setError('Failed to load workflow configuration'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const addVariable = () => {
    const newVariable: WorkflowVariable = {
      id: Date.now().toString(),
      variable_name: '',
      key: '',
      value: '',
      type: 'custom',
      description: ''
    };
    setVariables([...variables, newVariable]);
  };

  const updateVariable = (id: string, field: keyof WorkflowVariable, value: string) => {
    setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const getVariableIcon = (type: WorkflowVariable['type']) => {
    switch (type) {
      case 'ssh_host':
      case 'ssh_port':
        return <Server className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getVariableColor = (type: WorkflowVariable['type']) => {
    switch (type) {
      case 'ssh_host':
      case 'ssh_port':
        return 'bg-blue-100 text-blue-800';
      case 'document':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const saveWorkflowConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      await workflowService.saveWorkflowConfig({ project_id: projectId, variables });
      toast({
        title: 'Workflow configuration saved',
        description: 'Your workflow variables have been saved successfully.',
      });
    } catch (err) {
      setError('Failed to save workflow configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading workflow configuration...</div>;

  return (
    <Card className="shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Workflow Configuration
        </CardTitle>
        <CardDescription>
          Configure variables (API keys, endpoints, etc.) for this project's workflow execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {variables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No workflow variables configured yet.</p>
            <p className="text-sm">Add variables to get started with your workflow.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variables.map((variable) => (
              <div key={variable.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getVariableIcon(variable.type)}
                    <Badge variant="secondary" className={getVariableColor(variable.type)}>
                      {variable.type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(variable.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Variable Name</Label>
                    <Input
                      value={variable.variable_name}
                      onChange={(e) => updateVariable(variable.id, 'variable_name', e.target.value)}
                      placeholder="e.g., ssh_host"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={variable.type}
                      onValueChange={(value) => updateVariable(variable.id, 'type', value as WorkflowVariable['type'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssh_host">SSH Host</SelectItem>
                        <SelectItem value="ssh_port">SSH Port</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input
                      value={variable.key}
                      onChange={(e) => updateVariable(variable.id, 'key', e.target.value)}
                      placeholder="e.g., ssh_host"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={variable.value}
                      onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                      placeholder="e.g., 192.168.1.9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={variable.description || ''}
                    onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                    placeholder="Describe what this variable is used for"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <Button type="button" variant="outline" onClick={addVariable} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Variable
          </Button>
          <Button type="button" onClick={saveWorkflowConfig} disabled={saving} className="w-full">
            {saving ? <Save className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationTab; 