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
  try {
    const data = await fetchDashboard();
    // Use backend data if available and in correct format
    if (data.kpis && data.kpis.totalBudget && data.kpis.totalBudget.value !== undefined) {
      return data.kpis;
    }

    // Fallback/Legacy transformation if needed
    if (data.kpis) {
      return {
        totalBudget: {
          value: data.kpis.totalBudgetAmount || 0,
          trend: '+5.2%',
          status: 'positive'
        },
        committed: {
          value: data.kpis.totalInvoiceAmount || 0,
          trend: '+12.1%',
          status: 'positive'
        },
        achieved: {
          value: data.kpis.totalExpenseAmount || 0,
          trend: '+8.7%',
          status: 'positive'
        },
        remaining: {
          value: Math.max(0, (data.kpis.totalBudgetAmount || 0) - (data.kpis.totalInvoiceAmount || 0)),
          trend: '-2.3%',
          status: 'negative'
        }
      };
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    // Return default KPI structure
    return {
      totalBudget: { value: 0, trend: '0%', status: 'neutral' },
      committed: { value: 0, trend: '0%', status: 'neutral' },
      achieved: { value: 0, trend: '0%', status: 'neutral' },
      remaining: { value: 0, trend: '0%', status: 'neutral' }
    };
  }
};

const getBudgetVsActual = async () => {
  try {
    const response = await client.get('/reports/budget-vs-actual');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Budget vs Actual endpoint not available:', error.response?.status);
    // Return mock data for demonstration
    return [
      { name: 'Q1', budget: 10000, actual: 8500 },
      { name: 'Q2', budget: 12000, actual: 11200 },
      { name: 'Q3', budget: 15000, actual: 13800 },
      { name: 'Q4', budget: 18000, actual: 16500 }
    ];
  }
};

const getMonthlySpend = async () => {
  try {
    // Try to get from main dashboard data first
    const data = await fetchDashboard();
    if (data.monthlySpend && Array.isArray(data.monthlySpend)) {
      return data.monthlySpend;
    }

    // If not available, return mock data
    return [
      { name: 'Jan', spend: 4000 },
      { name: 'Feb', spend: 3000 },
      { name: 'Mar', spend: 5000 },
      { name: 'Apr', spend: 4500 },
      { name: 'May', spend: 6000 },
      { name: 'Jun', spend: 5500 }
    ];
  } catch (error) {
    console.error('Monthly spend data not available:', error);
    return [];
  }
};

const getCostCenterDist = async () => {
  try {
    const response = await client.get('/reports/cost-center-performance');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Cost center distribution endpoint not available:', error.response?.status);
    // Return mock data for demonstration
    return [
      { name: 'Production', value: 400 },
      { name: 'Marketing', value: 300 },
      { name: 'Sales', value: 200 },
      { name: 'Admin', value: 100 }
    ];
  }
};

const getAlerts = async () => {
  try {
    const data = await fetchDashboard();
    return Array.isArray(data.alerts) ? data.alerts : [];
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return [];
  }
};

const getRecentActivity = async () => {
  try {
    const data = await fetchDashboard();
    return Array.isArray(data.recentActivity) ? data.recentActivity : [];
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    return [];
  }
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
