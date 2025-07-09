import React, { useState } from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog as Modal,
  DialogContent as ModalContent,
} from "@/components/ui/dialog";
import DocumentManager from "@/components/DocumentManager";
import { workflowService } from "@/services/workflowService";
import { RefreshCw } from "lucide-react";

interface WorkflowInputField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string;
  options?: string[];
  description?: string;
}

interface Workflow {
  workflow_id: string;
  name: string;
  inputs: WorkflowInputField[];
  description?: string;
  dify_workflow_run_id?: string;
  created_at?: string;
  updated_at?: string;
  api_key?: string;
  info?: Record<string, unknown>;
}

interface ProjectDocument {
  filename: string;
  dify_document_id?: string;
  document_id?: string;
}

type MethodsType = UseFormReturn<Record<string, string>>;

type WorkflowRunProps = {
  workflow: Workflow | null;
  documents: ProjectDocument[];
  submitting: boolean;
  result: Record<string, unknown> | null;
  methods: MethodsType;
  showDocumentManager: boolean;
  setShowDocumentManager: (open: boolean) => void;
  activeWorkflowId: string | null;
  setResult: (result: Record<string, unknown> | null) => void;
  projectId: string;
  refreshDocuments: () => void;
  refreshingDocuments: boolean;
};

const WorkflowRun: React.FC<WorkflowRunProps> = ({
  workflow,
  documents,
  submitting,
  result,
  methods,
  showDocumentManager,
  setShowDocumentManager,
  activeWorkflowId,
  setResult,
  projectId,
  refreshDocuments,
  refreshingDocuments,
}) => {
  const [scenariosSaved, setScenariosSaved] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Submit handler based on old version
  const handleSubmit = async (data: Record<string, string>) => {
    if (!workflow) return;
    setLocalSubmitting(true);
    setResult(null);
    setScenariosSaved(false);
    const inputs: Record<string, unknown> = {};
    workflow.inputs.forEach((input) => {
      const value = data[input.name];
      if (value == null || value === "") {
        // Skip this input if value is null or empty
        return;
      }
      if (input.type === "document" || input.type === "file") {
        inputs[input.name] = {
          transfer_method: "local_file",
          upload_file_id: value,
          type: "document",
        };
      } else {
        inputs[input.name] = value;
      }
    });
    try {
      const res = await workflowService.runDifyWorkflow({
        project_id: projectId,
        workflow_id: workflow.workflow_id,
        inputs,
      });
      setResult(res.dify_response as Record<string, unknown>);
      setScenariosSaved(res.scenarios_saved);
      // Optionally refresh executions if needed (not handled here)
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-8">
      {/* Left: Input Form */}
      <div className="flex-1 bg-white p-4 rounded shadow relative">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSubmit(methods.getValues())}
          disabled={localSubmitting}
          aria-label="Refresh result"
        >
          {localSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-1"></span>
              Refreshing...
            </span>
          ) : (
            "Refresh"
          )}
        </Button>
        {workflow && (
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              {/* Sticky header */}
              <div className="sticky top-0 z-10 bg-white pb-2 mb-4 border-b border-gray-100">
                <div className="text-lg font-semibold">{workflow.name}</div>
                <div className="text-gray-500 text-sm">
                  {workflow.description}
                </div>
              </div>
              {workflow.inputs && workflow.inputs.length > 0 ? (
                workflow.inputs.map((input) => {
                  const error = methods.formState.errors[input.name]?.message;
                  if (input.type === "document" || input.type === "file") {
                    return (
                      <div key={input.name} className="mb-4">
                        <Label className="block font-medium mb-1 flex items-center">
                          {input.label}
                          {input.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Select
                            value={methods.watch(input.name) || ""}
                            onValueChange={(val) =>
                              methods.setValue(input.name, val)
                            }
                            required={input.required}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select document" />
                            </SelectTrigger>
                            <SelectContent>
                              {documents
                                .filter(
                                  (doc) =>
                                    doc.dify_document_id || doc.document_id
                                )
                                .map((doc) => (
                                  <SelectItem
                                    key={
                                      doc.dify_document_id || doc.document_id
                                    }
                                    value={
                                      doc.dify_document_id || doc.document_id
                                    }
                                  >
                                    {doc.filename}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={refreshDocuments}
                            disabled={refreshingDocuments}
                            aria-label="Refresh documents"
                          >
                            {refreshingDocuments ? (
                              <span className="animate-spin">
                                <RefreshCw className="w-4 h-4" />
                              </span>
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDocumentManager(true)}
                            aria-label="Manage documents"
                          >
                            <span className="sr-only">Manage documents</span>
                            <svg
                              width="18"
                              height="18"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M4 4h16v16H4z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path d="M8 8h8v8H8z" fill="currentColor" />
                            </svg>
                          </Button>
                        </div>
                        {input.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {input.description}
                          </div>
                        )}
                        {error && (
                          <div className="text-xs text-red-500 mt-1">
                            {error}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (input.type === "textarea" || input.type === "paragraph") {
                    return (
                      <div key={input.name} className="mb-4">
                        <Label className="block font-medium mb-1 flex items-center">
                          {input.label}
                          {input.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Textarea
                          value={methods.watch(input.name) || ""}
                          onChange={(e) =>
                            methods.setValue(input.name, e.target.value)
                          }
                          required={input.required}
                          placeholder={input.default || ""}
                          className="w-full min-h-[80px]"
                          aria-label={input.label}
                        />
                        {input.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {input.description}
                          </div>
                        )}
                        {error && (
                          <div className="text-xs text-red-500 mt-1">
                            {error}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (input.type === "select") {
                    return (
                      <div key={input.name} className="mb-4">
                        <Label className="block font-medium mb-1 flex items-center">
                          {input.label}
                          {input.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Select
                          value={
                            methods.watch(input.name) || input.default || ""
                          }
                          onValueChange={(val) =>
                            methods.setValue(input.name, val)
                          }
                          required={input.required}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={input.default || "Select option"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {input.options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {input.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {input.description}
                          </div>
                        )}
                        {error && (
                          <div className="text-xs text-red-500 mt-1">
                            {error}
                          </div>
                        )}
                      </div>
                    );
                  }
                  // Default to text input
                  return (
                    <div key={input.name} className="mb-4">
                      <Label className="block font-medium mb-1 flex items-center">
                        {input.label}
                        {input.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        type="text"
                        value={methods.watch(input.name) || ""}
                        onChange={(e) =>
                          methods.setValue(input.name, e.target.value)
                        }
                        required={input.required}
                        placeholder={input.default || ""}
                        aria-label={input.label}
                      />
                      {input.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {input.description}
                        </div>
                      )}
                      {error && (
                        <div className="text-xs text-red-500 mt-1">{error}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500">
                  No input fields defined for this workflow.
                </div>
              )}
              <Button
                type="submit"
                disabled={localSubmitting}
                className="w-full mt-4"
                aria-busy={localSubmitting}
                aria-label="Run Workflow"
              >
                {localSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Running...
                  </span>
                ) : (
                  "Run Workflow"
                )}
              </Button>
            </form>
          </FormProvider>
        )}

        {/* DocumentManager Modal */}
        <Modal open={showDocumentManager} onOpenChange={setShowDocumentManager}>
          <ModalContent>
            <DocumentManager workflowId={activeWorkflowId} />
          </ModalContent>
        </Modal>
      </div>
      {/* Right: Output/Result */}
      <div className="flex-1 bg-gray-50 p-4 rounded shadow flex flex-col min-h-0">
        <h4 className="font-semibold mb-2">Workflow Result</h4>
        {scenariosSaved && (
          <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-green-700">
            ✅ Test scenarios have been automatically saved from the workflow
            output!
          </div>
        )}
        <div className="flex gap-2 mb-2">
          {result && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                }
                aria-label="Copy result"
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `workflow-result-${
                    workflow?.workflow_id || "output"
                  }.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                aria-label="Download result"
              >
                Download
              </Button>
            </>
          )}
        </div>
        {result ? (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto flex-1 min-h-0 max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <div className="text-gray-400 flex-1 flex items-center justify-center">
            No result yet. Run the workflow to see output.
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowRun;
