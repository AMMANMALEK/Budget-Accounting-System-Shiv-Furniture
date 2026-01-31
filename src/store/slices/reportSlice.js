import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportsService from '../../services/reports.service';

const initialState = {
  budgetVsActual: null,
  costCenterPerformance: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Fetch Budget vs Actual
export const getBudgetVsActual = createAsyncThunk(
  'reports/getBudgetVsActual',
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      return await reportsService.getBudgetVsActual(startDate, endDate);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Cost Center Performance
export const getCostCenterPerformance = createAsyncThunk(
  'reports/getCostCenterPerformance',
  async ({ startDate, endDate }, thunkAPI) => {
    try {
      return await reportsService.getCostCenterPerformance(startDate, endDate);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBudgetVsActual.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBudgetVsActual.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgetVsActual = action.payload;
      })
      .addCase(getBudgetVsActual.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCostCenterPerformance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.costCenterPerformance = action.payload;
      });
  },
});

export const { reset } = reportSlice.actions;
export default reportSlice.reducer;
