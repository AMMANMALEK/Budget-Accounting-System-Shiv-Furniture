import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  TextField, MenuItem, Grid, InputAdornment, Chip, 
  LinearProgress, Box, Typography, Button, IconButton, 
  Tooltip as MuiTooltip, Card, CardContent, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { 
  Add, ArrowBack, Home, Archive, CheckCircle, 
  Edit, Delete, Visibility, PieChart as PieChartIcon,
  RestartAlt, Save
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import mastersService from '../../../services/masters.service';

// Mock Transaction Dialog
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const Budgets = () => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formMode, setFormMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Options
  const [analyticOptions, setAnalyticOptions] = useState([]);

  // Delete Dialog
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Transaction View Dialog
  const [openTransactions, setOpenTransactions] = useState(false);
  const [currentAnalyticLine, setCurrentAnalyticLine] = useState(null);

  // --- MOCK DATA ---
  const MOCK_TRANSACTIONS = [
    { id: 1, date: '2026-01-05', ref: 'INV/2026/001', partner: 'Tech Solutions Inc.', amount: 12000, type: 'Income' },
    { id: 2, date: '2026-01-12', ref: 'BILL/2026/045', partner: 'Office Depot', amount: 450, type: 'Expense' },
    { id: 3, date: '2026-01-15', ref: 'INV/2026/004', partner: 'Global Corp', amount: 8500, type: 'Income' },
    { id: 4, date: '2026-01-20', ref: 'PAY/2026/012', partner: 'Staff Payroll', amount: 25000, type: 'Expense' },
    { id: 5, date: '2026-01-25', ref: 'BILL/2026/055', partner: 'Power Grid Co.', amount: 1200, type: 'Expense' },
  ];

  // --- FORM SETUP ---
  const { control, register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      date_from: '',
      date_to: '',
      status: 'Draft',
      analyticLines: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "analyticLines"
  });

  const status = watch('status');
  const watchedLines = watch('analyticLines');

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await mastersService.budgets.getAll(page, rowsPerPage, searchTerm);
      setData(response.data || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await mastersService.costCenters.getAll(0, 1000); // Fetch all analytics
      setAnalyticOptions(response.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [page, rowsPerPage, searchTerm]);

  // --- HANDLERS ---
  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleAdd = () => {
    setFormMode('create');
    setSelectedItem(null);
    reset({
      name: '',
      date_from: '',
      date_to: '',
      status: 'Draft',
      analyticLines: []
    });
    setViewMode('form');
  };

  const handleEdit = (item) => {
    setFormMode('edit');
    setSelectedItem(item);
    
    // Parse analytic lines if stored as string, or use directly if array
    let lines = item.analyticLines || [];
    if (typeof lines === 'string') {
      try { lines = JSON.parse(lines); } catch (e) { lines = []; }
    }

    reset({
      name: item.name,
      date_from: item.date_from ? item.date_from.split('T')[0] : '',
      date_to: item.date_to ? item.date_to.split('T')[0] : '',
      status: item.status || 'Draft',
      analyticLines: lines
    });
    setViewMode('form');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDelete(true);
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

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      // Calculate totals for top-level fields
      const totalPlanned = formData.analyticLines.reduce((sum, line) => sum + Number(line.budgetedAmount || 0), 0);
      
      // Serialize lines if backend doesn't support relation yet
      const payload = {
        ...formData,
        total_planned_amount: totalPlanned,
        analyticLines: JSON.stringify(formData.analyticLines) // Store as JSON string for now
      };

      if (formMode === 'create') {
        await mastersService.budgets.create(payload);
      } else {
        await mastersService.budgets.update(selectedItem.id, payload);
      }
      setViewMode('list');
      fetchData();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  // Status Flow
  const handleStatusChange = (newStatus) => {
    setValue('status', newStatus);
    handleSubmit(onSubmit)();
  };

  // Revision Logic
  const handleRevise = async () => {
    if (!selectedItem) return;
    
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const originalName = selectedItem.name;
    const revisedName = `${originalName} (Rev ${today})`;

    // 1. Create NEW budget (Draft)
    const newBudgetPayload = {
      ...getValues(),
      name: revisedName,
      status: 'Draft',
      original_budget_id: selectedItem.id // Link to old
    };
    
    // 2. Update OLD budget (Revised)
    const oldBudgetPayload = {
      ...selectedItem,
      status: 'Revised'
    };

    setSaving(true);
    try {
      // Create new first
      const created = await mastersService.budgets.create({
        ...newBudgetPayload,
        analyticLines: JSON.stringify(newBudgetPayload.analyticLines)
      });
      
      // Update old
      await mastersService.budgets.update(selectedItem.id, {
        ...oldBudgetPayload,
        analyticLines: JSON.stringify(oldBudgetPayload.analyticLines)
      });

      // Switch to new budget
      handleEdit(created);
      
    } catch (error) {
      console.error('Revision failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderStatusBadge = (value) => {
    let color = 'default';
    if (value === 'Approved' || value === 'Confirmed') color = 'success';
    if (value === 'Active') color = 'primary';
    if (value === 'Revised') color = 'warning';
    if (value === 'Cancelled' || value === 'Archived') color = 'error';
    
    return (
      <Chip 
        label={value} 
        size="small" 
        color={color} 
        variant={['Confirmed', 'Approved', 'Active'].includes(value) ? 'filled' : 'outlined'}
      />
    );
  };

  // --- LIST VIEW COLUMNS ---
  const columns = [
    { id: 'name', label: 'Budget Name', minWidth: 170 },
    {
      id: 'period', label: 'Period', minWidth: 150,
      format: (_, row) => {
        if (row.date_from && row.date_to) {
          return `${new Date(row.date_from).toLocaleDateString()} - ${new Date(row.date_to).toLocaleDateString()}`;
        }
        return '-';
      }
    },
    { id: 'status', label: 'Status', minWidth: 100, format: renderStatusBadge },
    {
      id: 'chart', label: 'Progress', minWidth: 100,
      format: (_, row) => (
        <MuiTooltip title="View Progress">
           <PieChartIcon color="action" />
        </MuiTooltip>
      )
    }
  ];

  // --- RENDER FORM ---
  if (viewMode === 'form') {
    // Calculate Pie Chart Data
    const totalBudgeted = watchedLines?.reduce((sum, line) => sum + Number(line.budgetedAmount || 0), 0) || 0;
    const totalAchieved = watchedLines?.reduce((sum, line) => sum + Number(line.achievedAmount || 0), 0) || 0;
    const remaining = Math.max(0, totalBudgeted - totalAchieved);

    const pieData = [
      { name: 'Used', value: totalAchieved },
      { name: 'Remaining', value: remaining }
    ];
    const COLORS = ['#0088FE', '#00C49F'];

    return (
      <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
        {/* Header / Actions */}
        <Box sx={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, 
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' 
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {status === 'Draft' && (
              <Button 
                variant="contained" color="primary" startIcon={<Save />} 
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
              >
                Save
              </Button>
            )}
            
            <Button 
              variant="contained" color="success" startIcon={<CheckCircle />}
              onClick={() => handleStatusChange('Confirmed')}
              disabled={status !== 'Draft'}
            >
              Confirm
            </Button>
            <Button 
              variant="contained" color="warning" startIcon={<RestartAlt />}
              onClick={handleRevise}
              disabled={status !== 'Confirmed'}
            >
              Revise
            </Button>
            <Button 
              variant="outlined" color="error" startIcon={<Archive />}
              onClick={() => handleStatusChange('Archived')}
              disabled={['Archived', 'Cancelled', 'Revised'].includes(status)}
            >
              Archive
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Stage Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {['Draft', 'Confirmed', 'Revised', 'Archived'].map((step, index, arr) => (
                <React.Fragment key={step}>
                  <Typography 
                    variant="body2" 
                    color={status === step ? (step === 'Cancelled' ? 'error.main' : 'primary.main') : 'text.secondary'}
                    fontWeight={status === step ? 'bold' : 'normal'}
                  >
                    {step}
                  </Typography>
                  {index < arr.length - 1 && <Typography variant="body2" color="text.secondary">→</Typography>}
                </React.Fragment>
              ))}
            </Box>
            <Divider orientation="vertical" flexItem />
            <Button startIcon={<Home />} onClick={handleBack}>List</Button>
          </Box>
        </Box>

        {/* Form Content */}
        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                     <TextField
                        fullWidth
                        label="Budget Name"
                        placeholder="e.g. Q1 2026 Operational Budget"
                        {...register('name', { required: 'Budget Name is required' })}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={status !== 'Draft'}
                      />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      {...register('date_from', { 
                        required: 'Start Date is required',
                        validate: value => !watch('date_to') || value <= watch('date_to') || 'Start Date must be before End Date'
                      })}
                      error={!!errors.date_from}
                      helperText={errors.date_from?.message}
                      disabled={status !== 'Draft'}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      {...register('date_to', { required: 'End Date is required' })}
                      error={!!errors.date_to}
                      helperText={errors.date_to?.message}
                      disabled={status !== 'Draft'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Analytic Lines */}
            <Card sx={{ borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Analytic Lines</Typography>
                {status === 'Draft' && (
                  <Button startIcon={<Add />} onClick={() => append({ analyticId: '', type: 'Expense', budgetedAmount: 0, achievedAmount: 0 })}>
                    Add Line
                  </Button>
                )}
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Analytic Account</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Budgeted</TableCell>
                      <TableCell align="right">Achieved</TableCell>
                      <TableCell align="right">Achieved %</TableCell>
                      <TableCell align="right">To Achieve</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => {
                      const budgeted = Number(watch(`analyticLines.${index}.budgetedAmount`) || 0);
                      const achieved = Number(watch(`analyticLines.${index}.achievedAmount`) || 0); 
                      const percentage = budgeted > 0 ? ((achieved / budgeted) * 100).toFixed(1) : '0.0';
                      const toAchieve = budgeted - achieved;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                             <Controller
                                name={`analyticLines.${index}.analyticId`}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => (
                                  <TextField 
                                    {...field} select fullWidth size="small"
                                    variant="standard"
                                    disabled={status !== 'Draft'}
                                  >
                                    {analyticOptions.map(opt => (
                                      <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                          </TableCell>
                          <TableCell>
                             <Controller
                                name={`analyticLines.${index}.type`}
                                control={control}
                                render={({ field }) => (
                                  <TextField {...field} select fullWidth size="small" variant="standard" disabled={status !== 'Draft'}>
                                    <MenuItem value="Income">Income</MenuItem>
                                    <MenuItem value="Expense">Expense</MenuItem>
                                  </TextField>
                                )}
                              />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              variant="standard"
                              inputProps={{ style: { textAlign: 'right' } }}
                              {...register(`analyticLines.${index}.budgetedAmount`, { min: 0 })}
                              disabled={status !== 'Draft'}
                            />
                          </TableCell>
                          <TableCell align="right">
                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                               <TextField
                                  type="number"
                                  size="small"
                                  variant="standard"
                                  inputProps={{ style: { textAlign: 'right' } }}
                                  {...register(`analyticLines.${index}.achievedAmount`)}
                                  disabled={status !== 'Draft'} // Or should this be always editable?
                                />
                               <IconButton size="small" onClick={() => { setCurrentAnalyticLine(index); setOpenTransactions(true); }}>
                                 <Visibility fontSize="small" />
                               </IconButton>
                             </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(Number(percentage), 100)} 
                                sx={{ width: 50, height: 6, borderRadius: 1 }} 
                                color={Number(percentage) > 100 ? 'error' : 'primary'}
                              />
                              <Typography variant="caption">{percentage}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color={toAchieve < 0 ? 'error' : 'text.primary'}>
                              {toAchieve.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {status === 'Draft' && (
                              <IconButton size="small" color="error" onClick={() => remove(index)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No analytic lines added</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Right Sidebar - KPI & Charts */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Budget Overview</Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Pie Chart */}
                <Box sx={{ height: 250, width: '100%', display: 'flex', justifyContent: 'center' }}>
                   {totalBudgeted > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                   ) : (
                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                       <Typography variant="body2" color="text.secondary">No data</Typography>
                     </Box>
                   )}
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Budgeted</Typography>
                    <Typography variant="h6" fontWeight="bold">${totalBudgeted.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Achieved</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">${totalAchieved.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                     <Typography variant="subtitle2" color="text.secondary">Utilization</Typography>
                     <Typography variant="h6" color={totalAchieved > totalBudgeted ? 'error' : 'success'}>
                       {totalBudgeted > 0 ? ((totalAchieved / totalBudgeted) * 100).toFixed(1) : 0}%
                     </Typography>
                  </Box>
                </Box>

              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Transaction View Dialog (Mock) */}
        <Dialog open={openTransactions} onClose={() => setOpenTransactions(false)} maxWidth="md" fullWidth>
          <DialogTitle>Transactions for Analytic Account</DialogTitle>
          <DialogContent>
             <Typography variant="body2" color="text.secondary" paragraph>
               Transactions matching this analytic account within the budget period.
             </Typography>
             <DataTable 
               columns={[
                 { id: 'date', label: 'Date', minWidth: 100 },
                 { id: 'ref', label: 'Reference', minWidth: 150 },
                 { id: 'partner', label: 'Partner', minWidth: 150 },
                 { id: 'type', label: 'Type', minWidth: 100 },
                 { id: 'amount', label: 'Amount', minWidth: 100, format: (v) => `$${v.toLocaleString()}` }
               ]}
               data={MOCK_TRANSACTIONS} 
               totalCount={MOCK_TRANSACTIONS.length}
               rowsPerPage={5}
               page={0}
               searchPlaceholder="Search transactions..."
             />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTransactions(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // --- RENDER LIST ---
  return (
    <Box>
      <PageHeader 
        title="Budgets" 
        onAdd={handleAdd}
        buttonText="New Budget"
      />

      <DataTable 
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearch={handleSearch}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRowClick={handleEdit}
        searchPlaceholder="Search budgets..."
      />

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Budget"
        message={`Are you sure you want to delete ${selectedItem?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </Box>
  );
};

export default Budgets;