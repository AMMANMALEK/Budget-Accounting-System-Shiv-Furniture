import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchasesService from '../../services/purchases.service';

const initialState = {
  purchaseOrders: [],
  vendorBills: [],
  payments: [],
  total: 0,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Fetch Purchase Orders
export const getPurchaseOrders = createAsyncThunk(
  'purchases/getPurchaseOrders',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      return await purchasesService.purchaseOrders.getAll(page, limit, search);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Vendor Bills
export const getVendorBills = createAsyncThunk(
  'purchases/getVendorBills',
  async ({ page, limit, search }, thunkAPI) => {
    try {
      return await purchasesService.vendorBills.getAll(page, limit, search);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const purchaseSlice = createSlice({
  name: 'purchases',
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
      .addCase(getPurchaseOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPurchaseOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchaseOrders = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(getPurchaseOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getVendorBills.fulfilled, (state, action) => {
        state.vendorBills = action.payload.data;
      });
  },
});

export const { reset } = purchaseSlice.actions;
export default purchaseSlice.reducer;
