import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import StatusBadge from '../../../components/common/StatusBadge';
import purchasesService from '../../../services/purchases.service';

const VendorBills = () => {
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

  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      billNumber: '',
      poId: '',
      vendorId: '', // Hidden or Read-only
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      status: 'Open'
    }
  });

  // Auto-fill vendor and amount when PO is selected
  const selectedPoId = watch('poId');
  useEffect(() => {
    if (selectedPoId) {
      const po = purchaseOrders.find(p => p.id === selectedPoId);
      if (po) {
        setValue('vendorId', po.vendorId);
        setValue('vendorName', po.vendorName);
        setValue('amount', po.totalAmount); // Default to PO amount
      }
    }
  }, [selectedPoId, purchaseOrders, setValue]);

  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await purchasesService.vendorBills.getAll(page, rowsPerPage, search);
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
      const poRes = await purchasesService.purchaseOrders.getAll(0, 100);
      setPurchaseOrders(poRes.data);
    } catch (error) {
      console.error('Error loading POs:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      billNumber: '',
      poId: '',
      vendorId: '',
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      status: 'Open'
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
      await purchasesService.vendorBills.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      // Find PO number for display
      const po = purchaseOrders.find(p => p.id === formData.poId);
      const payload = {
        ...formData,
        poNumber: po ? po.poNumber : '',
      };

      if (currentId) {
        await purchasesService.vendorBills.update(currentId, payload);
      } else {
        await purchasesService.vendorBills.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'billNumber', label: 'Bill #' },
    { id: 'poNumber', label: 'PO #' },
    { id: 'vendorName', label: 'Vendor' },
    { id: 'date', label: 'Date' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'amount', label: 'Amount', format: (value) => `$${parseFloat(value).toFixed(2)}` },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <>
      <PageHeader 
        title="Vendor Bills" 
        onAdd={handleCreate} 
        addLabel="Register Bill"
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
        title={currentId ? "Edit Bill" : "Register Vendor Bill"}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Bill Number"
              {...register('billNumber', { required: 'Bill Number is required' })}
              error={!!errors.billNumber}
              helperText={errors.billNumber?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Purchase Order"
              {...register('poId', { required: 'PO is required' })}
              error={!!errors.poId}
              helperText={errors.poId?.message}
            >
              {purchaseOrders.map((po) => (
                <MenuItem key={po.id} value={po.id}>
                  {po.poNumber} - {po.vendorName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor"
              {...register('vendorName')}
              InputProps={{ readOnly: true }}
              helperText="Auto-filled from PO"
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
              label="Bill Date"
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
              defaultValue="Open"
            >
              <MenuItem value="Open">Open</MenuItem>
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
        title="Delete Bill"
        content="Are you sure you want to delete this bill?"
      />
    </>
  );
};

export default VendorBills;
