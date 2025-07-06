import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { workflowService } from '@/services/workflowService';

export interface WorkflowInputField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: string;
  options?: string[];
}

export interface Workflow {
  workflow_id: string;
  name: string;
  description: string;
  inputs: WorkflowInputField[];
  dify_workflow_run_id?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  selectedWorkflowId: string | null;
  selectedWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkflowState = {
  workflows: [],
  selectedWorkflowId: null,
  selectedWorkflow: null,
  loading: false,
  error: null,
};

// Async thunks for CRUD
export const fetchWorkflows = createAsyncThunk<Workflow[], string>(
  'workflow/fetchWorkflows',
  async (projectId, { rejectWithValue }) => {
    try {
      return await workflowService.listWorkflows(projectId);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Unknown error');
    }
  }
);

export const fetchWorkflow = createAsyncThunk<Workflow, string>(
  'workflow/fetchWorkflow',
  async (workflowId, { rejectWithValue }) => {
    try {
      return await workflowService.getWorkflow(workflowId);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Unknown error');
    }
  }
);

export const createWorkflow = createAsyncThunk<Workflow, { project_id: string; name: string; description?: string; dify_workflow_run_id: string; inputs?: WorkflowInputField[] }>(
  'workflow/createWorkflow',
  async (payload, { rejectWithValue }) => {
    try {
      return await workflowService.createWorkflow(payload);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Unknown error');
    }
  }
);

export const updateWorkflow = createAsyncThunk<Workflow, { workflow_id: string; update_data: Partial<Workflow> }>(
  'workflow/updateWorkflow',
  async (payload, { rejectWithValue }) => {
    try {
      return await workflowService.updateWorkflow(payload);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Unknown error');
    }
  }
);

export const deleteWorkflow = createAsyncThunk<string, string>(
  'workflow/deleteWorkflow',
  async (workflowId, { rejectWithValue }) => {
    try {
      return await workflowService.deleteWorkflow(workflowId);
    } catch (e: unknown) {
      return rejectWithValue(e instanceof Error ? e.message : 'Unknown error');
    }
  }
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setSelectedWorkflowId(state, action: PayloadAction<string | null>) {
      state.selectedWorkflowId = action.payload;
    },
    clearSelectedWorkflow(state) {
      state.selectedWorkflow = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
        if (action.payload.length > 0) {
          state.selectedWorkflowId = action.payload[0].workflow_id;
        } else {
          state.selectedWorkflowId = null;
        }
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedWorkflow = action.payload;
      })
      .addCase(fetchWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows.push(action.payload);
        state.selectedWorkflowId = action.payload.workflow_id;
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.workflows.findIndex(wf => wf.workflow_id === action.payload.workflow_id);
        if (idx !== -1) state.workflows[idx] = action.payload;
        state.selectedWorkflow = action.payload;
      })
      .addCase(updateWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = state.workflows.filter(wf => wf.workflow_id !== action.payload);
        if (state.selectedWorkflowId === action.payload) {
          state.selectedWorkflowId = state.workflows.length > 0 ? state.workflows[0].workflow_id : null;
          state.selectedWorkflow = null;
        }
      })
      .addCase(deleteWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedWorkflowId, clearSelectedWorkflow } = workflowSlice.actions;
export default workflowSlice.reducer; 