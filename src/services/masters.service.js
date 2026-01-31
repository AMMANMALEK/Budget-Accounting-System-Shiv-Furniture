import client from '../api/axiosConfig';

// --- Generic CRUD Helper ---
const createCrudService = (endpoint) => ({
  getAll: async (page = 0, limit = 10, search = '') => {
    const response = await client.get(endpoint, {
      params: { page, limit, search }
    });
    // Assuming backend returns { data: [], total: N } structure
    // If backend returns array directly, wrap it: { data: response.data, total: response.data.length }
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

// --- Export Services ---
const mastersService = {
  contacts: createCrudService('/contacts'),
  products: createCrudService('/products'),
  costCenters: createCrudService('/cost-centers'),
  budgets: createCrudService('/budgets'),
  autoRules: createCrudService('/auto-analytics'),
};

export default mastersService;
