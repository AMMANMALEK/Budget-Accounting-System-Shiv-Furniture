import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment, Box } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import salesService from '../../../services/sales.service';

const Payments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [invoices, setInvoices] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      paymentNumber: '',
      invoiceId: '',
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: '',
      amount: ''
    }
  });

  // Auto-fill customer and amount when Invoice is selected
  const selectedInvoiceId = watch('invoiceId');
  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(i => i.id === selectedInvoiceId);
      if (invoice) {
        setValue('customerId', invoice.customerId);
        setValue('customerName', invoice.customerName);
        setValue('amount', invoice.amount); // Default to full invoice amount
      }
    }
  }, [selectedInvoiceId, invoices, setValue]);

  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await salesService.customerPayments.getAll(page, rowsPerPage, search);
      setData(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const invRes = await salesService.customerInvoices.getAll(0, 100);
      setInvoices(invRes.data);
    } catch (error) {
      console.error('Error loading Invoices:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      paymentNumber: `REC-${Date.now()}`,
      invoiceId: '',
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: '',
      amount: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentId(item.id);
    reset(item);
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setDeleteId(item.id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await salesService.customerPayments.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const invoice = invoices.find(i => i.id === formData.invoiceId);
      const payload = {
        ...formData,
        invoiceNumber: invoice ? invoice.invoiceNumber : '',
      };

      if (currentId) {
        await salesService.customerPayments.update(currentId, payload);
      } else {
        await salesService.customerPayments.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'paymentNumber', label: 'Payment #' },
    { id: 'invoiceNumber', label: 'Invoice #' },
    { id: 'customerName', label: 'Customer' },
    { id: 'date', label: 'Date' },
    { id: 'method', label: 'Method' },
    { id: 'amount', label: 'Amount', format: (value) => `$${parseFloat(value).toFixed(2)}` },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <PageHeader 
        title="Customer Payments" 
        onAdd={handleCreate} 
        addLabel="Record Payment"
      />
      
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <ModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentId ? "Edit Payment" : "Record Customer Payment"}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Payment Number"
              {...register('paymentNumber', { required: 'Payment Number is required' })}
              error={!!errors.paymentNumber}
              helperText={errors.paymentNumber?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Invoice"
              {...register('invoiceId', { required: 'Invoice is required' })}
              error={!!errors.invoiceId}
              helperText={errors.invoiceId?.message}
            >
              {invoices.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customerName} (${inv.amount})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer"
              {...register('customerName')}
              InputProps={{ readOnly: true }}
              helperText="Auto-filled from Invoice"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('amount', { required: 'Amount is required', min: 0 })}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              fullWidth
              label="Payment Date"
              InputLabelProps={{ shrink: true }}
              {...register('date', { required: 'Date is required' })}
              error={!!errors.date}
              helperText={errors.date?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Payment Method"
              {...register('method', { required: 'Method is required' })}
              error={!!errors.method}
              helperText={errors.method?.message}
              defaultValue="Bank Transfer"
            >
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Check">Check</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reference / Check #"
              {...register('reference')}
            />
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment"
        content="Are you sure you want to delete this payment record?"
      />
    </Box>
  );
};

export default Payments;
