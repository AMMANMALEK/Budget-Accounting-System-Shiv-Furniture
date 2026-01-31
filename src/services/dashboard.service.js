import client from '../api/axiosConfig';

// Cache promise to deduplicate requests if called multiple times quickly
let dashboardPromise = null;

const fetchDashboard = () => {
  if (!dashboardPromise) {
    dashboardPromise = client.get('/admin/dashboard')
      .then(res => res.data)
      .catch(err => {
        dashboardPromise = null;
        throw err;
      })
      .finally(() => {
        // Clear cache after a short delay so subsequent refreshes work
        setTimeout(() => { dashboardPromise = null; }, 2000);
      });
  }
  return dashboardPromise;
};

const getKPIs = async () => {
  const data = await fetchDashboard();
  // Assuming data contains kpis or IS the kpis object. 
  // Adjust based on actual backend response structure.
  return data.kpis || data; 
};

const getBudgetVsActual = async () => {
  const response = await client.get('/reports/budget-vs-actual');
  return response.data;
};

const getMonthlySpend = async () => {
  // Assuming monthly spend is part of the main dashboard data
  // or user might add a specific endpoint later.
  const data = await fetchDashboard();
  return data.monthlySpend || [];
};

const getCostCenterDist = async () => {
  const response = await client.get('/reports/cost-center-performance');
  return response.data;
};

const getAlerts = async () => {
  const data = await fetchDashboard();
  return data.alerts || [];
};

const getRecentActivity = async () => {
  const data = await fetchDashboard();
  return data.recentActivity || [];
};

const dashboardService = {
  getKPIs,
  getBudgetVsActual,
  getMonthlySpend,
  getCostCenterDist,
  getAlerts,
  getRecentActivity,
};

export default dashboardService;
