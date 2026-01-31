import React, { useState, useEffect } from 'react';
import { Grid, Typography, Card, CardContent, Box, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { AccountBalanceWallet, Receipt, ArrowForward, TrendingUp } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/dashboard/KPICard';
import portalService from '../../services/portal.service';

const PortalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await portalService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'error';
      case 'Delivered': return 'success';
      case 'Shipped': return 'info';
      case 'Processing': return 'warning';
      case 'Confirmed': return 'primary';
      case 'Pending': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <PageHeader title="Portal Dashboard" subtitle="Overview of your account activity" />

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <KPICard 
            title="Outstanding Balance" 
            value={(stats && stats.outstandingBalance != null) ? `$${stats.outstandingBalance.toLocaleString()}` : '$0'} 
            loading={loading}
            icon={<AccountBalanceWallet color="error" />}
            color="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          <KPICard 
            title="Open Invoices" 
            value={stats ? stats.openInvoicesCount : '0'} 
            loading={loading}
            icon={<Receipt color="warning" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Spending Trend Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', p: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Spending Trend
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                {loading ? (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Chart...</Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.spendingTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip 
                        formatter={(value) => [`$${value}`, 'Amount']}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders & Payments */}
      <Grid container spacing={4}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Recent Orders</Typography>
                <Button 
                  endIcon={<ArrowForward />} 
                  onClick={() => navigate('/portal/orders')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats?.recentOrders || []).map((order) => (
                      <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/portal/orders')}>
                        <TableCell sx={{ fontWeight: 500 }}>{order.number}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>${(order.total || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={getStatusColor(order.status)} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.recentOrders || stats.recentOrders.length === 0) && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No recent orders</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Recent Payments</Typography>
                <Button 
                  endIcon={<ArrowForward />} 
                  onClick={() => navigate('/portal/payments')}
                  size="small"
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats?.recentPayments || []).map((payment) => (
                      <TableRow key={payment.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/portal/payments')}>
                        <TableCell sx={{ fontWeight: 500 }}>{payment.number}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                          ${(payment.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                      </TableRow>
                    ))}
                    {(!stats?.recentPayments || stats.recentPayments.length === 0) && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No recent payments</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortalDashboard;
