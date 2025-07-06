import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Play, Settings, FileText, Globe, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workflowService, WorkflowVariable } from '@/services/workflowService';

interface WorkflowTabProps {
  projectId: string;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({ projectId }) => {
  const [variables, setVariables] = useState<WorkflowVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved workflow configuration
  useEffect(() => {
    loadWorkflowConfig();
  }, [projectId]);

  const loadWorkflowConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = await workflowService.getWorkflowConfig(projectId);
      setVariables(config.variables || []);
    } catch (err) {
      console.error('Error loading workflow config:', err);
      // If no config exists, start with empty variables
      setVariables([]);
    } finally {
      setLoading(false);
    }
  };

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
    setVariables(variables.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const saveWorkflowConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate variables
      const invalidVariables = variables.filter(v => !v.variable_name || !v.key || !v.value);
      if (invalidVariables.length > 0) {
        setError('Please fill in all required fields for all variables');
        return;
      }

      await workflowService.saveWorkflowConfig({
        project_id: projectId,
        variables: variables
      });
      
      toast({
        title: "Workflow configuration saved",
        description: "Your workflow variables have been saved successfully.",
      });
    } catch (err) {
      setError('Failed to save workflow configuration');
      console.error('Error saving workflow config:', err);
    } finally {
      setSaving(false);
    }
  };

  const executeWorkflow = async () => {
    try {
      setExecuting(true);
      setError(null);

      // Validate variables
      const invalidVariables = variables.filter(v => !v.variable_name || !v.key || !v.value);
      if (invalidVariables.length > 0) {
        setError('Please fill in all required fields for all variables');
        return;
      }

      const execution = await workflowService.executeWorkflow(projectId, variables);
      
      toast({
        title: "Workflow executed successfully",
        description: `Execution ID: ${execution.execution_id}. Status: ${execution.status}`,
      });
    } catch (err) {
      setError('Failed to execute workflow');
      console.error('Error executing workflow:', err);
    } finally {
      setExecuting(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading workflow configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Workflow Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure variables and parameters for your test workflow execution
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={saveWorkflowConfig}
            disabled={saving}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
          <Button
            onClick={executeWorkflow}
            disabled={executing || variables.length === 0}
          >
            {executing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Execute Workflow
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Variables Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Workflow Variables
          </CardTitle>
          <CardDescription>
            Define the variables that will be used in your workflow execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {variables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No workflow variables configured yet.</p>
              <p className="text-sm">Add variables to get started with your workflow.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variables.map((variable) => (
                <div
                  key={variable.id}
                  className="border rounded-lg p-4 space-y-4"
                >
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
                      <Label htmlFor={`var-name-${variable.id}`}>Variable Name</Label>
                      <Input
                        id={`var-name-${variable.id}`}
                        value={variable.variable_name}
                        onChange={(e) => updateVariable(variable.id, 'variable_name', e.target.value)}
                        placeholder="e.g., ssh_host"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`var-type-${variable.id}`}>Type</Label>
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
                      <Label htmlFor={`var-key-${variable.id}`}>Key</Label>
                      <Input
                        id={`var-key-${variable.id}`}
                        value={variable.key}
                        onChange={(e) => updateVariable(variable.id, 'key', e.target.value)}
                        placeholder="e.g., ssh_host"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`var-value-${variable.id}`}>Value</Label>
                      <Input
                        id={`var-value-${variable.id}`}
                        value={variable.value}
                        onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                        placeholder="e.g., 192.168.1.9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`var-desc-${variable.id}`}>Description (Optional)</Label>
                    <Input
                      id={`var-desc-${variable.id}`}
                      value={variable.description || ''}
                      onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                      placeholder="Describe what this variable is used for"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={addVariable}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Variable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>
            Common variable configurations for different scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const sshTemplate: WorkflowVariable[] = [
                  {
                    id: Date.now().toString(),
                    variable_name: 'ssh_host',
                    key: 'ssh_host',
                    value: '192.168.1.9',
                    type: 'ssh_host',
                    description: 'SSH server hostname or IP address'
                  },
                  {
                    id: (Date.now() + 1).toString(),
                    variable_name: 'ssh_port',
                    key: 'ssh_port',
                    value: '22',
                    type: 'ssh_port',
                    description: 'SSH server port number'
                  }
                ];
                setVariables(sshTemplate);
              }}
              className="h-auto p-4 flex flex-col items-start"
            >
              <Server className="w-5 h-5 mb-2" />
              <span className="font-medium">SSH Connection</span>
              <span className="text-sm text-gray-500">Host and port configuration</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const documentTemplate: WorkflowVariable[] = [
                  {
                    id: Date.now().toString(),
                    variable_name: 'document',
                    key: 'document',
                    value: `http://localhost:5000/api/project/document/download?document_id=current`,
                    type: 'document',
                    description: 'Document URL for workflow processing'
                  }
                ];
                setVariables(documentTemplate);
              }}
              className="h-auto p-4 flex flex-col items-start"
            >
              <FileText className="w-5 h-5 mb-2" />
              <span className="font-medium">Document Processing</span>
              <span className="text-sm text-gray-500">Document URL configuration</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowTab; 