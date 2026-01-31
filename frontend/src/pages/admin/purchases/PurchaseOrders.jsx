import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { TextField, MenuItem, Grid, Typography, Box, Paper, Alert } from '@mui/material';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ModalForm from '../../../components/common/ModalForm';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import StatusBadge from '../../../components/common/StatusBadge';
import FormLineItems from '../../../components/common/FormLineItems';
import purchasesService from '../../../services/purchases.service';
import mastersService from '../../../services/masters.service';

const PurchaseOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form dependencies
  const [vendors, setVendors] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [products, setProducts] = useState([]);
  
  // React Hook Form
  const methods = useForm({
    defaultValues: {
      poNumber: '',
      vendorId: '',
      costCenterId: '',
      budgetId: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      status: 'Draft',
      items: []
    }
  });
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = methods;

  // Watch for budget calculations
  const selectedBudgetId = watch('budgetId');
  const items = watch('items') || [];
  
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const selectedBudget = budgets.find(b => b.id === selectedBudgetId);
  
  // Load initial data
  useEffect(() => {
    fetchData();
    loadDependencies();
  }, [page, rowsPerPage, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await purchasesService.purchaseOrders.getAll(page, rowsPerPage, search);
      setData(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      // Parallel loading of dependencies
      const [vRes, ccRes, bRes, pRes] = await Promise.all([
        mastersService.contacts.getAll(0, 100), // Get all vendors (simplified)
        mastersService.costCenters.getAll(0, 100),
        mastersService.budgets.getAll(0, 100),
        mastersService.products.getAll(0, 100)
      ]);
      
      setVendors(vRes.data.filter(c => c.type === 'Vendor' || c.type === 'Both'));
      setCostCenters(ccRes.data);
      setBudgets(bRes.data);
      setProducts(pRes.data);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    }
  };

  const handleCreate = () => {
    setCurrentId(null);
    reset({
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, // Auto-gen mock
      vendorId: '',
      costCenterId: '',
      budgetId: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      status: 'Draft',
      items: []
    });
    setModalOpen(true);
  };

  const handleEdit = async (item) => {
    setCurrentId(item.id);
    reset({
      ...item,
      items: item.items || [] 
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setDeleteId(item.id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await purchasesService.purchaseOrders.delete(deleteId);
      setConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const onSubmit = async (formData) => {
    try {
      // Enrich data with names for the mock display
      const vendor = vendors.find(v => v.id === formData.vendorId);
      const costCenter = costCenters.find(c => c.id === formData.costCenterId);
      const budget = budgets.find(b => b.id === formData.budgetId);
      
      const payload = {
        ...formData,
        vendorName: vendor?.name,
        costCenterName: costCenter?.name,
        budgetName: budget?.name,
        totalAmount
      };

      if (currentId) {
        await purchasesService.purchaseOrders.update(currentId, payload);
      } else {
        await purchasesService.purchaseOrders.create(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const columns = [
    { id: 'poNumber', label: 'PO Number' },
    { id: 'vendorName', label: 'Vendor' },
    { id: 'costCenterName', label: 'Cost Center' },
    { id: 'date', label: 'Date' },
    { id: 'totalAmount', label: 'Total', format: (value) => `$${parseFloat(value).toFixed(2)}` },
    { id: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  // Budget Impact Calculation
  const getBudgetImpact = () => {
    if (!selectedBudget) return null;
    
    const remaining = selectedBudget.amount - selectedBudget.allocated;
    const impact = remaining - totalAmount;
    
    let severity = 'success';
    let message = `Budget Remaining: $${remaining.toFixed(2)} | After PO: $${impact.toFixed(2)}`;
    
    if (impact < 0) {
      severity = 'error';
      message = `Budget Exceeded! Over by $${Math.abs(impact).toFixed(2)}`;
    } else if (impact < (selectedBudget.amount * 0.1)) {
      severity = 'warning';
      message = `Low Budget Warning! Remaining after PO: $${impact.toFixed(2)}`;
    }

    return <Alert severity={severity} sx={{ mt: 2 }}>{message}</Alert>;
  };

  return (
    <>
      <PageHeader 
        title="Purchase Orders" 
        onAdd={handleCreate} 
        addLabel="Create PO"
      />
      
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <ModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentId ? "Edit Purchase Order" : "Create Purchase Order"}
        onSubmit={handleSubmit(onSubmit)}
        maxWidth="md"
      >
        <FormProvider {...methods}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PO Number"
                {...register('poNumber', { required: 'PO Number is required' })}
                error={!!errors.poNumber}
                helperText={errors.poNumber?.message}
                InputProps={{ readOnly: true }} // Auto-generated
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Status"
                {...register('status')}
                defaultValue="Draft"
              >
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Issued">Issued</MenuItem>
                <MenuItem value="Received">Received</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Vendor"
                {...register('vendorId', { required: 'Vendor is required' })}
                error={!!errors.vendorId}
                helperText={errors.vendorId?.message}
              >
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                fullWidth
                label="Date"
                InputLabelProps={{ shrink: true }}
                {...register('date', { required: 'Date is required' })}
                error={!!errors.date}
                helperText={errors.date?.message}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Cost Center"
                {...register('costCenterId', { required: 'Cost Center is required' })}
                error={!!errors.costCenterId}
                helperText={errors.costCenterId?.message}
              >
                {costCenters.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Budget"
                {...register('budgetId', { required: 'Budget is required' })}
                error={!!errors.budgetId}
                helperText={errors.budgetId?.message}
              >
                {budgets.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} (${b.amount - b.allocated} remaining)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Line Items */}
            <Grid item xs={12}>
              <FormLineItems products={products} />
            </Grid>

            {/* Totals & Budget Warning */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2 }}>
                <Typography variant="h6">Total: ${totalAmount.toFixed(2)}</Typography>
                <Box sx={{ width: '100%' }}>
                  {getBudgetImpact()}
                </Box>
              </Box>
            </Grid>

          </Grid>
        </FormProvider>
      </ModalForm>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        content="Are you sure you want to delete this PO? This action cannot be undone."
      />
    </>
  );
};

export default PurchaseOrders;
