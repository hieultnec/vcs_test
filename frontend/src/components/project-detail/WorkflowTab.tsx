import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { documentService } from '@/services/documentService';
import { ProjectDocument as ProjectDocumentType } from '@/services/projectService';
import { workflowService } from '@/services/workflowService';
import { Dialog, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow as createWorkflowThunk,
  updateWorkflow as updateWorkflowThunk,
  deleteWorkflow as deleteWorkflowThunk,
  setSelectedWorkflowId
} from '@/store/slices/workflowSlice';

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
}

interface Execution {
  id: string;
  status: string;
  created_at: string;
  finished_at?: string;
  outputs?: Record<string, unknown>;
  error?: string;
}

type ProjectDocument = ProjectDocumentType;

interface WorkflowTabProps {
  projectId: string;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const {
    workflows,
    selectedWorkflowId,
    selectedWorkflow: workflow,
    loading,
    error
  } = useAppSelector(state => state.workflows);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Workflow> | null>(null);
  const [createForm, setCreateForm] = useState<Partial<Workflow>>({ name: '', description: '', inputs: [], dify_workflow_run_id: '' });
  const [crudLoading, setCrudLoading] = useState(false);

  // Fetch workflows and documents on mount
  useEffect(() => {
    dispatch(fetchWorkflows(projectId));
    documentService.getProjectDocuments(projectId)
      .then(docs => setDocuments(docs || []))
      .catch(() => setDocuments([]));
  }, [projectId, dispatch]);

  // Fetch workflow details and executions when selectedWorkflowId changes
  useEffect(() => {
    if (!selectedWorkflowId) return;
    dispatch(fetchWorkflow(selectedWorkflowId));
    fetch(`/api/workflow/execution/history?workflow_id=${selectedWorkflowId}`)
      .then(res => res.json())
      .then(execRes => setExecutions(execRes.data || []))
      .catch(() => setExecutions([]));
  }, [selectedWorkflowId, dispatch]);

