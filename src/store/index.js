import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import budgetReducer from './slices/budgetSlice';
import purchaseReducer from './slices/purchaseSlice';
import salesReducer from './slices/salesSlice';
import reportReducer from './slices/reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    budget: budgetReducer,
    purchases: purchaseReducer,
    sales: salesReducer,
    reports: reportReducer,
  },
});
