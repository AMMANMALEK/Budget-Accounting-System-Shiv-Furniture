import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment, Chip, LinearProgress, Box, Typography } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const Budgets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await mastersService.budgets.getAll(page, rowsPerPage, searchTerm);
      setData(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setModalMode('create');
    setSelectedItem(null);
    reset({ name: '', period: '', amount: '', allocated: 0, status: 'Draft' });
    setOpenModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    Object.keys(item).forEach(key => setValue(key, item[key]));
    setOpenModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDelete(true);
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await mastersService.budgets.create(formData);
      } else {
        await mastersService.budgets.update(selectedItem.id, formData);
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await mastersService.budgets.delete(selectedItem.id);
      setOpenDelete(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Budget Name', minWidth: 170 },
    { id: 'period', label: 'Period', minWidth: 130 },
    { id: 'amount', label: 'Total Amount', minWidth: 130, 
      format: (value) => `$${parseInt(value).toLocaleString()}` 
    },
    { id: 'allocated', label: 'Utilization', minWidth: 200,
      format: (value, row) => {
        const percentage = Math.min((value / row.amount) * 100, 100);
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">${value.toLocaleString()}</Typography>
              <Typography variant="caption">{percentage.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={percentage} color={percentage > 90 ? "error" : "primary"} />
          </Box>
        );
      }
    },
    { id: 'status', label: 'Status', minWidth: 100,
      format: (value) => (
        <Chip 
          label={value} 
          size="small" 
          color={value === 'Approved' ? 'success' : value === 'Active' ? 'primary' : 'default'} 
        />
      )
    },
  ];

  return (
    <>
      <PageHeader title="Budgets" onAdd={handleAdd} buttonText="Create Budget" />
      
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        searchPlaceholder="Search budgets..."
      />

      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={modalMode === 'create' ? 'Create New Budget' : 'Edit Budget'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Budget Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Period"
              placeholder="e.g. Q1 2025"
              {...register('period', { required: 'Period is required' })}
              error={!!errors.period}
              helperText={errors.period?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              defaultValue="Draft"
              {...register('status', { required: true })}
            >
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Pending">Pending Approval</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Amount"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('amount', { required: 'Amount is required', min: 0 })}
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Allocated (Initial)"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('allocated', { min: 0 })}
              error={!!errors.allocated}
              helperText={errors.allocated?.message}
            />
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
};

export default Budgets;
