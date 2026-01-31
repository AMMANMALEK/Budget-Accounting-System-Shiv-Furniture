import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Grid, TextField, MenuItem, Button, Box, InputAdornment, Typography, Chip } from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import StatusBadge from '../../../components/common/StatusBadge';
import productionService from '../../../services/production.service';

const ProductionExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form Setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      category: '',
      description: '',
      costCenterId: '',
      budgetId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      attachment: ''
    }
  });

  const watchAmount = watch('amount');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await productionService.expenses.getAll();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      reset({
        ...item,
        costCenterId: item.costCenterId,
        budgetId: item.budgetId
      });
    } else {
      reset({
        category: '',
        description: '',
        costCenterId: '',
        budgetId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        attachment: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      // Mock processing
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        costCenterName: data.costCenterId === 2 ? 'Manufacturing Plant' : 'Other', // Mock logic
        budgetName: 'FY2025 Q1' // Mock logic
      };

      if (editingItem) {
        await productionService.expenses.update(editingItem.id, payload);
      } else {
        await productionService.expenses.create(payload);
      }
      fetchExpenses();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  // Budget Impact Indicator
  const getBudgetImpactColor = (amount) => {
    const val = parseFloat(amount);
    if (!val) return 'default';
    if (val < 1000) return 'success';
    if (val < 5000) return 'warning';
    return 'error';
  };

  const columns = [
    { id: 'date', label: 'Date', minWidth: 100 },
    { id: 'category', label: 'Category', minWidth: 120 },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'costCenterName', label: 'Cost Center', minWidth: 150 },
    { 
      id: 'amount', 
      label: 'Amount', 
      minWidth: 100,
      format: (value) => `$${value.toFixed(2)}`
    },
    { 
      id: 'status', 
      label: 'Status', 
      minWidth: 100,
      format: (value) => <StatusBadge status={value} />
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',
      format: (_, row) => (
        <Button size="small" onClick={() => handleOpenModal(row)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <Box>
      <PageHeader 
        title="Production Expenses" 
        onAdd={() => handleOpenModal()} 
        addLabel="New Expense" 
      />

      <DataTable 
        columns={columns} 
        data={expenses} 
        loading={loading} 
      />

      <ModalForm
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Expense' : 'New Expense'}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              {...register('date', { required: 'Date is required' })}
              error={!!errors.date}
              helperText={errors.date?.message}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Category"
              fullWidth
              defaultValue=""
              inputProps={register('category', { required: 'Category is required' })}
              error={!!errors.category}
              helperText={errors.category?.message}
            >
              <MenuItem value="Raw Materials">Raw Materials</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Labor">Labor</MenuItem>
              <MenuItem value="Utilities">Utilities</MenuItem>
              <MenuItem value="Logistics">Logistics</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              {...register('description', { required: 'Description is required' })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Cost Center"
              fullWidth
              defaultValue=""
              inputProps={register('costCenterId', { required: 'Cost Center is required' })}
              error={!!errors.costCenterId}
              helperText={errors.costCenterId?.message}
            >
              <MenuItem value={1}>Head Office</MenuItem>
              <MenuItem value={2}>Manufacturing Plant</MenuItem>
              <MenuItem value={3}>Warehouse A</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Budget"
              fullWidth
              defaultValue=""
              inputProps={register('budgetId', { required: 'Budget is required' })}
              error={!!errors.budgetId}
              helperText={errors.budgetId?.message}
            >
              <MenuItem value={1}>FY2025 Q1</MenuItem>
              <MenuItem value={2}>FY2025 Q2</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('amount', { required: 'Amount is required', min: 0 })}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6} display="flex" alignItems="center">
            {watchAmount && (
              <Chip 
                label={`Budget Impact: ${watchAmount > 5000 ? 'High' : watchAmount > 1000 ? 'Medium' : 'Low'}`}
                color={getBudgetImpactColor(watchAmount)}
                variant="outlined"
                sx={{ width: '100%', height: '56px', fontSize: '1rem' }}
              />
            )}
          </Grid>

          <Grid item xs={12}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<AttachFile />}
              fullWidth
              sx={{ height: 56, borderStyle: 'dashed' }}
            >
              Upload Attachment
              <input type="file" hidden {...register('attachment')} />
            </Button>
            {watch('attachment') && (
               <Typography variant="caption" display="block" sx={{ mt: 1, ml: 1 }}>
                 Selected: {watch('attachment')[0]?.name || 'File selected'}
               </Typography>
            )}
          </Grid>
        </Grid>
      </ModalForm>
    </Box>
  );
};

export default ProductionExpenses;
