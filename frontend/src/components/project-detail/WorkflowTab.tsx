import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { documentService } from "@/services/documentService";
import { ProjectDocument as ProjectDocumentType } from "@/services/projectService";
import { workflowService } from "@/services/workflowService";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow as createWorkflowThunk,
  updateWorkflow as updateWorkflowThunk,
  deleteWorkflow as deleteWorkflowThunk,
  setSelectedWorkflowId,
} from "@/store/slices/workflowSlice";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Search, Play, Pencil, Trash2, Plus } from "lucide-react";
import WorkflowDetail from "./WorkflowDetail";
import DynamicInputsEditor from "./DynamicInputsEditor";

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

// Only one Execution interface, all fields optional
interface Execution {
  execution_id?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error_message?: string;
}

type ProjectDocument = ProjectDocumentType;

interface WorkflowTabProps {
  projectId: string;
}

// Local type for card rendering to ensure created_at/updated_at are present
type WorkflowCard = Workflow & { created_at?: string; updated_at?: string };

const WorkflowTab: React.FC<WorkflowTabProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const {
    workflows,
    selectedWorkflowId,
    selectedWorkflow: workflow,
    loading,
    error,
  } = useAppSelector((state) => state.workflows);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Workflow> | null>(null);
  const [crudLoading, setCrudLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailWorkflow, setDetailWorkflow] = useState<Workflow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
    null
  );

  // react-hook-form for workflow run
  const methods = useForm<Record<string, string>>();
  // react-hook-form for create/edit
  const createMethods = useForm<Partial<Workflow>>({
    defaultValues: {
      name: "",
      description: "",
      inputs: [],
      dify_workflow_run_id: "",
    },
  });
  const editMethods = useForm<Partial<Workflow>>({
    defaultValues: editForm || {
      name: "",
      description: "",
      inputs: [],
      dify_workflow_run_id: "",
    },
  });

  // Fetch workflows and documents on mount
  useEffect(() => {
    dispatch(fetchWorkflows(projectId));
    documentService
      .getProjectDocuments(projectId)
      .then((docs) => setDocuments(docs || []))
      .catch(() => setDocuments([]));
    if (workflow && workflow.workflow_id) {
      workflowService
        .getExecutionHistory(workflow.workflow_id)
        .then((execRes) => setExecutions(execRes || []))
        .catch(() => setExecutions([]));
    } else {
      setExecutions([]);
    }
  }, [projectId, dispatch, workflow?.workflow_id]);

  // Update edit form when workflow changes
  useEffect(() => {
    if (workflow && showEditModal) {
      editMethods.reset({ ...workflow });
    }
    // eslint-disable-next-line
  }, [workflow, showEditModal]);

  // Workflow run submit
  const handleSubmit = async (data: Record<string, string>) => {
    if (!workflow) return;
    setSubmitting(true);
    setResult(null);
    // Prepare inputs for backend
    const inputs: Record<string, unknown> = {};
    workflow.inputs.forEach((input) => {
      if (input.type === "document") {
        inputs[input.name] = [
          {
            transfer_method: "local_file",
            upload_file_id: data[input.name],
            type: "document",
          },
        ];
      } else {
        inputs[input.name] = data[input.name];
      }
    });
    try {
      const res = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: workflow.workflow_id, inputs }),
      });
      const resData = await res.json();
      setResult(resData);
      toast({
        title: "Workflow executed",
        description: "Workflow run completed.",
      });
      // Refresh executions after run
      workflowService
        .getExecutionHistory(workflow.workflow_id)
        .then((execRes) => setExecutions(execRes || []));
    } catch (e) {
      toast({
        title: "Workflow execution failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // CREATE WORKFLOW
  const handleCreateWorkflow = async (data: Partial<Workflow>) => {
    setCrudLoading(true);
    try {
      await dispatch(
        createWorkflowThunk({
          project_id: projectId,
          name: data.name!,
          description: data.description,
          dify_workflow_run_id: data.dify_workflow_run_id || "",
          inputs: data.inputs || [],
        })
      ).unwrap();
      setShowCreateModal(false);
      createMethods.reset();
      toast({
        title: "Workflow created",
        description: "Workflow created successfully.",
      });
    } catch (e) {
      toast({
        title: "Create failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // EDIT WORKFLOW
  const openEditModal = (wf?: Workflow) => {
    if (!wf) return;
    setEditForm({ ...wf });
    setShowEditModal(true);
  };
  const handleEditWorkflow = async (data: Partial<Workflow>) => {
    if (!editForm || !editForm.workflow_id) return;
    setCrudLoading(true);
    try {
      await dispatch(
        updateWorkflowThunk({
          workflow_id: editForm.workflow_id,
          update_data: {
            name: data.name,
            description: data.description,
            inputs: data.inputs,
            dify_workflow_run_id: data.dify_workflow_run_id,
          },
        })
      ).unwrap();
      setShowEditModal(false);
      setEditForm(null);
      toast({
        title: "Workflow updated",
        description: "Workflow updated successfully.",
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // DELETE WORKFLOW
  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;
    setCrudLoading(true);
    try {
      await dispatch(
        deleteWorkflowThunk(workflowToDelete.workflow_id)
      ).unwrap();
      setShowDeleteConfirm(false);
      setWorkflowToDelete(null);
      toast({
        title: "Workflow deleted",
        description: "Workflow deleted successfully.",
      });
      if (activeWorkflowId === workflowToDelete.workflow_id)
        setActiveWorkflowId(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // Search/filter workflows
  const filteredWorkflows = workflows.filter(
    (wf) =>
      wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wf.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Card grid UI
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search workflows by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-3 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
          />
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex gap-2 items-center"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflows...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>No workflows found.</p>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4">
            Create your first workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((wf) => {
            const workflow = wf as WorkflowCard;
            return (
              <Card
                key={workflow.workflow_id}
                className={`group relative border-gray-200 hover:border-blue-200 transition-all duration-200 cursor-pointer ${
                  activeWorkflowId === workflow.workflow_id
                    ? "ring-2 ring-blue-400"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {workflow.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 line-clamp-2">
                        {workflow.description || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWorkflowId(workflow.workflow_id);
                        }}
                        title="Run"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailWorkflow(workflow);
                          setShowDetail(true);
                        }}
                        title="Details"
                      >
                        <span className="sr-only">Details</span>
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="16" r="1" fill="currentColor" />
                          <rect
                            x="11"
                            y="8"
                            width="2"
                            height="5"
                            rx="1"
                            fill="currentColor"
                          />
                        </svg>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkflowToDelete(workflow);
                          setShowDeleteConfirm(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Dify Run ID: {workflow.dify_workflow_run_id}
                  </div>
                  <div className="text-xs text-gray-400">
                    Created:{" "}
                    {workflow.created_at
                      ? new Date(workflow.created_at).toLocaleString()
                      : "-"}
                  </div>
                  <div className="text-xs text-gray-400">
                    Updated:{" "}
                    {workflow.updated_at
                      ? new Date(workflow.updated_at).toLocaleString()
                      : "-"}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
      {/* Workflow Run Form */}
      {activeWorkflowId && workflow && (
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(handleSubmit)}
            className="space-y-4 bg-white p-4 rounded shadow max-w-xl mt-8 mx-auto"
          >
            <div className="mb-2">
              <div className="text-lg font-semibold">{workflow.name}</div>
              <div className="text-gray-500 text-sm">
                {workflow.description}
              </div>
            </div>
            {workflow.inputs && workflow.inputs.length > 0 ? (
              workflow.inputs.map((input) => {
                if (input.type === "document") {
                  return (
                    <div key={input.name}>
                      <Label className="block font-medium mb-1">
                        {input.label}
                      </Label>
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
                              (doc) => doc.dify_document_id || doc.document_id
                            )
                            .map((doc) => (
                              <SelectItem
                                key={doc.dify_document_id || doc.document_id}
                                value={doc.dify_document_id || doc.document_id}
                              >
                                {doc.filename}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                if (input.type === "textarea") {
                  return (
                    <div key={input.name}>
                      <Label className="block font-medium mb-1">
                        {input.label}
                      </Label>
                      <Textarea
                        value={methods.watch(input.name) || ""}
                        onChange={(e) =>
                          methods.setValue(input.name, e.target.value)
                        }
                        required={input.required}
                        placeholder={input.default || ""}
                        className="w-full min-h-[80px]"
                      />
                    </div>
                  );
                }
                if (input.type === "select") {
                  return (
                    <div key={input.name}>
                      <Label className="block font-medium mb-1">
                        {input.label}
                      </Label>
                      <Select
                        value={methods.watch(input.name) || input.default || ""}
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
                    </div>
                  );
                }
                // Default to text input
                return (
                  <div key={input.name}>
                    <Label className="block font-medium mb-1">
                      {input.label}
                    </Label>
                    <Input
                      type="text"
                      value={methods.watch(input.name) || ""}
                      onChange={(e) =>
                        methods.setValue(input.name, e.target.value)
                      }
                      required={input.required}
                      placeholder={input.default || ""}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500">
                No input fields defined for this workflow.
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Running..." : "Run Workflow"}
            </Button>
          </form>
        </FormProvider>
      )}
      {result && (
        <div className="mt-6 bg-gray-50 p-4 rounded shadow max-w-xl mx-auto">
          <h4 className="font-semibold mb-2">Workflow Result</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      {/* Execution History */}
      {activeWorkflowId && !loading && executions.length > 0 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <h4 className="font-semibold mb-2">Execution History</h4>
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
              {executions.map((exec) => (
                <TableRow key={exec.execution_id}>
                  <TableCell className="font-medium">{exec.status}</TableCell>
                  <TableCell>
                    {exec.started_at
                      ? new Date(exec.started_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {exec.completed_at
                      ? new Date(exec.completed_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {exec.result ? (
                      <span className="text-green-700">
                        {JSON.stringify(exec.result)}
                      </span>
                    ) : exec.error_message ? (
                      <span className="text-red-600">{exec.error_message}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Workflow Detail Fullscreen Modal */}
      {showDetail && detailWorkflow && (
        <Dialog
          open={showDetail}
          onOpenChange={(open) => {
            setShowDetail(open);
            if (!open) setDetailWorkflow(null);
          }}
        >
          <DialogContent className="fixed p-0 m-0 bg-white z-50 flex flex-col">
            <WorkflowDetail
              workflow={detailWorkflow}
              projectId={projectId}
              onClose={() => {
                setShowDetail(false);
                setDetailWorkflow(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* CREATE MODAL */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setWorkflowToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Create Workflow</DialogTitle>
            <DialogDescription className="text-sm">
              Define a new workflow for this project. Name and Dify Workflow Run
              ID are required. Add dynamic input fields below.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...createMethods}>
            <form
              onSubmit={createMethods.handleSubmit(handleCreateWorkflow)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="wf-name" className="text-sm">
                  Workflow Name
                </Label>
                <Input
                  id="wf-name"
                  placeholder="e.g., Data Extraction Workflow"
                  className="text-sm"
                  {...createMethods.register("name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wf-desc" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="wf-desc"
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  className="text-sm resize-none"
                  {...createMethods.register("description")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wf-dify-id" className="text-sm">
                  Dify Workflow Run ID
                </Label>
                <Input
                  id="wf-dify-id"
                  placeholder="Required. e.g., 123e4567-e89b-12d3-a456-426614174000"
                  className="text-sm"
                  {...createMethods.register("dify_workflow_run_id", {
                    required: true,
                  })}
                />
              </div>
              {/* Dynamic Inputs Section */}
              <DynamicInputsEditor
                inputs={createMethods.watch("inputs") || []}
                setInputs={(inputs) => createMethods.setValue("inputs", inputs)}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2"
                  disabled={crudLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2"
                  disabled={crudLoading}
                >
                  {crudLoading ? "Creating..." : "Create Workflow"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      {/* EDIT MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Workflow</DialogTitle>
            <DialogDescription className="text-sm">
              Update the workflow details below. Name and Dify Workflow Run ID
              are required. Edit dynamic input fields below.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...editMethods}>
            <form
              onSubmit={editMethods.handleSubmit(handleEditWorkflow)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-wf-name" className="text-sm">
                  Workflow Name
                </Label>
                <Input
                  id="edit-wf-name"
                  placeholder="e.g., Data Extraction Workflow"
                  className="text-sm"
                  {...editMethods.register("name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wf-desc" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="edit-wf-desc"
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  className="text-sm resize-none"
                  {...editMethods.register("description")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wf-dify-id" className="text-sm">
                  Dify Workflow Run ID
                </Label>
                <Input
                  id="edit-wf-dify-id"
                  placeholder="Required. e.g., 123e4567-e89b-12d3-a456-426614174000"
                  className="text-sm"
                  {...editMethods.register("dify_workflow_run_id", {
                    required: true,
                  })}
                />
              </div>
              {/* Dynamic Inputs Section */}
              <DynamicInputsEditor
                inputs={editMethods.watch("inputs") || []}
                setInputs={(inputs) => editMethods.setValue("inputs", inputs)}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2"
                  disabled={crudLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2"
                  disabled={crudLoading}
                >
                  {crudLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRM */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setWorkflowToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              {workflowToDelete ? (
                <>
                  Are you sure you want to delete the workflow{" "}
                  <span className="font-semibold">{workflowToDelete.name}</span>
                  ?
                  <br />
                  This action cannot be undone.
                </>
              ) : (
                "No workflow selected."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleDeleteWorkflow}
              disabled={crudLoading}
              variant="destructive"
            >
              {crudLoading ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                setWorkflowToDelete(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowTab;
