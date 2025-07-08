import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { FormProvider, useForm } from 'react-hook-form';
import { documentService } from '@/services/documentService';
import { workflowService } from '@/services/workflowService';

interface WorkflowInputField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string;
  options?: string[];
}

interface Workflow {
  workflow_id: string;
  name: string;
  description: string;
  inputs: WorkflowInputField[];
  dify_workflow_run_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Execution {
  execution_id?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error_message?: string;
}

interface ProjectDocument {
  document_id: string;
  filename: string;
  dify_document_id?: string;
}

interface WorkflowDetailProps {
  workflow: Workflow;
  projectId: string;
  onClose?: () => void;
}

const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ workflow, projectId, onClose }) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [scenariosSaved, setScenariosSaved] = useState(false);
  const methods = useForm<Record<string, string>>();

  useEffect(() => {
    documentService.getProjectDocuments(projectId)
      .then(docs => setDocuments(docs || []))
      .catch(() => setDocuments([]));
    if (workflow && workflow.workflow_id) {
      workflowService.getExecutionHistory(workflow.workflow_id)
        .then(execRes => setExecutions(execRes || []))
        .catch(() => setExecutions([]));
    } else {
      setExecutions([]);
    }
  }, [projectId, workflow?.workflow_id]);

  const handleSubmit = async (data: Record<string, string>) => {
    setSubmitting(true);
    setResult(null);
    setScenariosSaved(false);
    const inputs: Record<string, unknown> = {};
    workflow.inputs.forEach((input) => {
      const value = data[input.name];
      if (value == null || value === '') {
        // Skip this input if value is null or empty
        return;
      }
      if (input.type === 'document') {
        inputs[input.name] = {
          transfer_method: 'local_file',
          upload_file_id: value,
          type: 'document'
        };
      } else {
        inputs[input.name] = value;
      }
    });
    try {
      const res = await workflowService.runDifyWorkflow({
        project_id: projectId,
        workflow_id: workflow.workflow_id,
        inputs
      });
      setResult(res.dify_response as Record<string, unknown>);
      setScenariosSaved(res.scenarios_saved);
      workflowService.getExecutionHistory(workflow.workflow_id)
        .then(execRes => setExecutions(execRes || []));
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded shadow space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">{workflow.name}</h2>
          <div className="text-gray-500 text-sm mb-2">{workflow.description}</div>
          <div className="text-xs text-gray-400">Workflow ID: {workflow.workflow_id}</div>
          <div className="text-xs text-gray-400">Dify Run ID: {workflow.dify_workflow_run_id}</div>
          <div className="text-xs text-gray-400">Created: {workflow.created_at ? new Date(workflow.created_at).toLocaleString() : '-'}</div>
          <div className="text-xs text-gray-400">Updated: {workflow.updated_at ? new Date(workflow.updated_at).toLocaleString() : '-'}</div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </div>
      <div>
        <h3 className="font-semibold mb-2">Run Workflow</h3>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            {workflow.inputs && workflow.inputs.length > 0 ? workflow.inputs.map((input) => {
              if (input.type === 'document') {
                return (
                  <div key={input.name}>
                    <Label className="block font-medium mb-1">{input.label}</Label>
                    <Select
                      value={methods.watch(input.name) || ''}
                      onValueChange={val => methods.setValue(input.name, val)}
                      required={input.required}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents
                          .filter(doc => (doc.dify_document_id))
                          .map(doc => (
                            <SelectItem key={doc.dify_document_id} value={doc.dify_document_id}>
                              {doc.filename}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (input.type === 'textarea') {
                return (
                  <div key={input.name}>
                    <Label className="block font-medium mb-1">{input.label}</Label>
                    <Textarea
                      value={methods.watch(input.name) || ''}
                      onChange={e => methods.setValue(input.name, e.target.value)}
                      required={input.required}
                      placeholder={input.default || ''}
                      className="w-full min-h-[80px]"
                    />
                  </div>
                );
              }
              // Default to text input
              return (
                <div key={input.name}>
                  <Label className="block font-medium mb-1">{input.label}</Label>
                  <Input
                    type="text"
                    value={methods.watch(input.name) || ''}
                    onChange={e => methods.setValue(input.name, e.target.value)}
                    required={input.required}
                    placeholder={input.default || ''}
                  />
                </div>
              );
            }) : <div className="text-gray-500">No input fields defined for this workflow.</div>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Running...' : 'Run Workflow'}
            </Button>
          </form>
        </FormProvider>
        {result && (
          <div className="mt-4 bg-gray-50 p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Workflow Result</h4>
            {scenariosSaved && (
              <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-green-700">
                ✅ Test scenarios have been automatically saved from the workflow output!
              </div>
            )}
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold mb-2">Execution History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>Result/Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map(exec => (
              <TableRow key={exec.execution_id}>
                <TableCell className="font-medium">{exec.status}</TableCell>
                <TableCell>{exec.started_at ? new Date(exec.started_at).toLocaleString() : '-'}</TableCell>
                <TableCell>{exec.completed_at ? new Date(exec.completed_at).toLocaleString() : '-'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {exec.result ? <span className="text-green-700">{JSON.stringify(exec.result)}</span> : exec.error_message ? <span className="text-red-600">{exec.error_message}</span> : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WorkflowDetail; 