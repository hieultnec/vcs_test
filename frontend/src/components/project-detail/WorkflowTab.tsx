import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { documentService } from '@/services/documentService';
import { ProjectDocument as ProjectDocumentType } from '@/services/projectService';

interface WorkflowInputField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string;
  options?: string[];
}

interface WorkflowTemplate {
  inputs: WorkflowInputField[];
}

type ProjectDocument = ProjectDocumentType;

interface WorkflowTabProps {
  projectId: string;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({ projectId }) => {
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/workflow/template?project_id=${projectId}`).then(res => res.json()),
      documentService.getProjectDocuments(projectId)
    ]).then(([templateRes, docs]) => {
      setTemplate(templateRes.result?.template || templateRes.result || null);
      setDocuments(docs || []);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) return <div>Loading workflow template...</div>;
  if (!template || !template.inputs) return <div>No workflow template defined for this project.</div>;

  const handleChange = (name: string, value: string) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    // Prepare inputs for backend
    const inputs: Record<string, unknown> = {};
    template.inputs.forEach((input) => {
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
    const res = await fetch('/api/workflow/run_workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, inputs, user: 'hieult' }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {template.inputs.map((input) => {
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
                  {input.options?.map((opt) => (
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
        })}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Running...' : 'Run Workflow'}
        </Button>
      </form>
      {result && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Workflow Result</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WorkflowTab; 