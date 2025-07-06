
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scenarioService, Scenario, CreateScenarioData } from '@/services/scenarioService';

interface ScenarioState {
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  loading: boolean;
  error: string | null;
}

const initialState: ScenarioState = {
  scenarios: [],
  currentScenario: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchScenarios = createAsyncThunk(
  'scenarios/fetchScenarios',
  async (projectId: string) => {
    return await scenarioService.getScenarios(projectId);
  }
);

export const fetchScenario = createAsyncThunk(
  'scenarios/fetchScenario',
  async ({ projectId, scenarioId }: { projectId: string; scenarioId: string }) => {
    return await scenarioService.getScenario(projectId, scenarioId);
  }
);

export const createScenario = createAsyncThunk(
  'scenarios/createScenario',
  async ({ projectId, data }: { projectId: string; data: CreateScenarioData }) => {
    return await scenarioService.createScenario(projectId, data);
  }
);

export const updateScenario = createAsyncThunk(
  'scenarios/updateScenario',
  async ({ projectId, scenarioId, data }: { projectId: string; scenarioId: string; data: Partial<Scenario> }) => {
    return await scenarioService.updateScenario(projectId, scenarioId, data);
  }
);

export const deleteScenario = createAsyncThunk(
  'scenarios/deleteScenario',
  async ({ projectId, scenarioId }: { projectId: string; scenarioId: string }) => {
    await scenarioService.deleteScenario(projectId, scenarioId);
    return scenarioId;
  }
);

const scenarioSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentScenario: (state, action) => {
      state.currentScenario = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch scenarios
      .addCase(fetchScenarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScenarios.fulfilled, (state, action) => {
        state.loading = false;
        state.scenarios = action.payload;
      })
      .addCase(fetchScenarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch scenarios';
      })
      // Create scenario
      .addCase(createScenario.fulfilled, (state, action) => {
        state.scenarios.push(action.payload);
      })
      // Update scenario
      .addCase(updateScenario.fulfilled, (state, action) => {
        const index = state.scenarios.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.scenarios[index] = action.payload;
        }
      })
      // Delete scenario
      .addCase(deleteScenario.fulfilled, (state, action) => {
        state.scenarios = state.scenarios.filter(s => s.id !== action.payload);
      });
  },
});

export const { clearError, setCurrentScenario } = scenarioSlice.actions;
export default scenarioSlice.reducer;
