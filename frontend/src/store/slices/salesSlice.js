import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import salesService from '../../services/sales.service';

const initialState = {
  salesOrders: [],
  customerInvoices: [],
  customerPayments: [],
  total: 0,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Fetch Sales Orders
export const getSalesOrders = createAsyncThunk(
  'sales/getSalesOrders',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      return await salesService.salesOrders.getAll(page, limit, search);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Customer Invoices
export const getCustomerInvoices = createAsyncThunk(
  'sales/getCustomerInvoices',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      return await salesService.customerInvoices.getAll(page, limit, search);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const salesSlice = createSlice({
  name: 'sales',
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
      .addCase(getSalesOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSalesOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.salesOrders = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(getSalesOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCustomerInvoices.fulfilled, (state, action) => {
        state.customerInvoices = action.payload.data;
      });
  },
});

export const { reset } = salesSlice.actions;
export default salesSlice.reducer;
