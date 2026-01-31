import client from '../api/axiosConfig';

const unwrapReport = (payload) => {
  if (!payload) return null;
  if (payload.success && payload.data) return payload.data;
  return payload;
};

const toMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const buildKpisFromBudgetSummary = (summary) => {
  if (!summary) return [];
  const totalPlanned = toMoney(summary.totalPlannedAmount);
  const totalActual = toMoney(summary.totalActualAmount);
  const remaining = toMoney(summary.totalRemainingAmount);
  const achievement = Number.isFinite(Number(summary.overallAchievementPercentage))
    ? Number(summary.overallAchievementPercentage)
    : 0;

  return [
    { title: 'Total Budget', value: `$${totalPlanned.toLocaleString()}`, change: '', trend: 'up' },
    { title: 'Actual Spend', value: `$${totalActual.toLocaleString()}`, change: '', trend: totalActual <= totalPlanned ? 'up' : 'down' },
    { title: 'Remaining', value: `$${remaining.toLocaleString()}`, change: '', trend: remaining >= 0 ? 'up' : 'down' },
    { title: 'Achievement', value: `${Math.round(achievement)}%`, change: '', trend: achievement >= 0 ? 'up' : 'down' }
  ];
};

const buildBudgetCategoryData = (budgets = []) => {
  return budgets.map((b) => {
    const budget = toMoney(b.plannedAmount);
    const actual = toMoney(b.actualAmount);
    const variance = budget - actual;
    const utilization = budget > 0 ? Math.round((actual / budget) * 100) : 0;
    return {
      category: b.costCenterName || b.budgetDescription || `Budget ${b.budgetId}`,
      budget,
      actual,
      variance,
      utilization,
      status: b.isOverBudget ? 'Over Budget' : 'On Track'
    };
  });
};

const buildExpenseKpis = (summary) => {
  if (!summary) return [];
  const totalExpenses = toMoney(summary.totalExpenses);
  const totalRecords = toMoney(summary.totalRecords);
  return [
    { title: 'Total Spend', value: `$${totalExpenses.toLocaleString()}`, change: '', trend: 'up' },
    { title: 'Total Records', value: `${totalRecords.toLocaleString()}`, change: '', trend: 'up' },
  ];
};

const buildDistributionData = (costCenters = []) => {
  return costCenters.map((cc) => ({
    name: cc.costCenterName || cc.name,
    value: toMoney(cc.totalExpenses)
  }));
};

const buildDetailsData = (costCenters = []) => {
  return costCenters.map((cc) => {
    const ytdSpend = toMoney(cc.totalExpenses);
    return {
      name: cc.costCenterName || cc.name,
      manager: cc.manager || 'N/A',
      employees: cc.employees || 0,
      ytdSpend,
      budget: toMoney(cc.budget) || 0,
      performance: cc.performance || 0
    };
  });
};

const reportsService = {
  getBudgetVsActual: async (startDate, endDate) => {
    const response = await client.get('/reports/budget-vs-actual', {
      params: { startDate, endDate }
    });
    const raw = unwrapReport(response.data);

    const summary = raw?.summary;
    const budgets = raw?.budgets || [];

    return {
      kpi: buildKpisFromBudgetSummary(summary),
      monthlyData: [],
      categoryData: buildBudgetCategoryData(budgets),
    };
  },

  getCostCenterPerformance: async (startDate, endDate) => {
    const response = await client.get('/reports/cost-center-performance', {
      params: { startDate, endDate }
    });
    const raw = unwrapReport(response.data);

    const summary = raw?.summary;
    const costCenters = raw?.costCenters || [];

    return {
      kpi: buildExpenseKpis(summary),
      distributionData: buildDistributionData(costCenters),
      trendData: [],
      detailsData: buildDetailsData(costCenters)
    };
  },
  
  exportToCSV: (data, filename) => {
    // This is a client-side utility, so we can keep the logic here or move it to a utils file.
    // For now, keeping it simple as a placeholder or basic implementation.
    
    if (!data || !data.length) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export default reportsService;
