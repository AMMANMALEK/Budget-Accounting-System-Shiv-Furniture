import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import StatusBadge from '../../../components/common/StatusBadge';
import salesService from '../../../services/sales.service';

const Invoices = () => {
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

  const [salesOrders, setSalesOrders] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      invoiceNumber: '',
      soId: '',
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      status: 'Draft'
    }
  });

  // Auto-fill customer and amount when SO is selected
  const selectedSoId = watch('soId');
  useEffect(() => {
    if (selectedSoId) {
      const so = salesOrders.find(s => s.id === selectedSoId);
      if (so) {
        setValue('customerId', so.customerId);
        setValue('customerName', so.customerName);
        setValue('amount', so.totalAmount); // Default to SO total
      }
    }
  }, [selectedSoId, salesOrders, setValue]);

  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await salesService.customerInvoices.getAll(page, rowsPerPage, search);
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
      const soRes = await salesService.salesOrders.getAll(0, 100);
      setSalesOrders(soRes.data);
    } catch (error) {
      console.error('Error loading SOs:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      invoiceNumber: `INV-${Date.now()}`,
      soId: '',
      customerId: '',
      customerName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      status: 'Draft'
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
      await salesService.customerInvoices.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const so = salesOrders.find(s => s.id === formData.soId);
      const payload = {
        ...formData,
        soNumber: so ? so.soNumber : '',
      };

      if (currentId) {
        await salesService.customerInvoices.update(currentId, payload);
      } else {
        await salesService.customerInvoices.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'invoiceNumber', label: 'Invoice #' },
    { id: 'soNumber', label: 'SO #' },
    { id: 'customerName', label: 'Customer' },
    { id: 'date', label: 'Date' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'amount', label: 'Amount', format: (value) => `$${parseFloat(value).toFixed(2)}` },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader 
        title="Customer Invoices" 
        onAdd={handleCreate} 
        addLabel="Create Invoice"
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
        title={currentId ? "Edit Invoice" : "Create Customer Invoice"}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              {...register('invoiceNumber', { required: 'Invoice Number is required' })}
              error={!!errors.invoiceNumber}
              helperText={errors.invoiceNumber?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Sales Order"
              {...register('soId', { required: 'Sales Order is required' })}
              error={!!errors.soId}
              helperText={errors.soId?.message}
            >
              {salesOrders.map((so) => (
                <MenuItem key={so.id} value={so.id}>
                  {so.soNumber} - {so.customerName}
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
              helperText="Auto-filled from Order"
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
              label="Invoice Date"
              InputLabelProps={{ shrink: true }}
              {...register('date', { required: 'Date is required' })}
              error={!!errors.date}
              helperText={errors.date?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              type="date"
              fullWidth
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              {...register('dueDate', { required: 'Due Date is required' })}
              error={!!errors.dueDate}
              helperText={errors.dueDate?.message}
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
              <MenuItem value="Sent">Sent</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        content="Are you sure you want to delete this invoice?"
      />
    </>
  );
};

export default Invoices;
