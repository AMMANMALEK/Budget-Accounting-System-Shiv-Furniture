import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { 
  AccountBalanceWallet, 
  ShoppingCart, 
  Verified, 
  Pending 
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';

import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import RecentActivity from '../../components/dashboard/RecentActivity';
import dashboardService from '../../services/dashboard.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [budgetVsActual, setBudgetVsActual] = useState([]);
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [costCenterDist, setCostCenterDist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data with proper error handling
        const [
          kpisData, 
          budgetData, 
          spendData, 
          costData, 
          alertsData, 
          activitiesData
        ] = await Promise.allSettled([
          dashboardService.getKPIs(),
          dashboardService.getBudgetVsActual(),
          dashboardService.getMonthlySpend(),
          dashboardService.getCostCenterDist(),
          dashboardService.getAlerts(),
          dashboardService.getRecentActivity()
        ]);

        // Handle KPIs
        if (kpisData.status === 'fulfilled') {
          setKpis(kpisData.value);
        } else {
          console.error('Failed to fetch KPIs:', kpisData.reason);
        }

        // Handle Budget vs Actual
        if (budgetData.status === 'fulfilled' && Array.isArray(budgetData.value)) {
          setBudgetVsActual(budgetData.value);
        } else {
          console.error('Failed to fetch budget data:', budgetData.reason);
          setBudgetVsActual([]);
        }

        // Handle Monthly Spend
        if (spendData.status === 'fulfilled' && Array.isArray(spendData.value)) {
          setMonthlySpend(spendData.value);
        } else {
          console.error('Failed to fetch spend data:', spendData.reason);
          setMonthlySpend([]);
        }

        // Handle Cost Center Distribution
        if (costData.status === 'fulfilled' && Array.isArray(costData.value)) {
          setCostCenterDist(costData.value);
        } else {
          console.error('Failed to fetch cost center data:', costData.reason);
          // Set mock data for demonstration
          setCostCenterDist([
            { name: 'Production', value: 400 },
            { name: 'Marketing', value: 300 },
            { name: 'Sales', value: 200 },
            { name: 'Admin', value: 100 }
          ]);
        }

        // Handle Alerts
        if (alertsData.status === 'fulfilled' && Array.isArray(alertsData.value)) {
          setAlerts(alertsData.value);
        } else {
          console.error('Failed to fetch alerts:', alertsData.reason);
          setAlerts([]);
        }

        // Handle Activities
        if (activitiesData.status === 'fulfilled' && Array.isArray(activitiesData.value)) {
          setActivities(activitiesData.value);
        } else {
          console.error('Failed to fetch activities:', activitiesData.reason);
          setActivities([]);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default values to prevent crashes
        setCostCenterDist([
          { name: 'Production', value: 400 },
          { name: 'Marketing', value: 300 },
          { name: 'Sales', value: 200 },
          { name: 'Admin', value: 100 }
        ]);
        setBudgetVsActual([]);
        setMonthlySpend([]);
        setAlerts([]);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your financial performance
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Total Budget" 
            value={kpis?.totalBudget?.value} 
            trend={kpis?.totalBudget?.trend} 
            status={kpis?.totalBudget?.status}
            icon={<AccountBalanceWallet />}
            color="#1976d2"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Committed" 
            value={kpis?.committed?.value} 
            trend={kpis?.committed?.trend} 
            status={kpis?.committed?.status}
            icon={<ShoppingCart />}
            color="#ed6c02"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Achieved" 
            value={kpis?.achieved?.value} 
            trend={kpis?.achieved?.trend} 
            status={kpis?.achieved?.status}
            icon={<Verified />}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="Remaining" 
            value={kpis?.remaining?.value} 
            trend={kpis?.remaining?.trend} 
            status={kpis?.remaining?.status}
            icon={<Pending />}
            color="#9c27b0"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={4}>
          <ChartCard title="Budget vs Actual" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Array.isArray(budgetVsActual) ? budgetVsActual : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="budget" fill="#e0e0e0" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="actual" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <ChartCard title="Monthly Spend Trend" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Array.isArray(monthlySpend) ? monthlySpend : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="spend" stroke="#2e7d32" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartCard title="Cost Center Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Array.isArray(costCenterDist) ? costCenterDist : []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Array.isArray(costCenterDist) && costCenterDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <AlertsPanel alerts={alerts} loading={loading} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RecentActivity activities={activities} loading={loading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
