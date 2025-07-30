import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bugService, Bug, BugFix, CreateBugData, CreateBugFixData, CreateBugsBatchData, CreateBugsBatchResponse } from '@/services/bugService';

interface BugState {
  bugs: Bug[];
  currentBug: Bug | null;
  bugFixes: Record<string, BugFix[]>;
  loading: boolean;
  error: string | null;
}

const initialState: BugState = {
  bugs: [],
  currentBug: null,
  bugFixes: {},
  loading: false,
  error: null,
};

export const fetchBugs = createAsyncThunk(
  'bugs/fetchBugs',
  async (params: { projectId: string; filters?: { status?: string; severity?: string; task_id?: string; scenario_id?: string; } }) => {
    const response = await bugService.getBugs(params.projectId, params.filters);
    return response;
  }
);

export const fetchBug = createAsyncThunk(
  'bugs/fetchBug',
  async (bugId: string) => {
    const response = await bugService.getBug(bugId);
    return response;
  }
);

export const createBug = createAsyncThunk(
  'bugs/createBug',
  async (bugData: CreateBugData) => {
    const response = await bugService.createBug(bugData);
    return response;
  }
);

export const updateBug = createAsyncThunk(
  'bugs/updateBug',
  async ({ bugId, updateData }: { bugId: string; updateData: Partial<Bug> }) => {
    const response = await bugService.updateBug(bugId, updateData);
    return response;
  }
);

export const deleteBug = createAsyncThunk(
  'bugs/deleteBug',
  async (bugId: string) => {
    await bugService.deleteBug(bugId);
    return bugId;
  }
);

export const fetchBugFixes = createAsyncThunk(
  'bugs/fetchBugFixes',
  async (bugId: string) => {
    const response = await bugService.getBugFixes(bugId);
    return { bugId, fixes: response };
  }
);

export const createBugFix = createAsyncThunk(
  'bugs/createBugFix',
  async (fixData: CreateBugFixData) => {
    const response = await bugService.createBugFix(fixData);
    return response;
  }
);

export const createBugsBatch = createAsyncThunk(
  'bugs/createBugsBatch',
  async (batchData: CreateBugsBatchData) => {
    const response = await bugService.createBugsBatch(batchData);
    return response;
  }
);

const bugSlice = createSlice({
  name: 'bugs',
  initialState,
  reducers: {
    clearCurrentBug: (state) => {
      state.currentBug = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bugs
      .addCase(fetchBugs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBugs.fulfilled, (state, action) => {
        state.loading = false;
        state.bugs = action.payload;
      })
      .addCase(fetchBugs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch bugs';
      })
      // Fetch Single Bug
      .addCase(fetchBug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBug = action.payload;
      })
      .addCase(fetchBug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch bug';
      })
      // Create Bug
      .addCase(createBug.fulfilled, (state, action) => {
        state.bugs.push(action.payload);
      })
      // Update Bug
      .addCase(updateBug.fulfilled, (state, action) => {
        const index = state.bugs.findIndex(bug => bug.id === action.payload.id);
        if (index !== -1) {
          state.bugs[index] = action.payload;
        }
        if (state.currentBug?.id === action.payload.id) {
          state.currentBug = action.payload;
        }
      })
      // Delete Bug
      .addCase(deleteBug.fulfilled, (state, action) => {
        state.bugs = state.bugs.filter(bug => bug.id !== action.payload);
        if (state.currentBug?.id === action.payload) {
          state.currentBug = null;
        }
      })
      // Fetch Bug Fixes
      .addCase(fetchBugFixes.fulfilled, (state, action) => {
        state.bugFixes[action.payload.bugId] = action.payload.fixes;
      })
      // Create Bug Fix
      .addCase(createBugFix.fulfilled, (state, action) => {
        const bugId = action.payload.bug_id;
        if (state.bugFixes[bugId]) {
          state.bugFixes[bugId].push(action.payload);
        } else {
          state.bugFixes[bugId] = [action.payload];
        }
      })
      // Create Bugs Batch
      .addCase(createBugsBatch.fulfilled, (state, action) => {
        state.bugs.push(...action.payload.bugs);
      });
  },
});

export const { clearCurrentBug, clearError } = bugSlice.actions;
export default bugSlice.reducer;