import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { codexService, CodexTask, CodexRunRequest, RepoOption } from '@/services/codexService';

interface CodexState {
  repos: RepoOption[];
  tasks: CodexTask[];
  currentTask: CodexTask | null;
  loading: boolean;
  error: string | null;
  submittedTasks: CodexTask[];
}

const initialState: CodexState = {
  repos: [],
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  submittedTasks: [],
};

// Async thunks
export const fetchRepos = createAsyncThunk(
  'codex/fetchRepos',
  async () => {
    return await codexService.getRepos();
  }
);

export const runCodex = createAsyncThunk(
  'codex/runCodex',
  async (data: CodexRunRequest) => {
    return await codexService.runCodex(data);
  }
);

export const fetchTask = createAsyncThunk(
  'codex/fetchTask',
  async (taskId: string) => {
    return await codexService.getTask(taskId);
  }
);

export const fetchSubmittedTasks = createAsyncThunk(
  'codex/fetchSubmittedTasks',
  async (repoLabel: string) => {
    return await codexService.getSubmittedTasks(repoLabel);
  }
);

const codexSlice = createSlice({
  name: 'codex',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status, message } = action.payload;
      // Update current task if it matches
      if (state.currentTask?.task_id === taskId) {
        state.currentTask.status = status;
        if (message) state.currentTask.message = message;
      }
      // Update in tasks array
      const taskIndex = state.tasks.findIndex(task => task.task_id === taskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = status;
        if (message) state.tasks[taskIndex].message = message;
      }
      // Update in submitted tasks array
      const submittedTaskIndex = state.submittedTasks.findIndex(task => task.task_id === taskId);
      if (submittedTaskIndex !== -1) {
        state.submittedTasks[submittedTaskIndex].status = status;
        if (message) state.submittedTasks[submittedTaskIndex].message = message;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch repos
      .addCase(fetchRepos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepos.fulfilled, (state, action) => {
        state.loading = false;
        state.repos = action.payload;
      })
      .addCase(fetchRepos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch repositories';
      })
      // Run Codex
      .addCase(runCodex.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runCodex.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
        state.tasks.push(action.payload);
      })
      .addCase(runCodex.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to run Codex';
      })
      // Fetch task
      .addCase(fetchTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.loading = false;
        const task = action.payload;
        // Update current task if it matches
        if (state.currentTask?.task_id === task.task_id) {
          state.currentTask = task;
        }
        // Update or add to tasks array
        const existingIndex = state.tasks.findIndex(t => t.task_id === task.task_id);
        if (existingIndex !== -1) {
          state.tasks[existingIndex] = task;
        } else {
          state.tasks.push(task);
        }
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch task';
      })
      // Fetch submitted tasks
      .addCase(fetchSubmittedTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmittedTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.submittedTasks = action.payload;
      })
      .addCase(fetchSubmittedTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch submitted tasks';
      });
  },
});

export const { clearError, setCurrentTask, clearCurrentTask, updateTaskStatus } = codexSlice.actions;
export default codexSlice.reducer;