import React, { useState, useEffect } from 'react';
import { Box, Chip, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import portalService from '../../services/portal.service';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterData();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await portalService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...orders];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.number.toLowerCase().includes(lowerTerm) ||
        order.date.includes(lowerTerm) ||
        order.status.toLowerCase().includes(lowerTerm)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
    setPage(0);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Processing': return 'warning';
      case 'Shipped': return 'info';
      case 'Confirmed': return 'primary';
      case 'Pending': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'number', headerName: 'Order #', minWidth: 150 },
    { field: 'date', headerName: 'Date', minWidth: 120 },
    { 
      field: 'total', 
      headerName: 'Total', 
      minWidth: 120,
      render: (row) => `$${row.total.toLocaleString()}`
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

  const paginatedData = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <PageHeader 
        title="My Orders" 
        subtitle="Track your recent orders"
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
            <MenuItem value="Delivered">Delivered</MenuItem>
            <MenuItem value="Shipped">Shipped</MenuItem>
            <MenuItem value="Processing">Processing</MenuItem>
            <MenuItem value="Confirmed">Confirmed</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <DataTable 
        columns={columns} 
        data={paginatedData} 
        loading={loading} 
        totalCount={filteredOrders.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        searchPlaceholder="Search orders..."
        renderActions={(row) => (
          <Tooltip title="View Details">
            <IconButton size="small" color="primary" onClick={() => handleView(row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      />

      {/* Order Details Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                Order #{selectedOrder.number}
                <Chip 
                  label={selectedOrder.status} 
                  color={getStatusColor(selectedOrder.status)} 
                  size="small" 
                  sx={{ ml: 2, fontWeight: 600 }}
                />
              </Box>
              <IconButton onClick={handleCloseModal} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedOrder.date}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6" color="primary" fontWeight={700}>${selectedOrder.total.toLocaleString()}</Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>Items</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell align="right">{item.qty}</TableCell>
                        <TableCell align="right">${item.price.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${(item.qty * item.price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Orders;
