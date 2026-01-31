import React, { useState, useEffect } from 'react';
import { Box, Chip, TextField, IconButton, Tooltip, InputAdornment } from '@mui/material';
import { Download, Clear } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import portalService from '../../services/portal.service';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterData();
  }, [payments, dateFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await portalService.getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...payments];

    if (dateFilter) {
      result = result.filter(payment => payment.date === dateFilter);
    }

    setFilteredPayments(result);
    setPage(0);
  };

  const handleDownload = (id) => {
    portalService.downloadPaymentReceipt(id);
  };

  const clearDateFilter = () => {
    setDateFilter('');
  };

  const columns = [
    { field: 'number', headerName: 'Payment #', minWidth: 150, flex: 1 },
    { field: 'date', headerName: 'Date', minWidth: 120 },
    { field: 'invoiceRef', headerName: 'Invoice', minWidth: 150, flex: 1 },
    { field: 'method', headerName: 'Method', minWidth: 150 },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      minWidth: 120,
      render: (row) => `$${row.amount.toLocaleString()}`
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      minWidth: 120,
      render: (row) => (
        <Chip 
          label={row.status} 
          color="success" 
          size="small" 
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      )
    }
  ];

  const paginatedData = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader 
        title="Payment History" 
        subtitle="View and download your payment receipts"
      />

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Filter by Date"
          type="date"
          size="small"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: dateFilter && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearDateFilter}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 200 }}
        />
      </Box>

      <DataTable 
        columns={columns} 
        data={paginatedData} 
        loading={loading} 
        totalCount={filteredPayments.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        disableSelection={true}
        renderActions={(row) => (
          <Tooltip title="Download Receipt">
            <IconButton size="small" color="primary" onClick={() => handleDownload(row.number)}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      />
    </Box>
  );
};

export default Payments;
