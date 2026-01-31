import React, { useState, useEffect } from 'react';
import { Box, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { Download, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import portalService from '../../services/portal.service';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    filterData();
  }, [invoices, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await portalService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...invoices];

    // Search filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(inv => 
        inv.number.toLowerCase().includes(lowerTerm) ||
        inv.date.includes(lowerTerm) ||
        inv.status.toLowerCase().includes(lowerTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    setFilteredInvoices(result);
    setPage(0); // Reset to first page on filter change
  };

  const handleDownload = (e, id) => {
    e.stopPropagation();
    portalService.downloadInvoice(id);
  };

  const handleView = (id) => {
    navigate(`/portal/invoices/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Unpaid': return 'warning';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'number', headerName: 'Invoice #', minWidth: 150 },
    { field: 'date', headerName: 'Date', minWidth: 120 },
    { field: 'dueDate', headerName: 'Due Date', minWidth: 120 },
    { 
      field: 'amount', 
      headerName: 'Total', 
      minWidth: 120,
      render: (row) => `$${row.amount.toLocaleString()}`
    },
    { 
      field: 'paidAmount', 
      headerName: 'Paid', 
      minWidth: 120,
      render: (row) => `$${(row.paidAmount || 0).toLocaleString()}`
    },
    { 
      field: 'balance', 
      headerName: 'Balance', 
      minWidth: 120,
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.balance > 0 ? '#d32f2f' : 'inherit' }}>
          ${(row.balance || 0).toLocaleString()}
        </span>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      minWidth: 120,
      render: (row) => (
        <Chip 
          label={row.status} 
          color={getStatusColor(row.status)} 
          size="small" 
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      )
    }
  ];

  // Pagination Logic
  const paginatedData = filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader 
        title="My Invoices" 
        subtitle="View and manage your invoices"
      />
      
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Unpaid">Unpaid</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <DataTable 
        columns={columns} 
        data={paginatedData} 
        loading={loading} 
        totalCount={filteredInvoices.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        searchPlaceholder="Search invoices..."
        renderActions={(row) => (
          <Box>
            <Tooltip title="View Details">
              <IconButton size="small" color="primary" onClick={() => handleView(row.id)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download PDF">
              <IconButton size="small" color="secondary" onClick={(e) => handleDownload(e, row.id)}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      />
    </Box>
  );
};

export default Invoices;
