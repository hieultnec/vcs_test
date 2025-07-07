import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowService } from '@/services/workflowService';

interface ExecutionState {
  executions: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
}

const initialState: ExecutionState = {
  executions: [],
  loading: false,
  error: null,
};

export const fetchExecutionsByProject = createAsyncThunk<Record<string, unknown>[], string, { rejectValue: string }>(
  'executions/fetchByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      return await workflowService.getExecutionsByProject(projectId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Failed to fetch executions');
    }
  }
);

const executionSlice = createSlice({
  name: 'executions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExecutionsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExecutionsByProject.fulfilled, (state, action) => {
        state.executions = action.payload;
        state.loading = false;
      })
      .addCase(fetchExecutionsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch executions';
      });
  },
});

export default executionSlice.reducer; 