import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import budgetService from '../../services/budget.service';

const initialState = {
  budgets: [],
  total: 0,
  overview: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Fetch budgets
export const getBudgets = createAsyncThunk(
  'budget/getAll',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      return await budgetService.getAll(page, limit, search);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get Budget Overview
export const getBudgetOverview = createAsyncThunk(
  'budget/getOverview',
  async (_, thunkAPI) => {
    try {
      return await budgetService.getBudgetOverview();
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create budget
export const createBudget = createAsyncThunk(
  'budget/create',
  async (budgetData, thunkAPI) => {
    try {
      return await budgetService.create(budgetData);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const budgetSlice = createSlice({
  name: 'budget',
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
      .addCase(getBudgets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(getBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getBudgetOverview.fulfilled, (state, action) => {
        state.overview = action.payload;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.budgets.push(action.payload);
      });
  },
});

export const { reset } = budgetSlice.actions;
export default budgetSlice.reducer;
