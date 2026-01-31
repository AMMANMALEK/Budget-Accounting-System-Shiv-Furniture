import client from '../api/axiosConfig';

const getDashboardStats = async () => {
  const response = await client.get('/portal/dashboard');
  return response.data;
};

const getOrders = async () => {
  const response = await client.get('/portal/orders');
  return response.data || [];
};

const getInvoices = async (status = 'All') => {
  const response = await client.get('/portal/invoices');
  let data = response.data || [];
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
  return response.data || [];
};

const downloadInvoice = async (id) => {
  // Assuming the backend handles the download via a direct link or blob
  const response = await client.get(`/portal/invoices/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const downloadPaymentReceipt = async (id) => {
  const response = await client.get(`/portal/payments/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `payment_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
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
  getOrders,
  getInvoices,
  getInvoiceById,
  getPayments,
  downloadInvoice,
  downloadPaymentReceipt,
  getProfile,
  updateProfile,
};

export default portalService;
