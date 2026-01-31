import React, { useState, useEffect } from 'react';
import { Grid, Box, TextField, MenuItem, Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '../../../components/common/PageHeader';
import KPICard from '../../../components/dashboard/KPICard';
import ChartCard from '../../../components/dashboard/ChartCard';
import DataTable from '../../../components/common/DataTable';
import reportsService from '../../../services/reports.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CostCenterPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_year');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await reportsService.getCostCenterPerformance();
      setData(result);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data) {
      reportsService.exportToCSV(data.detailsData, 'Cost_Center_Performance.csv');
    }
  };

  const columns = [
    { id: 'name', label: 'Cost Center', minWidth: 150 },
    { id: 'manager', label: 'Manager', minWidth: 120 },
    { id: 'employees', label: 'Employees', minWidth: 100 },
    { 
      id: 'ytdSpend', 
      label: 'YTD Spend', 
      minWidth: 120, 
      format: (value) => `$${value.toLocaleString()}` 
    },
    { 
      id: 'budget', 
      label: 'Total Budget', 
      minWidth: 120, 
      format: (value) => `$${value.toLocaleString()}` 
    },
    { 
      id: 'performance', 
      label: 'Efficiency Score', 
      minWidth: 120,
      format: (value) => (
        <span style={{ 
          color: value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red', 
          fontWeight: 'bold' 
        }}>
          {value}/100
        </span>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Cost Center Performance" />
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
          data?.kpi.map((kpi, index) => (
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
        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Spend Distribution" loading={loading} height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data?.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Line Chart */}
        <Grid item xs={12} md={8}>
          <ChartCard title="Monthly Spend Trend by Center" loading={loading} height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Manufacturing Plant" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Head Office" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Warehouse A" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Detailed Table */}
      <ChartCard title="Performance Details" loading={loading} height="auto">
        <DataTable 
          columns={columns} 
          data={data?.detailsData || []} 
          loading={loading}
          rowsPerPage={10}
        />
      </ChartCard>
    </Box>
  );
};

export default CostCenterPerformance;
