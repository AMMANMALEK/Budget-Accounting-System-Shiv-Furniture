import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  TextField, MenuItem, Grid, Chip, Box, Button, Card, 
  CardContent, Typography, Autocomplete, Avatar, IconButton, Tooltip 
} from '@mui/material';
import { 
  Add, ArrowBack, Home, CloudUpload, Save, Archive, 
  CheckCircle, Cancel, Edit, Delete 
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const Contacts = () => {
  // State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Form State
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Delete Dialog State
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      tags: [],
      status: 'Active',
      type: 'Customer'
    }
  });

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = statusFilter !== 'All' ? { status: statusFilter } : {};
      const response = await mastersService.contacts.getAll(page, rowsPerPage, searchTerm, filters);
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
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setFormMode('create');
    setSelectedItem(null);
    setImagePreview(null);
    reset({
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      tags: [],
      status: 'Active',
      type: 'Customer'
    });
    setViewMode('form');
  };

  const handleEdit = async (item) => {
    setFormMode('edit');
    setSelectedItem(item);
    // Show what we have immediately
    reset({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      street: item.street || item.address || '',
      city: item.city || '',
      state: item.state || '',
      country: item.country || '',
      pincode: item.pincode || '',
      tags: item.tags || [],
      status: item.status || 'Active',
      type: item.type || 'Customer'
    });
    setImagePreview(item.image || null);
    setViewMode('form');

    // Fetch full details
    try {
      const fullDetails = await mastersService.contacts.getById(item.id);
      setSelectedItem(fullDetails);
      reset({
        name: fullDetails.name || '',
        email: fullDetails.email || '',
        phone: fullDetails.phone || '',
        street: fullDetails.street || fullDetails.address || '',
        city: fullDetails.city || '',
        state: fullDetails.state || '',
        country: fullDetails.country || '',
        pincode: fullDetails.pincode || '',
        tags: fullDetails.tags || [],
        status: fullDetails.status || 'Active',
        type: fullDetails.type || 'Customer'
      });
      setImagePreview(fullDetails.image || null);
    } catch (error) {
      console.error('Error fetching contact details:', error);
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDelete(true);
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const renderActions = (row) => (
    <>
      <Tooltip title="Edit">
        <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(row); }} size="small" color="primary">
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }} size="small" color="error">
          <Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      if (formMode === 'create') {
        await mastersService.contacts.create(formData);
      } else {
        await mastersService.contacts.update(selectedItem.id, formData);
      }
      setViewMode('list');
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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Columns definition
  const columns = [
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'email', label: 'Email', minWidth: 170 },
    { id: 'phone', label: 'Phone', minWidth: 130 },
    { id: 'status', label: 'Status', minWidth: 100,
      format: (value) => (
        <Chip 
          label={value} 
          size="small" 
          color={value === 'Active' ? 'success' : 'default'} 
          variant={value === 'Active' ? 'filled' : 'outlined'}
        />
      )
    },
  ];

  if (viewMode === 'list') {
    return (
      <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
        <PageHeader title="Contacts" onAdd={handleAdd} buttonText="New" />
        
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
          renderActions={renderActions}
          searchPlaceholder="Search contacts..."
          onRowClick={handleEdit}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
        />
        
        <ConfirmDialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Contact"
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
              {formMode === 'create' ? 'New Contact' : selectedItem?.name}
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
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    {...register('name', { required: 'Name is required' })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    {...register('email', { 
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      }
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message || "Unique email"}
                  />
                  <TextField
                    fullWidth
                    label="Phone"
                    type="number"
                    {...register('phone')}
                    helperText="Number only"
                  />
                  
                  {/* Type Field - Kept but not explicitly requested in Figma layout, putting here as it was in original */}
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label="Type" fullWidth>
                        <MenuItem value="Customer">Customer</MenuItem>
                        <MenuItem value="Vendor">Vendor</MenuItem>
                        <MenuItem value="Both">Both</MenuItem>
                      </TextField>
                    )}
                  />
                </Box>
              </Grid>

              {/* Middle Column - Address */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Address Details</Typography>
                  <TextField fullWidth label="Street" {...register('street')} size="small" />
                  <TextField fullWidth label="City" {...register('city')} size="small" />
                  <TextField fullWidth label="State" {...register('state')} size="small" />
                  <TextField fullWidth label="Country" {...register('country')} size="small" />
                  <TextField fullWidth label="Pincode" {...register('pincode')} size="small" />
                </Box>
              </Grid>

              {/* Right Column - Image */}
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    border: '2px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 250
                  }}
                >
                  {imagePreview ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} 
                      />
                      <IconButton 
                        size="small" 
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.paper' }}
                        onClick={() => setImagePreview(null)}
                      >
                        <Cancel />
                      </IconButton>
                    </Box>
                  ) : (
                    <>
                      <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Upload Image
                      </Typography>
                      <Button component="label" size="small">
                        Choose File
                        <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>

              {/* Bottom - Tags */}
              <Grid item xs={12}>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={value || []}
                      onChange={(e, newValue) => onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Tags" 
                          placeholder="Add tags..." 
                          helperText="Press Enter to add tags"
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Contacts;