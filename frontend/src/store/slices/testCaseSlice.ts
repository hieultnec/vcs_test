
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { testCaseService, CreateTestCaseData } from '@/services/testCaseService';
import { TestCase } from '@/services/scenarioService';

interface TestCaseState {
  testCases: TestCase[];
  currentTestCase: TestCase | null;
  loading: boolean;
  error: string | null;
}

const initialState: TestCaseState = {
  testCases: [],
  currentTestCase: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchTestCases = createAsyncThunk(
  'testCases/fetchTestCases',
  async ({ projectId, scenarioId }: { projectId: string; scenarioId: string }) => {
    return await testCaseService.getTestCases(projectId, scenarioId);
  }
);

export const createTestCase = createAsyncThunk(
  'testCases/createTestCase',
  async ({ projectId, scenarioId, data }: { projectId: string; scenarioId: string; data: CreateTestCaseData }) => {
    return await testCaseService.createTestCase(projectId, scenarioId, data);
  }
);

export const updateTestCase = createAsyncThunk(
  'testCases/updateTestCase',
  async ({ projectId, scenarioId, testCaseId, data }: { 
    projectId: string; 
    scenarioId: string; 
    testCaseId: string; 
    data: Partial<TestCase> 
  }) => {
    return await testCaseService.updateTestCase(projectId, scenarioId, testCaseId, data);
  }
);

export const deleteTestCase = createAsyncThunk(
  'testCases/deleteTestCase',
  async ({ projectId, scenarioId, testCaseId }: { 
    projectId: string; 
    scenarioId: string; 
    testCaseId: string; 
  }) => {
    await testCaseService.deleteTestCase(projectId, scenarioId, testCaseId);
    return testCaseId;
  }
);

const testCaseSlice = createSlice({
  name: 'testCases',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTestCase: (state, action) => {
      state.currentTestCase = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch test cases
      .addCase(fetchTestCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestCases.fulfilled, (state, action) => {
        state.loading = false;
        state.testCases = action.payload;
      })
      .addCase(fetchTestCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch test cases';
      })
      // Create test case
      .addCase(createTestCase.fulfilled, (state, action) => {
        state.testCases.push(action.payload);
      })
      // Update test case
      .addCase(updateTestCase.fulfilled, (state, action) => {
        const index = state.testCases.findIndex(tc => tc.id === action.payload.id);
        if (index !== -1) {
          state.testCases[index] = action.payload;
        }
      })
      // Delete test case
      .addCase(deleteTestCase.fulfilled, (state, action) => {
        state.testCases = state.testCases.filter(tc => tc.id !== action.payload);
      });
  },
});

export const { clearError, setCurrentTestCase } = testCaseSlice.actions;
export default testCaseSlice.reducer;
