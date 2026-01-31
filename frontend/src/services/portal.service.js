import client from '../api/axiosConfig';

const getDashboardStats = async () => {
  const response = await client.get('/portal/dashboard');
  return response.data;
};

const getInvoices = async (status = 'All') => {
  const response = await client.get('/portal/invoices');
  let data = response.data;
  if (status !== 'All') {
    data = data.filter(inv => inv.status === status);
  }
  return data;
};

const getInvoiceById = async (id) => {
  const response = await client.get(`/portal/invoices/${id}`);
  return response.data;
};

const getPayments = async () => {
  const response = await client.get('/portal/payments');
  return response.data;
};

const getProfile = async () => {
  const response = await client.get('/portal/profile');
  return response.data;
};

const updateProfile = async (data) => {
  const response = await client.put('/portal/profile', data);
  return response.data;
};

const portalService = {
  getDashboardStats,
  getInvoices,
  getInvoiceById,
  getPayments,
  getProfile,
  updateProfile,
};

export default portalService;