  const handleChange = (name: string, value: string) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    setSubmitting(true);
    setResult(null);
    // Prepare inputs for backend
    const inputs: Record<string, unknown> = {};
    workflow.inputs.forEach((input) => {
      if (input.type === 'document') {
        inputs[input.name] = [{
          transfer_method: 'local_file',
          upload_file_id: form[input.name],
          type: 'document'
        }];
      } else {
        inputs[input.name] = form[input.name];
      }
    });
    try {
      const res = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflow.workflow_id, inputs }),
      });
      const data = await res.json();
      setResult(data);
      // Refresh executions after run
      fetch(`/api/workflow/execution/history?workflow_id=${workflow.workflow_id}`)
        .then(res => res.json())
        .then(execRes => setExecutions(execRes.data || []));
    } catch (e) {
      // error is handled by Redux
    } finally {
      setSubmitting(false);
    }
  };

  // CREATE WORKFLOW
  const handleCreateWorkflow = async () => {
    setCrudLoading(true);
    try {
      await dispatch(createWorkflowThunk({
        project_id: projectId,
        name: createForm.name!,
        description: createForm.description,
        dify_workflow_run_id: createForm.dify_workflow_run_id || '',
        inputs: createForm.inputs || [],
      })).unwrap();
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', inputs: [], dify_workflow_run_id: '' });
    } catch (e) {
      // error is handled by Redux
    } finally {
      setCrudLoading(false);
    }
  };

  // EDIT WORKFLOW
  const openEditModal = () => {
    if (!workflow) return;
    setEditForm({ ...workflow });
    setShowEditModal(true);
  };
  const handleEditWorkflow = async () => {
    if (!editForm || !editForm.workflow_id) return;
    setCrudLoading(true);
    try {
      await dispatch(updateWorkflowThunk({
        workflow_id: editForm.workflow_id,
        update_data: {
          name: editForm.name,
          description: editForm.description,
          inputs: editForm.inputs,
          dify_workflow_run_id: editForm.dify_workflow_run_id,
        },
      })).unwrap();
      setShowEditModal(false);
      setEditForm(null);
    } catch (e) {
      // error is handled by Redux
    } finally {
      setCrudLoading(false);
    }
  };

  // DELETE WORKFLOW
  const handleDeleteWorkflow = async () => {
    if (!workflow) return;
    setCrudLoading(true);
    try {
      await dispatch(deleteWorkflowThunk(workflow.workflow_id)).unwrap();
      setShowDeleteConfirm(false);
    } catch (e) {
      // error is handled by Redux
    } finally {
      setCrudLoading(false);
    }
  };

  // Workflow selection
  const handleSelectWorkflow = (id: string) => {
    dispatch(setSelectedWorkflowId(id));
  };

  return (
    <div className="space-y-6">
      {loading && <div>Loading workflow data...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && workflows.length > 1 && (
        <div>
          <label className="block font-medium mb-1">Select Workflow</label>
          <select
            value={selectedWorkflowId || ''}
            onChange={e => handleSelectWorkflow(e.target.value)}
            className="border rounded px-2 py-1 w-full max-w-md"
          >
            {workflows.map(wf => (
              <option key={wf.workflow_id} value={wf.workflow_id}>{wf.name}</option>
            ))}
          </select>
        </div>
      )}
      {!loading && workflow && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-xl">
          <div className="mb-2">
            <div className="text-lg font-semibold">{workflow.name}</div>
            <div className="text-gray-500 text-sm">{workflow.description}</div>
          </div>
          {workflow.inputs && workflow.inputs.length > 0 ? workflow.inputs.map((input) => {
            if (input.type === 'document') {
              return (
                <div key={input.name}>
                  <label className="block font-medium mb-1">{input.label}</label>
                  <select
                    value={form[input.name] || ''}
                    onChange={e => handleChange(input.name, e.target.value)}
                    required={input.required}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Select document</option>
                    {documents.map(doc => (
                      <option key={doc.dify_document_id || doc.document_id} value={doc.dify_document_id || ''}>
                        {doc.filename}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            if (input.type === 'textarea') {
              return (
                <div key={input.name}>
                  <label className="block font-medium mb-1">{input.label}</label>
                  <textarea
                    value={form[input.name] || ''}
                    onChange={e => handleChange(input.name, e.target.value)}
                    required={input.required}
                    placeholder={input.default || ''}
                    className="border rounded px-2 py-1 w-full min-h-[80px]"
                  />
                </div>
              );
            }
            if (input.type === 'select') {
              return (
                <div key={input.name}>
                  <label className="block font-medium mb-1">{input.label}</label>
                  <select
                    value={form[input.name] || input.default || ''}
                    onChange={e => handleChange(input.name, e.target.value)}
                    required={input.required}
                    className="border rounded px-2 py-1 w-full"
                  >
                    {input.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }
            // Default to text input
            return (
              <div key={input.name}>
                <label className="block font-medium mb-1">{input.label}</label>
                <input
                  type="text"
                  value={form[input.name] || ''}
                  onChange={e => handleChange(input.name, e.target.value)}
                  required={input.required}
                  placeholder={input.default || ''}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
            );
          }) : <div className="text-gray-500">No input fields defined for this workflow.</div>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Running...' : 'Run Workflow'}
          </Button>
        </form>
      )}
      {result && (
        <div className="mt-6 bg-gray-50 p-4 rounded shadow max-w-xl">
          <h4 className="font-semibold mb-2">Workflow Result</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {!loading && executions.length > 0 && (
        <div className="mt-8 max-w-2xl">
          <h4 className="font-semibold mb-2">Execution History</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Started</th>
                  <th className="px-2 py-1 text-left">Finished</th>
                  <th className="px-2 py-1 text-left">Result/Error</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(exec => (
                  <tr key={exec.id} className="border-t">
                    <td className="px-2 py-1 font-medium">{exec.status}</td>
                    <td className="px-2 py-1">{exec.created_at ? new Date(exec.created_at).toLocaleString() : '-'}</td>
                    <td className="px-2 py-1">{exec.finished_at ? new Date(exec.finished_at).toLocaleString() : '-'}</td>
                    <td className="px-2 py-1 max-w-xs truncate">
                      {exec.outputs ? <span className="text-green-700">{JSON.stringify(exec.outputs)}</span> : exec.error ? <span className="text-red-600">{exec.error}</span> : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <Button onClick={() => setShowCreateModal(true)} size="sm">Create Workflow</Button>
        {workflow && (
          <>
            <Button onClick={openEditModal} size="sm" variant="outline">Edit</Button>
            <Button onClick={() => setShowDeleteConfirm(true)} size="sm" variant="destructive">Delete</Button>
          </>
        )}
      </div>
      {/* CREATE MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Create Workflow</DialogTitle>
            <DialogDescription className="text-sm">
              Define a new workflow for this project. Name and Dify Workflow Run ID are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleCreateWorkflow(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name" className="text-sm">Workflow Name</Label>
              <Input
                id="wf-name"
                placeholder="e.g., Data Extraction Workflow"
                className="text-sm"
                value={createForm.name || ''}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-desc" className="text-sm">Description</Label>
              <Textarea
                id="wf-desc"
                placeholder="Describe what this workflow does..."
                rows={3}
                className="text-sm resize-none"
                value={createForm.description || ''}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-dify-id" className="text-sm">Dify Workflow Run ID</Label>
              <Input
                id="wf-dify-id"
                placeholder="Required. e.g., 123e4567-e89b-12d3-a456-426614174000"
                className="text-sm"
                value={createForm.dify_workflow_run_id || ''}
                onChange={e => setCreateForm(f => ({ ...f, dify_workflow_run_id: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="px-4 py-2" disabled={crudLoading}>
                Cancel
              </Button>
              <Button type="submit" className="px-4 py-2" disabled={crudLoading}>
                {crudLoading ? 'Creating...' : 'Create Workflow'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* EDIT MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Workflow</DialogTitle>
            <DialogDescription className="text-sm">
              Update the workflow details below. Name and Dify Workflow Run ID are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); handleEditWorkflow(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-wf-name" className="text-sm">Workflow Name</Label>
              <Input
                id="edit-wf-name"
                placeholder="e.g., Data Extraction Workflow"
                className="text-sm"
                value={editForm?.name || ''}
                onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wf-desc" className="text-sm">Description</Label>
              <Textarea
                id="edit-wf-desc"
                placeholder="Describe what this workflow does..."
                rows={3}
                className="text-sm resize-none"
                value={editForm?.description || ''}
                onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wf-dify-id" className="text-sm">Dify Workflow Run ID</Label>
              <Input
                id="edit-wf-dify-id"
                placeholder="Required. e.g., 123e4567-e89b-12d3-a456-426614174000"
                className="text-sm"
                value={editForm?.dify_workflow_run_id || ''}
                onChange={e => setEditForm(f => f ? { ...f, dify_workflow_run_id: e.target.value } : f)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="px-4 py-2" disabled={crudLoading}>
                Cancel
              </Button>
              <Button type="submit" className="px-4 py-2" disabled={crudLoading}>
                {crudLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRM */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogTitle>Delete Workflow</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this workflow?
        </DialogContent>
        <DialogFooter>
          <Button onClick={handleDeleteWorkflow} disabled={crudLoading} variant="destructive">{crudLoading ? 'Deleting...' : 'Delete'}</Button>
          <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">Cancel</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default WorkflowTab;