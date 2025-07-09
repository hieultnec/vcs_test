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
import { Search, Play, Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExecutionTab from "./ExecutionTab";
import TestScenariosTab from "./TestScenariosTab";
import DocumentManager from "@/components/DocumentManager";
import {
  Dialog as Modal,
  DialogContent as ModalContent,
} from "@/components/ui/dialog";
import WorkflowRun from "./WorkflowRun";

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

// Define a type for the workflow creation form
interface CreateWorkflowForm {
  api_key: string;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { workflows, loading, error } = useAppSelector(
    (state) => state.workflows
  );
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Workflow> | null>(null);
  const [crudLoading, setCrudLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
    null
  );
  const [tab, setTab] = useState("run");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  const [refreshingDocuments, setRefreshingDocuments] = useState(false);

  // react-hook-form for workflow run
  const methods = useForm<Record<string, string>>();
  // react-hook-form for create/edit
  const createMethods = useForm<CreateWorkflowForm>({
    defaultValues: { api_key: "" },
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
      .getWorkflowDocuments(activeWorkflowId)
      .then((docs) => setDocuments(docs || []))
      .catch(() => setDocuments([]));
  }, [projectId, dispatch, activeWorkflowId]);

  // Update edit form when workflow changes
  useEffect(() => {
    if (workflow && showEditModal) {
      editMethods.reset({ ...workflow });
    }
    // eslint-disable-next-line
  }, [workflow, showEditModal]);

  // Add useEffect to fetch and set the selected workflow when activeWorkflowId changes
  useEffect(() => {
    if (activeWorkflowId) {
      const selected = workflows.find(
        (wf) => wf.workflow_id === activeWorkflowId
      );
      setWorkflow(selected ? JSON.parse(JSON.stringify(selected)) : null);
    }
  }, [activeWorkflowId, workflows]);

  // CREATE WORKFLOW
  const handleCreateWorkflow = async (data: CreateWorkflowForm) => {
    setCrudLoading(true);
    try {
      await dispatch(
        createWorkflowThunk({ project_id: projectId, api_key: data.api_key })
      ).unwrap();
      setShowCreateModal(false);
      toast({
        title: "Workflow created",
        description: "The workflow was created successfully.",
      });
    } catch (e: unknown) {
      toast({
        title: "Create workflow failed",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setCrudLoading(false);
    }
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

  const handleRefreshDocuments = async () => {
    if (!activeWorkflowId) return;
    setRefreshingDocuments(true);
    try {
      const docs = await documentService.getWorkflowDocuments(activeWorkflowId);
      setDocuments(docs || []);
      toast({
        title: "Documents refreshed",
        description: "The document list has been updated.",
      });
    } catch (e) {
      setDocuments([]);
      toast({
        title: "Failed to refresh documents",
        description: String(e),
        variant: "destructive",
      });
    } finally {
      setRefreshingDocuments(false);
    }
  };

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
        <>
          {/* Horizontal list of workflow cards */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.workflow_id}
                className={`min-w-[260px] group relative border-gray-200 hover:border-blue-200 transition-all duration-200 cursor-pointer ${
                  activeWorkflowId === workflow.workflow_id
                    ? "ring-2 ring-blue-400"
                    : ""
                }`}
                onClick={() => setActiveWorkflowId(workflow.workflow_id)}
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
                    Created: {workflow?.created_at ? new Date(workflow.created_at).toLocaleString() : "-"}
                  </div>
                  <div className="text-xs text-gray-400">
                    Updated: {workflow?.updated_at ? new Date(workflow.updated_at).toLocaleString() : "-"}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          {/* Nested tabs for selected workflow */}
          {activeWorkflowId && (
            <Tabs value={tab} onValueChange={setTab} className="mt-6">
              <TabsList className="flex h-fit w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground mb-4 overflow-x-auto">
                <TabsTrigger
                  value="run"
                  className="w-1/4 text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow hover:bg-gray-200"
                >
                  Run
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="w-1/4 text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow hover:bg-gray-200"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger
                  value="executions"
                  className="w-1/4 text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow hover:bg-gray-200"
                >
                  Executions
                </TabsTrigger>
                <TabsTrigger
                  value="scenarios"
                  className="w-1/4 text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow hover:bg-gray-200"
                >
                  Scenarios
                </TabsTrigger>
              </TabsList>
              <TabsContent value="run">
                <WorkflowRun
                  workflow={workflow}
                  documents={documents}
                  submitting={submitting}
                  result={result}
                  methods={methods}
                  showDocumentManager={showDocumentManager}
                  setShowDocumentManager={setShowDocumentManager}
                  activeWorkflowId={activeWorkflowId}
                  setResult={setResult}
                  projectId={projectId}
                  refreshDocuments={handleRefreshDocuments}
                  refreshingDocuments={refreshingDocuments}
                />
              </TabsContent>
              <TabsContent value="documents">
                <div className="flex justify-end mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshDocuments}
                    disabled={!activeWorkflowId || refreshingDocuments}
                    className="flex items-center gap-2"
                    title="Refresh Documents"
                  >
                    {refreshingDocuments ? (
                      <span className="animate-spin"><RefreshCw className="w-4 h-4" /></span>
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                <DocumentManager workflowId={activeWorkflowId} />
              </TabsContent>
              <TabsContent value="executions">
                <ExecutionTab workflowId={activeWorkflowId} />
              </TabsContent>
              <TabsContent value="scenarios">
                <TestScenariosTab projectId={projectId} />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* CREATE MODAL */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setWorkflowToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>
              Enter the Dify API Key to create a new workflow for this project.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...createMethods}>
            <form onSubmit={createMethods.handleSubmit(handleCreateWorkflow)}>
              <div className="mb-4">
                <label
                  htmlFor="api_key"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dify API Key
                </label>
                <input
                  id="api_key"
                  type="text"
                  {...createMethods.register("api_key", { required: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500"
                  placeholder="Enter Dify API Key"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn btn-primary">
                  Create Workflow
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
      {/* EDIT MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Workflow API Key</DialogTitle>
            <DialogDescription className="text-sm">
              Update the Dify API Key for this workflow.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...editMethods}>
            <form
              onSubmit={editMethods.handleSubmit(handleEditWorkflow)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-wf-api-key" className="text-sm">
                  Dify API Key
                </Label>
                <Input
                  id="edit-wf-api-key"
                  placeholder="e.g., app-xxxxxxxxxxxxxxxx"
                  className="text-sm"
                  {...editMethods.register("api_key", { required: true })}
                />
              </div>
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
