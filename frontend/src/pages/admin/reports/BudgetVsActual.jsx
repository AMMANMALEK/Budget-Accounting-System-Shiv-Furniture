import React, { useState, useEffect } from 'react';
import { Grid, Box, TextField, MenuItem, Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../../components/common/PageHeader';
import KPICard from '../../../components/dashboard/KPICard';
import ChartCard from '../../../components/dashboard/ChartCard';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import reportsService from '../../../services/reports.service';

const BudgetVsActual = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_year');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await reportsService.getBudgetVsActual();
      setData(result);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data) {
      reportsService.exportToCSV(data.categoryData, 'Budget_vs_Actual_Report.csv');
    }
  };

  const columns = [
    { id: 'category', label: 'Category', minWidth: 150 },
    {
      id: 'budget',
      label: 'Budget',
      minWidth: 120,
      format: (value) => `$${(value || 0).toLocaleString()}`
    },
    {
      id: 'actual',
      label: 'Actual Spend',
      minWidth: 120,
      format: (value) => `$${(value || 0).toLocaleString()}`
    },
    {
      id: 'variance',
      label: 'Variance',
      minWidth: 120,
      format: (value) => (
        <span style={{ color: (value || 0) >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
          {(value || 0) >= 0 ? '+' : ''}{`$${(value || 0).toLocaleString()}`}
        </span>
      )
    },
    {
      id: 'utilization',
      label: 'Utilization',
      minWidth: 100,
      format: (value) => `${value || 0}%`
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => <StatusBadge status={value || 'Unknown'} />
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Budget vs Actual Report" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            sx={{ width: 150 }}
            label="Time Period"
          >
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="last_quarter">Last Quarter</MenuItem>
            <MenuItem value="this_year">This Year</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <KPICard loading={true} />
            </Grid>
          ))
        ) : (
          data?.kpi?.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <KPICard
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                trend={kpi.trend}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <ChartCard title="Budget vs Actual Trend" loading={loading} height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Budget" fill="#8884d8" name="Budget" />
                <Bar dataKey="Actual" fill="#82ca9d" name="Actual Spend" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Detailed Table */}
      <ChartCard title="Category Breakdown" loading={loading} height="auto">
        <DataTable
          columns={columns}
          data={data?.categoryData || []}
          loading={loading}
          rowsPerPage={10}
        />
      </ChartCard>
    </Box>
  );
};

export default BudgetVsActual;
