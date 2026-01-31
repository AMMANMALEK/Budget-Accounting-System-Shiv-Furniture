import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  TextField, MenuItem, Grid, InputAdornment, Box, Button, Card, 
  CardContent, Typography, Autocomplete, Chip, createFilterOptions
} from '@mui/material';
import { 
  Add, ArrowBack, Home, Save, Archive, CheckCircle 
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const filter = createFilterOptions();

const Products = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Category Options State for "Create & Save"
  const [categoryOptions, setCategoryOptions] = useState([
    { title: 'Raw Material' },
    { title: 'Finished Good' },
    { title: 'Consumable' },
    { title: 'Service' }
  ]);

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      category: null,
      price: '',
      purchasePrice: '', // Added field
      unit: 'pcs',
      stock: 0,
      status: 'Active'
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = statusFilter !== 'All' ? { status: statusFilter } : {};
      const response = await mastersService.products.getAll(page, rowsPerPage, searchTerm, filters);
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
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setFormMode('create');
    setSelectedItem(null);
    reset({
      code: '',
      name: '',
      category: { title: 'Finished Good' },
      price: '',
      purchasePrice: '',
      unit: 'pcs',
      stock: 0,
      status: 'Active'
    });
    setViewMode('form');
  };

  const handleEdit = (item) => {
    setFormMode('edit');
    setSelectedItem(item);
    
    // Ensure category is an object for Autocomplete
    let categoryValue = null;
    if (item.category) {
       categoryValue = typeof item.category === 'string' 
        ? { title: item.category } 
        : item.category;
    }

    reset({
      code: item.code || '',
      name: item.name || '',
      category: categoryValue,
      price: item.price || '',
      purchasePrice: item.purchasePrice || '',
      unit: item.unit || 'pcs',
      stock: item.stock || 0,
      status: item.status || 'Active'
    });
    setViewMode('form');
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDelete(true);
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      // Extract string from category object
      const payload = {
        ...formData,
        category: formData.category?.title || formData.category
      };

      if (formMode === 'create') {
        await mastersService.products.create(payload);
      } else {
        await mastersService.products.update(selectedItem.id, payload);
      }
      setViewMode('list');
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

  if (viewMode === 'list') {
    return (
      <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
        <PageHeader title="Products" onAdd={handleAdd} buttonText="New" />
        
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
          onRowClick={handleEdit}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <ConfirmDialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Product"
          message={`Are you sure you want to delete ${selectedItem?.name}?`}
          loading={deleting}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      {/* Top Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 2,
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleAdd}
          >
            New
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircle />}
            onClick={handleSubmit((data) => onSubmit({ ...data, status: 'Active' }))}
          >
            Confirm
          </Button>
          <Button 
            variant="outlined" 
            color="warning" 
            startIcon={<Archive />}
            onClick={handleSubmit((data) => onSubmit({ ...data, status: 'Archived' }))}
          >
            Archived
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<Home />} onClick={handleBack}>Home</Button>
          <Button startIcon={<ArrowBack />} onClick={handleBack}>Back</Button>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 1200, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight="600">
              {formMode === 'create' ? 'New Product' : selectedItem?.name}
            </Typography>
            {watch('status') && (
              <Chip 
                label={watch('status')} 
                color={watch('status') === 'Active' ? 'success' : 'default'} 
                size="small" 
              />
            )}
          </Box>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Left Column */}
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Code"
                        {...register('code', { required: 'Code is required' })}
                        error={!!errors.code}
                        helperText={errors.code?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Product Name"
                        {...register('name', { required: 'Name is required' })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    </Grid>
                  </Grid>

                  <Controller
                    name="category"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        value={value}
                        onChange={(event, newValue) => {
                          if (typeof newValue === 'string') {
                            // created dynamically
                            setCategoryOptions(prev => [...prev, { title: newValue }]);
                            onChange({ title: newValue });
                          } else if (newValue && newValue.inputValue) {
                            // created dynamically via dialog
                            setCategoryOptions(prev => [...prev, { title: newValue.inputValue }]);
                            onChange({ title: newValue.inputValue });
                          } else {
                            onChange(newValue);
                          }
                        }}
                        filterOptions={(options, params) => {
                          const filtered = filter(options, params);
                          const { inputValue } = params;
                          // Suggest the creation of a new value
                          const isExisting = options.some((option) => option.title === inputValue);
                          if (inputValue !== '' && !isExisting) {
                            filtered.push({
                              inputValue,
                              title: `Add "${inputValue}"`,
                            });
                          }
                          return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        options={categoryOptions}
                        getOptionLabel={(option) => {
                          // Value selected with enter, right from the input
                          if (typeof option === 'string') {
                            return option;
                          }
                          // Add "xxx" option created dynamically
                          if (option.inputValue) {
                            return option.inputValue;
                          }
                          // Regular option
                          return option.title;
                        }}
                        renderOption={(props, option) => <li {...props}>{option.title}</li>}
                        freeSolo
                        renderInput={(params) => (
                          <TextField {...params} label="Category" helperText="Type to create new" />
                        )}
                      />
                    )}
                  />

                  <Grid container spacing={2}>
                     <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Unit"
                          {...register('unit', { required: 'Unit is required' })}
                          error={!!errors.unit}
                          helperText={errors.unit?.message}
                        />
                     </Grid>
                     <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Initial Stock"
                          type="number"
                          {...register('stock', { min: 0 })}
                        />
                     </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Right Column - Prices */}
              <Grid item xs={12} md={5}>
                <Box 
                  sx={{ 
                    bgcolor: 'background.default', 
                    p: 3, 
                    borderRadius: 2, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3 
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>Pricing</Typography>
                  <TextField
                    fullWidth
                    label="Sales Price"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    {...register('price', { required: 'Price is required', min: 0 })}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                  />
                  <TextField
                    fullWidth
                    label="Purchase Price"
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    {...register('purchasePrice')}
                    helperText="Cost price"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Products;
