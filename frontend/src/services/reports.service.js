import client from '../api/axiosConfig';

const reportsService = {
  getBudgetVsActual: async (startDate, endDate) => {
    const response = await client.get('/reports/budget-vs-actual', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getCostCenterPerformance: async (startDate, endDate) => {
    const response = await client.get('/reports/cost-center-performance', {
      params: { startDate, endDate }
    });
    return response.data;
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
