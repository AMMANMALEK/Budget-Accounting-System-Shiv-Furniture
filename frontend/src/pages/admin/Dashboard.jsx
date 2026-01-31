import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { 
  AccountBalanceWallet, 
  ShoppingCart, 
  Verified, 
  Pending,
  AttachMoney,
  MoneyOff,
  TrendingUp,
  Receipt
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
  const [financialOverview, setFinancialOverview] = useState(null);
  const [budgetVsActual, setBudgetVsActual] = useState([]);
  const [monthlySpend, setMonthlySpend] = useState([]);
  const [costCenterDist, setCostCenterDist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data with proper error handling
        const [
          kpisData, 
          financialData,
          budgetData, 
          spendData, 
          costData, 
          alertsData, 
          activitiesData,
          topProductsData,
          recentSalesData
        ] = await Promise.allSettled([
          dashboardService.getKPIs(),
          dashboardService.getFinancialOverview(),
          dashboardService.getBudgetVsActual(),
          dashboardService.getMonthlySpend(),
          dashboardService.getCostCenterDist(),
          dashboardService.getAlerts(),
          dashboardService.getRecentActivity(),
          dashboardService.getTopProducts(),
          dashboardService.getRecentSalesOrders()
        ]);

        // Handle KPIs
        if (kpisData.status === 'fulfilled') {
          setKpis(kpisData.value);
        }

        // Handle Financial Overview
        if (financialData.status === 'fulfilled') {
          setFinancialOverview(financialData.value);
        }

        // Handle Budget vs Actual
        if (budgetData.status === 'fulfilled' && Array.isArray(budgetData.value)) {
          setBudgetVsActual(budgetData.value);
        }

        // Handle Monthly Spend
        if (spendData.status === 'fulfilled' && Array.isArray(spendData.value)) {
          setMonthlySpend(spendData.value);
        }

        // Handle Cost Center Distribution
        if (costData.status === 'fulfilled' && Array.isArray(costData.value)) {
          setCostCenterDist(costData.value);
        } else {
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
        }

        // Handle Activities
        if (activitiesData.status === 'fulfilled' && Array.isArray(activitiesData.value)) {
          setActivities(activitiesData.value);
        }

        // Handle Top Products
        if (topProductsData.status === 'fulfilled' && Array.isArray(topProductsData.value)) {
          setTopProducts(topProductsData.value);
        }

        // Handle Recent Sales
        if (recentSalesData.status === 'fulfilled' && Array.isArray(recentSalesData.value)) {
          setRecentSales(recentSalesData.value);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of your financial performance
        </Typography>
      </Box>

      {/* Financial Health Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Financial Health</Typography>
        <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard 
              title="Total Revenue" 
              value={formatCurrency(financialOverview?.totalRevenue?.value || 0)} 
              trend={financialOverview?.totalRevenue?.trend} 
              status={financialOverview?.totalRevenue?.status}
              icon={<AttachMoney />}
              color="#2e7d32"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard 
              title="Total Expenses" 
              value={formatCurrency(financialOverview?.totalExpenses?.value || 0)} 
              trend={financialOverview?.totalExpenses?.trend} 
              status={financialOverview?.totalExpenses?.status}
              icon={<MoneyOff />}
              color="#d32f2f"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard 
              title="Net Profit" 
              value={formatCurrency(financialOverview?.netProfit?.value || 0)} 
              trend={financialOverview?.netProfit?.trend} 
              status={financialOverview?.netProfit?.status}
              icon={<TrendingUp />}
              color="#1976d2"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard 
              title="Receivables" 
              value={formatCurrency(financialOverview?.outstandingReceivables?.value || 0)} 
              trend={financialOverview?.outstandingReceivables?.trend} 
              status={financialOverview?.outstandingReceivables?.status}
              icon={<Receipt />}
              color="#ed6c02"
              loading={loading}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Budget & Operations Section */}
      <Box sx={{ mb: 4 }}>
         <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Budget & Operations</Typography>
        <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
          <Grid size={{ xs: 12, lg: 8 }}>
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
          <Grid size={{ xs: 12, lg: 4 }}>
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
      </Box>

      {/* Tables Row */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>Top Selling Products</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell component="th" scope="row">
                        <Box>
                          <Typography variant="body2" fontWeight="500">{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.category}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>Recent Sales Orders</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSales.map((row, index) => (
                    <TableRow key={row.id || index}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={row.status} 
                          size="small" 
                          color={row.status === 'Confirmed' ? 'success' : row.status === 'Pending' ? 'warning' : 'default'} 
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      </Box>

      {/* Bottom Row */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AlertsPanel alerts={alerts} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RecentActivity activities={activities} loading={loading} />
        </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
