import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Grid, InputAdornment } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const CostCenters = () => {
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
      const response = await mastersService.costCenters.getAll(page, rowsPerPage, searchTerm);
      setData(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
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
    reset({ code: '', name: '', manager: '', department: '', budget: '' });
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
        await mastersService.costCenters.create(formData);
      } else {
        await mastersService.costCenters.update(selectedItem.id, formData);
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving cost center:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await mastersService.costCenters.delete(selectedItem.id);
      setOpenDelete(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting cost center:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'code', label: 'Code', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'manager', label: 'Manager', minWidth: 150 },
    { id: 'department', label: 'Department', minWidth: 150 },
    { id: 'budget', label: 'Budget', minWidth: 130, 
      format: (value) => `$${parseInt(value).toLocaleString()}` 
    },
  ];

  return (
    <>
      <PageHeader title="Cost Centers" onAdd={handleAdd} buttonText="Add Cost Center" />
      
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
        searchPlaceholder="Search cost centers..."
      />

      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={modalMode === 'create' ? 'Add New Cost Center' : 'Edit Cost Center'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Code"
              {...register('code', { required: 'Code is required' })}
              error={!!errors.code}
              helperText={errors.code?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manager"
              {...register('manager', { required: 'Manager is required' })}
              error={!!errors.manager}
              helperText={errors.manager?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              {...register('department', { required: 'Department is required' })}
              error={!!errors.department}
              helperText={errors.department?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Budget Allocation"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('budget', { required: 'Budget is required', min: 0 })}
              error={!!errors.budget}
              helperText={errors.budget?.message}
            />
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Cost Center"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
};

export default CostCenters;
