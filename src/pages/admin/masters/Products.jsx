import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, MenuItem, Grid, InputAdornment } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const Products = () => {
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
      const response = await mastersService.products.getAll(page, rowsPerPage, searchTerm);
      setData(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching products:', error);
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
    reset({ code: '', name: '', category: 'Finished Good', price: '', unit: 'pcs', stock: 0 });
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
        await mastersService.products.create(formData);
      } else {
        await mastersService.products.update(selectedItem.id, formData);
      }
      setOpenModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await mastersService.products.delete(selectedItem.id);
      setOpenDelete(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { id: 'code', label: 'Code', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'category', label: 'Category', minWidth: 130 },
    { id: 'price', label: 'Price', minWidth: 100, 
      format: (value) => `$${parseFloat(value).toFixed(2)}` 
    },
    { id: 'unit', label: 'Unit', minWidth: 80 },
    { id: 'stock', label: 'Stock', minWidth: 100 },
  ];

  return (
    <>
      <PageHeader title="Products" onAdd={handleAdd} buttonText="Add Product" />
      
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
        searchPlaceholder="Search products..."
      />

      <ModalForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
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
              select
              label="Category"
              defaultValue="Finished Good"
              {...register('category', { required: true })}
            >
              <MenuItem value="Raw Material">Raw Material</MenuItem>
              <MenuItem value="Finished Good">Finished Good</MenuItem>
              <MenuItem value="Consumable">Consumable</MenuItem>
              <MenuItem value="Service">Service</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Unit"
              {...register('unit', { required: 'Unit is required' })}
              error={!!errors.unit}
              helperText={errors.unit?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              {...register('price', { required: 'Price is required', min: 0 })}
              error={!!errors.price}
              helperText={errors.price?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Initial Stock"
              type="number"
              {...register('stock', { required: 'Stock is required', min: 0 })}
              error={!!errors.stock}
              helperText={errors.stock?.message}
            />
          </Grid>
        </Grid>
      </ModalForm>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
};

export default Products;
