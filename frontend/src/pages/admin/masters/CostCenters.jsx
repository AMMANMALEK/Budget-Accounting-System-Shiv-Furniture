import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  TextField, MenuItem, Grid, InputAdornment, Box, Button, Card, 
  CardContent, Typography, Chip 
} from '@mui/material';
import { 
  Add, ArrowBack, Home, Save, Archive, CheckCircle 
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const CostCenters = () => {
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      name: '',
      status: 'Active'
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = statusFilter !== 'All' ? { status: statusFilter } : {};
      const response = await mastersService.costCenters.getAll(page, rowsPerPage, searchTerm, filters);
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
      status: 'Active' 
    });
    setViewMode('form');
  };

  const handleEdit = (item) => {
    setFormMode('edit');
    setSelectedItem(item);
    reset({
      code: item.code || '',
      name: item.name || '',
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
      if (formMode === 'create') {
        await mastersService.costCenters.create(formData);
      } else {
        await mastersService.costCenters.update(selectedItem.id, formData);
      }
      setViewMode('list');
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
    { id: 'name', label: 'Analytic Name', minWidth: 170 },
  ];

  if (viewMode === 'list') {
    return (
      <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
        <PageHeader title="Analytics" onAdd={handleAdd} buttonText="New" />
        
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
          searchPlaceholder="Search analytics..."
          onRowClick={handleEdit}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <ConfirmDialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Analytic"
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
        <Card sx={{ width: '100%', maxWidth: 800, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight="600">
              {formMode === 'create' ? 'New Analytic' : selectedItem?.name}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Code"
                {...register('code', { required: 'Code is required' })}
                error={!!errors.code}
                helperText={errors.code?.message}
              />
              <TextField
                fullWidth
                label="Analytic Name"
                {...register('name', { required: 'Name is required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default CostCenters;
