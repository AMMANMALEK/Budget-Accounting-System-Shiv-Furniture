import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { ArrowBack, Download, Payment } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import portalService from '../../services/portal.service';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await portalService.getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading invoice details...</Box>;
  }

  if (!invoice) {
    return <Box sx={{ p: 3 }}>Invoice not found</Box>;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/portal/invoices')}
        sx={{ mb: 2 }}
      >
        Back to Invoices
      </Button>

      <PageHeader 
        title={`Invoice #${invoice.number}`} 
        subtitle={`Due on ${invoice.dueDate}`}
        action={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<Download />}
              onClick={() => portalService.downloadInvoice(invoice.id)}
            >
              Download PDF
            </Button>
            {invoice.status !== 'Paid' && (
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Payment />}
                onClick={() => alert('Redirecting to payment gateway...')}
              >
                Pay Now
              </Button>
            )}
          </Box>
        }
      />

      <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5" fontWeight={700} color="primary">
              INVOICE
            </Typography>
            <Chip 
              label={invoice.status.toUpperCase()} 
              color={getStatusColor(invoice.status)} 
              sx={{ fontWeight: 700, fontSize: '0.9rem', px: 1 }}
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Addresses */}
          <Grid container spacing={4} mb={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                FROM:
              </Typography>
              <Typography variant="h6" fontWeight={600}>Vendor Inc.</Typography>
              <Typography variant="body2" color="text.secondary">
                456 Supply Chain Blvd<br />
                Metropolis, NY 10012<br />
                Tax ID: US-987654321
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                BILL TO:
              </Typography>
              <Typography variant="h6" fontWeight={600}>Acme Corp</Typography>
              <Typography variant="body2" color="text.secondary">
                123 Business Rd<br />
                Tech City, TC 90210<br />
                Tax ID: US-123456789
              </Typography>
            </Grid>
          </Grid>

          {/* Items Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell align="right"><strong>Qty</strong></TableCell>
                  <TableCell align="right"><strong>Unit Price</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invoice.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product}</TableCell>
                    <TableCell align="right">{item.qty}</TableCell>
                    <TableCell align="right">${(item.price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right"><strong>${(item.total || 0).toFixed(2)}</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Grid container justifyContent="flex-end" spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal:</Typography>
                <Typography fontWeight={600}>${(invoice.amount || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Tax (10%):</Typography>
                <Typography fontWeight={600}>${(invoice.taxes || 0).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Grand Total:</Typography>
                <Typography variant="h6" color="primary">${(invoice.grandTotal || invoice.amount || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Amount Paid:</Typography>
                <Typography color="success.main">-${(invoice.paidAmount || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography fontWeight={700}>Balance Due:</Typography>
                <Typography fontWeight={700} color="error">${(invoice.balance || 0).toFixed(2)}</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Payment History */}
          {invoice.history && invoice.history.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Payment History</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.history.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell align="right">${(payment.amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceDetail;
