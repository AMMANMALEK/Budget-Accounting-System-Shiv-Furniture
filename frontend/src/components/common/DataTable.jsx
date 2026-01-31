import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Edit, Delete, Search, FilterList } from '@mui/icons-material';

const DataTable = ({
  columns,
  data,
  loading,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  renderActions,
  searchPlaceholder = "Search...",
  onSearch,
  searchTerm = "",
  statusValue,
  onStatusChange,
  onRowClick,
  disableSelection = false // Legacy prop, ignored but kept for compatibility
}) => {
  const handleChangePage = (event, newPage) => {
    if (onPageChange) onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    if (onRowsPerPageChange) onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  const showActions = onEdit || onDelete || renderActions;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
          {onSearch ? (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          ) : (
            <Box /> 
          )}

          {onStatusChange && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={statusValue || 'All'}
                label="Status"
                onChange={(e) => onStatusChange(e.target.value)}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Archived">Archived</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
        
        {/* Placeholder for future filter implementation or custom toolbar actions */}
        <Tooltip title="Filter list">
          <IconButton>
            <FilterList />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id || column.field}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth, fontWeight: 600, backgroundColor: '#f9fafb' }}
                >
                  {column.label || column.headerName}
                </TableCell>
              ))}
              {showActions && (
                <TableCell align="right" style={{ fontWeight: 600, backgroundColor: '#f9fafb' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    No data found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                return (
                  <TableRow 
                    hover 
                    role="checkbox" 
                    tabIndex={-1} 
                    key={row.id || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id || column.field];
                      return (
                        <TableCell key={column.id || column.field} align={column.align || 'left'}>
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    })}
                    {showActions && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {renderActions ? renderActions(row) : (
                            <>
                              {onEdit && (
                                <Tooltip title="Edit">
                                  <IconButton onClick={() => onEdit(row)} size="small" color="primary">
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {onDelete && (
                                <Tooltip title="Delete">
                                  <IconButton onClick={() => onDelete(row)} size="small" color="error">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;