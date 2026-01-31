import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  TextField, Grid, Chip, Box, Button, Card, 
  CardContent, Typography, Autocomplete, IconButton, Tooltip, Divider, Badge
} from '@mui/material';
import { 
  Add, ArrowBack, Home, Archive, CheckCircle, 
  Edit, Delete, Science 
} from '@mui/icons-material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

const AutoRules = () => {
  // State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Options for Dropdowns
  const [options, setOptions] = useState({
    partners: [],
    products: [],
    partnerTags: [],
    productCategories: [],
    analytics: []
  });

  // Delete Dialog State
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form
  const { control, register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      partnerTag: null,
      productCategory: null,
      partner: null,
      product: null,
      analyticAccount: null,
      status: 'Draft' // Draft, Active (Confirmed), Archived (Cancelled)
    }
  });

  const status = watch('status');

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await mastersService.autoRules.getAll(page, rowsPerPage, searchTerm);
      
      // Parse JSON fields for display in list
      const parsedData = (response.data || []).map(item => {
        let conditions = {};
        let actions = {};
        try {
          conditions = typeof item.condition === 'string' && item.condition.startsWith('{') 
            ? JSON.parse(item.condition) 
            : {};
        } catch (e) {}
        
        try {
          actions = typeof item.action === 'string' && item.action.startsWith('{') 
            ? JSON.parse(item.action) 
            : {};
        } catch (e) {}

        // Fallback for status mapping
        let displayStatus = item.status;
        if (item.status === 'Active') displayStatus = 'Confirmed';
        if (item.status === 'Inactive') displayStatus = 'Cancelled';
        
        return {
          ...item,
          // Extract fields from conditions/actions or top-level if available
          partnerTag: conditions.partnerTag || null,
          productCategory: conditions.productCategory || null,
          partner: conditions.partner || null,
          product: conditions.product || null,
          analyticAccount: actions.analyticAccount || item.analytics_to_apply || null,
          status: displayStatus || 'Draft'
        };
      });

      setData(parsedData);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching auto rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Options
  const fetchOptions = async () => {
    try {
      const [contactsRes, productsRes, analyticsRes] = await Promise.all([
        mastersService.contacts.getAll(0, 1000), // Fetch all for dropdowns
        mastersService.products.getAll(0, 1000),
        mastersService.costCenters.getAll(0, 1000)
      ]);

      const contacts = contactsRes.data || [];
      const products = productsRes.data || [];
      const analytics = analyticsRes.data || [];

      // Extract unique tags and categories
      const uniqueTags = [...new Set(contacts.flatMap(c => c.tags || []))].sort();
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

      setOptions({
        partners: contacts,
        products: products,
        partnerTags: uniqueTags,
        productCategories: uniqueCategories,
        analytics: analytics
      });
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [page, rowsPerPage, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setFormMode('create');
    setSelectedItem(null);
    reset({
      name: '',
      partnerTag: null,
      productCategory: null,
      partner: null,
      product: null,
      analyticAccount: null,
      status: 'Draft'
    });
    setViewMode('form');
  };

  const handleEdit = (item) => {
    setFormMode('edit');
    setSelectedItem(item);
    
    reset({
      name: item.name || '',
      partnerTag: item.partnerTag || null,
      productCategory: item.productCategory || null,
      partner: item.partner || null,
      product: item.product || null,
      analyticAccount: item.analyticAccount || null,
      status: item.status || 'Draft'
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
      // Map UI status to backend state
      let backendStatus = 'Draft';
      if (formData.status === 'Confirmed') backendStatus = 'Active';
      if (formData.status === 'Cancelled') backendStatus = 'Inactive';
      if (formData.status === 'Draft') backendStatus = 'Draft'; // If backend supports it

      // Construct payload compatible with backend route
      // We serialize specific fields into 'condition' and 'action' JSON strings
      // to persist them even if backend route drops unknown top-level fields.
      const conditionJson = JSON.stringify({
        partnerTag: formData.partnerTag,
        productCategory: formData.productCategory,
        partner: formData.partner,
        product: formData.product
      });

      const actionJson = JSON.stringify({
        analyticAccount: formData.analyticAccount
      });

      const payload = {
        name: formData.name,
        condition: conditionJson,
        action: actionJson,
        status: backendStatus, // Map to what backend expects
        analytics_to_apply: formData.analyticAccount?.name || 'AUTO', // Fallback
        // We also try to send IDs if backend eventually supports them
        partner_tag_id: formData.partnerTag ? 1 : null, // Mock ID as we use strings for tags currently
      };

      if (formMode === 'create') {
        await mastersService.autoRules.create(payload);
      } else {
        await mastersService.autoRules.update(selectedItem.id, payload);
      }
      setViewMode('list');
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

  // Status Flow Actions
  const handleStatusChange = (newStatus) => {
    setValue('status', newStatus);
    handleSubmit(onSubmit)();
  };

  // Render Functions
  const renderStatusBadge = (value) => {
    let color = 'default';
    if (value === 'Confirmed') color = 'success';
    if (value === 'Cancelled') color = 'error';
    if (value === 'Draft') color = 'primary';
    
    return (
      <Chip 
        label={value} 
        size="small" 
        color={color} 
        variant={value === 'Confirmed' ? 'filled' : 'outlined'}
      />
    );
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

  const columns = [
    { id: 'name', label: 'Rule Name', minWidth: 170 },
    { id: 'partnerTag', label: 'Partner Tag', minWidth: 120, format: (v) => v || '-' },
    { id: 'productCategory', label: 'Product Category', minWidth: 120, format: (v) => v || '-' },
    { id: 'partner', label: 'Partner', minWidth: 150, format: (v) => v?.name || '-' },
    { id: 'product', label: 'Product', minWidth: 150, format: (v) => v?.name || '-' },
    { id: 'analyticAccount', label: 'Analytics to Apply', minWidth: 150, format: (v) => v?.name || '-' },
    { id: 'status', label: 'Status', minWidth: 100, format: renderStatusBadge },
  ];

  if (viewMode === 'list') {
    return (
      <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
        <PageHeader title="Auto Analytical Model" onAdd={handleAdd} buttonText="New" />
        
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
          searchPlaceholder="Search rules..."
          onRowClick={handleEdit}
        />
        
        <ConfirmDialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Rule"
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
            onClick={() => handleStatusChange('Confirmed')}
            disabled={status === 'Confirmed'}
          >
            Confirm
          </Button>
          <Button 
            variant="outlined" 
            color="warning" 
            startIcon={<Archive />}
            onClick={() => handleStatusChange('Cancelled')}
            disabled={status === 'Cancelled'}
          >
            Archived
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Status Flow Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color={status === 'Draft' ? 'primary.main' : 'text.secondary'} fontWeight={status === 'Draft' ? 'bold' : 'normal'}>
              Draft
            </Typography>
            <Typography variant="body2" color="text.secondary">→</Typography>
            <Typography variant="body2" color={status === 'Confirmed' ? 'success.main' : 'text.secondary'} fontWeight={status === 'Confirmed' ? 'bold' : 'normal'}>
              Confirm
            </Typography>
            <Typography variant="body2" color="text.secondary">→</Typography>
            <Typography variant="body2" color={status === 'Cancelled' ? 'error.main' : 'text.secondary'} fontWeight={status === 'Cancelled' ? 'bold' : 'normal'}>
              Cancelled
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button startIcon={<Home />} onClick={handleBack}>Home</Button>
            <Button startIcon={<ArrowBack />} onClick={handleBack}>Back</Button>
          </Box>
        </Box>
      </Box>

      {/* Form Content */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 1000, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight="600">
              {formMode === 'create' ? 'New Analytical Model' : selectedItem?.name}
            </Typography>
            {status && renderStatusBadge(status)}
          </Box>
          
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {/* Name Field - Auto or Manual */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  placeholder="e.g. Office Supplies Rule"
                  {...register('name', { required: 'Rule Name is required' })}
                  helperText="Descriptive name for this rule"
                />
              </Grid>

              {/* Rule Matching Fields Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Science fontSize="small" color="primary" /> Matching Rules (Conditions)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Rule applies if ANY selected field matches a transaction line. More matched fields = higher priority.
                </Typography>
              </Grid>

              {/* Left Column: Tag & Category */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Controller
                    name="partnerTag"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={options.partnerTags}
                        value={value}
                        onChange={(e, newValue) => onChange(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Partner Tag" placeholder="Select Tag" helperText="Matches partner tags (Many-to-one)" />
                        )}
                      />
                    )}
                  />
                  <Controller
                    name="productCategory"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={options.productCategories}
                        value={value}
                        onChange={(e, newValue) => onChange(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Product Category" placeholder="Select Category" helperText="Matches product category (Many-to-one)" />
                        )}
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* Right Column: Partner & Product */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Controller
                    name="partner"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={options.partners}
                        getOptionLabel={(option) => option.name || ''}
                        value={value}
                        onChange={(e, newValue) => onChange(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Partner" placeholder="Select Partner" helperText="Matches specific partner (Many-to-one)" />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                    )}
                  />
                  <Controller
                    name="product"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={options.products}
                        getOptionLabel={(option) => option.name || ''}
                        value={value}
                        onChange={(e, newValue) => onChange(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Product" placeholder="Select Product" helperText="Matches specific product (Many-to-one)" />
                        )}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                      />
                    )}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Auto Apply Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Auto Apply Analytical Model
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="analyticAccount"
                  control={control}
                  rules={{ required: 'Analytic Account is required' }}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Autocomplete
                      options={options.analytics}
                      getOptionLabel={(option) => option.name || ''}
                      value={value}
                      onChange={(e, newValue) => onChange(newValue)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Analytics to Apply" 
                          placeholder="Select Analytic Account" 
                          error={!!error}
                          helperText={error ? error.message : "This analytic account will be automatically assigned"}
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
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

export default AutoRules;