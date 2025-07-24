import React, { useEffect, useState } from 'react';
import { workflowService } from '@/services/workflowService';
import { toast } from '@/hooks/use-toast';

interface ExecutionTabProps {
  workflowId: string;
}

export function formatDateByLocale(dateString: string | number | Date | undefined, locale?: string) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString(locale || navigator.language);
  } catch {
    return '-';
  }
}

const ExecutionTab: React.FC<ExecutionTabProps> = ({ workflowId }) => {
  const [executions, setExecutions] = useState<Record<string, unknown>[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Record<string, unknown> | null>(null);
  const [showText, setShowText] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (workflowId) {
      workflowService
        .getExecutionHistory(workflowId)
        .then((execRes) => setExecutions((execRes as unknown as Record<string, unknown>[]) || []))
        .catch(() => setExecutions([]));
    } else {
      setExecutions([]);
    }
  }, [workflowId]);

  const handleSyncWorkflow = async () => {
    if (!workflowId) return;
    setSyncing(true);
    try {
      const res = await workflowService.syncWorkflowStatus(workflowId);
      if (res.updated) {
        toast({ title: 'Workflow status updated from Dify', description: 'The workflow status has been synchronized.' });
      } else {
        toast({ title: 'No changes', description: 'Workflow status is already up to date.' });
      }
      // Reload executions after sync
      const execRes = await workflowService.getExecutionHistory(workflowId);
      setExecutions((execRes as unknown as Record<string, unknown>[]) || []);
    } catch (e) {
      toast({ title: 'Sync failed', description: String(e), variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (exec: Record<string, unknown>) => {
    setSelectedExecution(exec);
    setShowText(false);
  };

  const handleCloseModal = () => {
    setSelectedExecution(null);
    setShowText(false);
  };

  const renderCellValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null || value === undefined) return '-';
    // For objects/arrays, show JSON string (shortened)
    if (typeof value === 'object') return <span title={JSON.stringify(value)}>[object]</span>;
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
          onClick={handleSyncWorkflow}
          disabled={syncing || !workflowId}
        >
          {syncing ? 'Syncing...' : 'Sync Workflow Status'}
        </button>
      </div>
      <h2 className="text-xl font-bold mb-2">Workflow Executions</h2>
      {executions.length === 0 && <div>No executions found for this workflow.</div>}
      {executions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Workflow ID</th>
                <th className="px-3 py-2 border">Started</th>
                <th className="px-3 py-2 border">Error</th>
                <th className="px-3 py-2 border">Token</th>
                <th className="px-3 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={String(exec.execution_id || exec['id'])}>
                  <td className="px-3 py-2 border font-medium">{renderCellValue(exec.status)}</td>
                  <td className="px-3 py-2 border">{renderCellValue(exec['workflow_id'])}</td>
                  <td className="px-3 py-2 border">{
                    formatDateByLocale(
                      (exec.started_at as string | number | Date | undefined) ||
                      (exec['created_at'] as string | number | Date | undefined)
                    )
                  }</td>
                  <td className="px-3 py-2 border text-red-600">{renderCellValue(exec.error_message || exec['error'])}</td>
                  <td className="px-3 py-2 border">{renderCellValue(exec.total_tokens || exec['total_tokens'])}</td>
                  <td className="px-3 py-2 border">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleViewDetails(exec)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for execution details */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4">Execution Details</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(selectedExecution).map(([key, value]) => {
                if (key === 'outputs' && value && typeof value === 'object') {
                  // Show structured_output, hide text unless toggled
                  const outputs = value as Record<string, unknown>;
                  return (
                    <div key={key}>
                      <div className="font-semibold">outputs:</div>
                      {'structured_output' in outputs && outputs.structured_output && (
                        <pre className="bg-gray-100 rounded p-2 mb-2 whitespace-pre-wrap text-xs overflow-x-auto">
                          {JSON.stringify(outputs.structured_output, null, 2)}
                        </pre>
                      )}
                      {'text' in outputs && outputs.text && (
                        <>
                          <button
                            className="text-blue-600 hover:underline text-xs mb-1"
                            onClick={() => setShowText((prev) => !prev)}
                          >
                            {showText ? 'Hide Raw Text Output' : 'Show Raw Text Output'}
                          </button>
                          {showText && (
                            <pre className="bg-gray-50 rounded p-2 whitespace-pre-wrap text-xs overflow-x-auto border mt-1">
                              {outputs.text as string}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
                if (typeof value === 'object' && value !== null) {
                  return (
                    <div key={key}>
                      <span className="font-semibold">{key}:</span>
                      <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  );
                }
                return (
                  <div key={key}>
                    <span className="font-semibold">{key}:</span> {String(value)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTab; 