import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextField, MenuItem, Grid, Typography, Box, InputAdornment } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import StatusBadge from '../../../components/common/StatusBadge';
import FormLineItems from '../../../components/common/FormLineItems';
import salesService from '../../../services/sales.service';
import mastersService from '../../../services/masters.service';

const SalesOrders = () => {
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

  // Dependencies
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const methods = useForm({
    defaultValues: {
      soNumber: '',
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      status: 'Draft',
      items: [],
      taxRate: 10
    }
  });
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = methods;

  // Calculations
  const items = watch('items') || [];
  const taxRate = parseFloat(watch('taxRate')) || 0;
  
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await salesService.salesOrders.getAll(page, rowsPerPage, search);
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
      const [cRes, pRes] = await Promise.all([
        mastersService.contacts.getAll(0, 100), // Filter for customers ideally
        mastersService.products.getAll(0, 100)
      ]);
      setCustomers(cRes.data.filter(c => c.type === 'Customer' || c.type === 'Both'));
      setProducts(pRes.data);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      soNumber: `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      status: 'Draft',
      items: [],
      taxRate: 10
    });
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentId(item.id);
    reset({
      ...item,
      items: item.items || [],
      taxRate: (item.tax / item.subtotal * 100) || 10 // Approximate if not stored
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setDeleteId(item.id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await salesService.salesOrders.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const customer = customers.find(c => c.id === formData.customerId);
      
      const payload = {
        ...formData,
        customerName: customer?.name,
        subtotal,
        tax: taxAmount,
        totalAmount
      };

      if (currentId) {
        await salesService.salesOrders.update(currentId, payload);
      } else {
        await salesService.salesOrders.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'soNumber', label: 'SO Number' },
    { id: 'customerName', label: 'Customer' },
    { id: 'date', label: 'Date' },
    { id: 'totalAmount', label: 'Total', format: (value) => `$${parseFloat(value).toFixed(2)}` },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <PageHeader 
        title="Sales Orders" 
        onAdd={handleCreate} 
        addLabel="Create Order"
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
        title={currentId ? "Edit Sales Order" : "Create Sales Order"}
        onSubmit={handleSubmit(onSubmit)}
        maxWidth="md"
      >
        <FormProvider {...methods}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SO Number"
                {...register('soNumber', { required: 'SO Number is required' })}
                error={!!errors.soNumber}
                helperText={errors.soNumber?.message}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Status"
                {...register('status')}
                defaultValue="Draft"
              >
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Confirmed">Confirmed</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Customer"
                {...register('customerId', { required: 'Customer is required' })}
                error={!!errors.customerId}
                helperText={errors.customerId?.message}
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                fullWidth
                label="Date"
                InputLabelProps={{ shrink: true }}
                {...register('date', { required: 'Date is required' })}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
            </Grid>

            {/* Line Items */}
            <Grid item xs={12}>
              <FormLineItems products={products} />
            </Grid>

            {/* Totals */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2, gap: 1 }}>
                <Typography variant="body1">Subtotal: ${subtotal.toFixed(2)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">Tax (%):</Typography>
                  <TextField 
                    type="number" 
                    size="small" 
                    sx={{ width: 80 }}
                    {...register('taxRate')}
                  />
                  <Typography variant="body1"> = ${taxAmount.toFixed(2)}</Typography>
                </Box>
                <Typography variant="h6">Total: ${totalAmount.toFixed(2)}</Typography>
              </Box>
            </Grid>

          </Grid>
        </FormProvider>
      </ModalForm>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sales Order"
        content="Are you sure you want to delete this order?"
      />
    </Box>
  );
};

export default SalesOrders;
