import client from '../api/axiosConfig';

// --- Generic CRUD Helper ---
const createCrudService = (endpoint) => ({
  getAll: async (page = 0, limit = 10, search = '') => {
    const response = await client.get(endpoint, {
      params: { page, limit, search }
    });
    // Assuming backend returns { data: [], total: N } or array
    return response.data;
  },
  
  getById: async (id) => {
    const response = await client.get(`${endpoint}/${id}`);
    return response.data;
  },
  
  create: async (item) => {
    const response = await client.post(endpoint, item);
    return response.data;
  },
  
  update: async (id, updates) => {
    const response = await client.put(`${endpoint}/${id}`, updates);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await client.delete(`${endpoint}/${id}`);
    return response.data;
  }
});

// --- Custom Invoice Service (adds 'post' method) ---
const invoicesService = {
  ...createCrudService('/invoices'),
  post: async (id) => {
    const response = await client.post(`/invoices/${id}/post`);
    return response.data;
  }
};

// --- Export Services ---
const salesService = {
  // User didn't specify /api/sales-orders, but it's needed for salesOrders functionality.
  // Assuming standard naming convention.
  salesOrders: createCrudService('/sales-orders'),
  customerInvoices: invoicesService,
  customerPayments: createCrudService('/payments'),
};

export default salesService;
