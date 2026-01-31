import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment, Box } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import purchasesService from '../../../services/purchases.service';

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

  const [bills, setBills] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      paymentNumber: '',
      billId: '',
      vendorId: '',
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Bank Transfer',
      reference: '',
      amount: ''
    }
  });

  // Auto-fill vendor and amount when Bill is selected
  const selectedBillId = watch('billId');
  useEffect(() => {
    if (selectedBillId) {
      const bill = bills.find(b => b.id === selectedBillId);
      if (bill) {
        setValue('vendorId', bill.vendorId);
        setValue('vendorName', bill.vendorName);
        setValue('amount', bill.amount); // Default to full bill amount
      }
    }
  }, [selectedBillId, bills, setValue]);

  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await purchasesService.payments.getAll(page, rowsPerPage, search);
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
      // Only show Open or Overdue bills ideally, but for now show all
      const billRes = await purchasesService.vendorBills.getAll(0, 100);
      setBills(billRes.data);
    } catch (error) {
      console.error('Error loading Bills:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      paymentNumber: `PAY-${Date.now()}`, // Auto-gen
      billId: '',
      vendorId: '',
      vendorName: '',
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
      await purchasesService.payments.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      const bill = bills.find(b => b.id === formData.billId);
      const payload = {
        ...formData,
        billNumber: bill ? bill.billNumber : '',
      };

      if (currentId) {
        await purchasesService.payments.update(currentId, payload);
      } else {
        await purchasesService.payments.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'paymentNumber', label: 'Payment #' },
    { id: 'billNumber', label: 'Bill #' },
    { id: 'vendorName', label: 'Vendor' },
    { id: 'date', label: 'Date' },
    { id: 'method', label: 'Method' },
    { id: 'amount', label: 'Amount', format: (value) => `$${parseFloat(value).toFixed(2)}` },
  ];

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <PageHeader 
        title="Payments" 
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
        title={currentId ? "Edit Payment" : "Record Payment"}
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
              label="Bill"
              {...register('billId', { required: 'Bill is required' })}
              error={!!errors.billId}
              helperText={errors.billId?.message}
            >
              {bills.map((bill) => (
                <MenuItem key={bill.id} value={bill.id}>
                  {bill.billNumber} - {bill.vendorName} (${bill.amount})
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
              helperText="Auto-filled from Bill"
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
