import client from '../api/axiosConfig';

// --- Generic CRUD Helper ---
const createCrudService = (endpoint) => ({
  getAll: async (page = 0, limit = 10, search = '') => {
    const response = await client.get(endpoint, {
      params: { page, limit, search }
    });
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

// --- Custom Expenses Service ---
const expensesService = {
  ...createCrudService('/production-expenses'),
  post: async (id) => {
    const response = await client.post(`/production-expenses/${id}/post`);
    return response.data;
  }
};

// --- Export Services ---
const productionService = {
  expenses: expensesService,
};

export default productionService;
