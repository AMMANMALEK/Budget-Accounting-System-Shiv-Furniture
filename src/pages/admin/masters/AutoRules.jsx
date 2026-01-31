import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, Switch, FormControlLabel } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const AutoRules = () => {
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const statusValue = watch('status');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await mastersService.autoRules.getAll(page, rowsPerPage, searchTerm);
      setData(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching auto rules:', error);
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
    reset({ name: '', condition: '', action: '', status: 'Active' });
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
        await mastersService.autoRules.create(formData);
      } else {
        await mastersService.autoRules.update(selectedItem.id, formData);
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving auto rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await mastersService.autoRules.delete(selectedItem.id);
      setOpenDelete(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting auto rule:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Rule Name', minWidth: 170 },
    { id: 'condition', label: 'Condition', minWidth: 200 },
    { id: 'action', label: 'Action', minWidth: 200 },
    { id: 'status', label: 'Status', minWidth: 100,
      format: (value) => (
        <FormControlLabel
          control={<Switch checked={value === 'Active'} size="small" color="primary" />}
          label={value}
          onClick={(e) => e.stopPropagation()} // Prevent row click
          onChange={() => {}} // Read-only in table for now
        />
      )
    },
  ];

  return (
    <>
      <PageHeader title="Automation Rules" onAdd={handleAdd} buttonText="Add Rule" />
      
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
        searchPlaceholder="Search rules..."
      />

      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={modalMode === 'create' ? 'Create Automation Rule' : 'Edit Rule'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rule Name"
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Condition"
              multiline
              rows={2}
              placeholder="e.g. Stock < 10"
              {...register('condition', { required: 'Condition is required' })}
              error={!!errors.condition}
              helperText={errors.condition?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Action"
              multiline
              rows={2}
              placeholder="e.g. Email Procurement"
              {...register('action', { required: 'Action is required' })}
              error={!!errors.action}
              helperText={errors.action?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Status"
              defaultValue="Active"
              {...register('status', { required: true })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Rule"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
};

export default AutoRules;
