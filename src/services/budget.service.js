import client from '../api/axiosConfig';

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

const budgetService = {
  ...createCrudService('/budgets'),
  
  // Custom method to get overview data
  // Since there isn't a dedicated endpoint, we might need to fetch all or use a dashboard endpoint
  // For now, let's assume we can calculate it from the list or if the backend provides a summary endpoint later.
  // Alternatively, if the user mentioned a dashboard endpoint, maybe that's where this data lives.
  // But to keep it working with the new backend structure:
  getBudgetOverview: async () => {
    try {
      // Trying to fetch all budgets to aggregate. 
      // Note: This might be heavy if there are many budgets. 
      // ideally backend should provide this via /api/admin/dashboard or similar.
      const response = await client.get('/budgets', { params: { limit: 1000 } });
      const budgets = response.data.data || []; // Assuming response structure { data: [], total: ... }
      
      const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
      const totalAllocated = budgets.reduce((sum, b) => sum + (Number(b.allocated) || 0), 0);
      const totalRemaining = budgets.reduce((sum, b) => sum + (Number(b.remaining) || 0), 0);

      return {
        totalBudget,
        totalAllocated,
        totalRemaining
      };
    } catch (error) {
      console.error('Error fetching budget overview:', error);
      // Return zeros or throw
      return {
        totalBudget: 0,
        totalAllocated: 0,
        totalRemaining: 0
      };
    }
  }
};

export default budgetService;
