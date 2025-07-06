
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { testRunService, TestRun, CreateTestRunData } from '@/services/testRunService';

interface TestRunState {
  testRuns: TestRun[];
  currentTestRun: TestRun | null;
  loading: boolean;
  error: string | null;
}

const initialState: TestRunState = {
  testRuns: [],
  currentTestRun: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchTestRunsByCase = createAsyncThunk(
  'testRuns/fetchTestRunsByCase',
  async ({ projectId, testCaseId }: { projectId: string; testCaseId: string }) => {
    return await testRunService.getTestRunsByCase(projectId, testCaseId);
  }
);

export const fetchTestRunsByScenario = createAsyncThunk(
  'testRuns/fetchTestRunsByScenario',
  async ({ projectId, scenarioId }: { projectId: string; scenarioId: string }) => {
    return await testRunService.getTestRunsByScenario(projectId, scenarioId);
  }
);

export const recordTestRun = createAsyncThunk(
  'testRuns/recordTestRun',
  async (data: CreateTestRunData) => {
    return await testRunService.recordTestRun(data);
  }
);

export const updateTestRun = createAsyncThunk(
  'testRuns/updateTestRun',
  async ({ runId, data }: { runId: string; data: Partial<TestRun> }) => {
    return await testRunService.updateTestRun(runId, data);
  }
);

export const deleteTestRun = createAsyncThunk(
  'testRuns/deleteTestRun',
  async (runId: string) => {
    await testRunService.deleteTestRun(runId);
    return runId;
  }
);

const testRunSlice = createSlice({
  name: 'testRuns',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTestRun: (state, action) => {
      state.currentTestRun = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch test runs
      .addCase(fetchTestRunsByCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestRunsByCase.fulfilled, (state, action) => {
        state.loading = false;
        state.testRuns = action.payload;
      })
      .addCase(fetchTestRunsByCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch test runs';
      })
      // Record test run
      .addCase(recordTestRun.fulfilled, (state, action) => {
        state.testRuns.unshift(action.payload);
      })
      // Update test run
      .addCase(updateTestRun.fulfilled, (state, action) => {
        const index = state.testRuns.findIndex(tr => tr.run_id === action.payload.run_id);
        if (index !== -1) {
          state.testRuns[index] = action.payload;
        }
      })
      // Delete test run
      .addCase(deleteTestRun.fulfilled, (state, action) => {
        state.testRuns = state.testRuns.filter(tr => tr.run_id !== action.payload);
      });
  },
});

export const { clearError, setCurrentTestRun } = testRunSlice.actions;
export default testRunSlice.reducer;
