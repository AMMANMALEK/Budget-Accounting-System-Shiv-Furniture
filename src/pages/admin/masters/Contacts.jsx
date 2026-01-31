import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, Chip } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const Contacts = () => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await mastersService.contacts.getAll(page, rowsPerPage, searchTerm);
      setData(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchTerm]);

  // Handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setModalMode('create');
    setSelectedItem(null);
    reset({ name: '', type: 'Customer', email: '', phone: '', status: 'Active' });
    setOpenModal(true);
  };

  const handleEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    // Set form values
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
        await mastersService.contacts.create(formData);
      } else {
        await mastersService.contacts.update(selectedItem.id, formData);
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await mastersService.contacts.delete(selectedItem.id);
      setOpenDelete(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Columns definition
  const columns = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'type', label: 'Type', minWidth: 100, 
      format: (value) => (
        <Chip 
          label={value} 
          size="small" 
          color={value === 'Customer' ? 'primary' : value === 'Vendor' ? 'secondary' : 'default'} 
          variant="outlined"
        />
      )
    },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'phone', label: 'Phone', minWidth: 130 },
    { id: 'status', label: 'Status', minWidth: 100,
      format: (value) => (
        <Chip 
          label={value} 
          size="small" 
          color={value === 'Active' ? 'success' : 'error'} 
        />
      )
    },
  ];

  return (
    <>
      <PageHeader title="Contacts" onAdd={handleAdd} buttonText="Add Contact" />
      
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
        searchPlaceholder="Search contacts..."
      />

      {/* Create/Edit Modal */}
      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={modalMode === 'create' ? 'Add New Contact' : 'Edit Contact'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
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
              select
              label="Type"
              defaultValue="Customer"
              {...register('type', { required: true })}
            >
              <MenuItem value="Customer">Customer</MenuItem>
              <MenuItem value="Vendor">Vendor</MenuItem>
              <MenuItem value="Both">Both</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              {...register('phone', { required: 'Phone is required' })}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />
          </Grid>
        </Grid>
      </ModalForm>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
};

export default Contacts;
