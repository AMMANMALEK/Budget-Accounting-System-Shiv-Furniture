import React, { useState, useEffect } from 'react';
import { Grid, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../../../components/common/PageHeader';
import KPICard from '../../../components/dashboard/KPICard';
import ChartCard from '../../../components/dashboard/ChartCard';
import productionService from '../../../services/production.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ProductionDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await productionService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Production Dashboard" />
      
      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <KPICard loading={true} />
            </Grid>
          ))
        ) : (
          stats?.kpi.map((kpi, index) => (
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
      <Grid container spacing={3}>
        {/* Line Chart */}
        <Grid item xs={12} md={8}>
          <ChartCard title="Monthly Expenses Trend" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats?.monthlyExpenses}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Cost Center Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.costCenterDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.costCenterDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductionDashboard;
