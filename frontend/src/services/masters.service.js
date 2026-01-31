import client from '../api/axiosConfig';

// --- Generic CRUD Helper ---
const createCrudService = (endpoint) => ({
  getAll: async (page = 0, limit = 10, search = '', filters = {}) => {
    const response = await client.get(endpoint, {
      params: { page, limit, search, ...filters }
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

const normalizeContactForUi = (contact) => {
  if (!contact) return contact;
  const contactType = (contact.contact_type || contact.contactType || '').toString().toUpperCase();
  let type = contact.type;
  if (!type) {
    if (contactType === 'VENDOR') type = 'Vendor';
    else if (contactType === 'CUSTOMER') type = 'Customer';
  }

  return {
    ...contact,
    type: type || 'Customer',
    phone: contact.phone || '',
    status: contact.status || 'Active'
  };
};

const mapContactToApi = (payload) => {
  if (!payload) return payload;
  const uiType = (payload.type || payload.contact_type || payload.contactType || '').toString().toLowerCase();
  let contact_type = payload.contact_type;
  if (!contact_type) {
    if (uiType === 'vendor') contact_type = 'VENDOR';
    else contact_type = 'CUSTOMER';
  }

  return {
    name: payload.name,
    email: payload.email,
    contact_type,
    phone: payload.phone,
    street: payload.street,
    city: payload.city,
    state: payload.state,
    country: payload.country,
    pincode: payload.pincode,
    // Pass status if backend accepts it, otherwise it might be ignored
    status: payload.status
  };
};

const contactsService = {
  getAll: async (page = 0, limit = 10, search = '', filters = {}) => {
    const response = await client.get('/contacts', {
      params: { page, limit, search, ...filters }
    });

    const result = response.data;
    if (!result || !Array.isArray(result.data)) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    return {
      ...result,
      data: result.data.map(normalizeContactForUi)
    };
  },

  getById: async (id) => {
    const response = await client.get(`/contacts/${id}`);
    return normalizeContactForUi(response.data);
  },

  create: async (item) => {
    const response = await client.post('/contacts', mapContactToApi(item));
    return normalizeContactForUi(response.data);
  },

  update: async (id, updates) => {
    const response = await client.put(`/contacts/${id}`, mapContactToApi(updates));
    return normalizeContactForUi(response.data);
  },

  delete: async (id) => {
    const response = await client.delete(`/contacts/${id}`);
    return response.data;
  }
};

// --- Export Services ---
const mastersService = {
  contacts: contactsService,
  products: createCrudService('/products'),
  costCenters: createCrudService('/cost-centers'),
  budgets: createCrudService('/budgets'),
  autoRules: createCrudService('/auto-analytics'),
};

export default mastersService;
