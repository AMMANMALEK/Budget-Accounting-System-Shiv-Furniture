import React, { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, TextField, MenuItem, Button, Paper, Typography, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const FormLineItems = ({ name = 'items', products = [] }) => {
  const { control, register, watch, setValue, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });

  // Watch all items to calculate totals
  const items = watch(name);

  // Update line totals when quantity or price changes
  useEffect(() => {
    items.forEach((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = (quantity * unitPrice).toFixed(2);
      if (item.total !== total) {
        setValue(`${name}.${index}.total`, total);
      }
    });
  }, [JSON.stringify(items), setValue, name]);

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`${name}.${index}.productName`, product.name);
      setValue(`${name}.${index}.unitPrice`, product.price);
      // Reset total
      const quantity = parseFloat(items[index].quantity) || 0;
      setValue(`${name}.${index}.total`, (quantity * product.price).toFixed(2));
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Items</Typography>
        <Button 
          startIcon={<AddIcon />} 
          variant="outlined" 
          size="small"
          onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 })}
        >
          Add Item
        </Button>
      </Box>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="30%">Product</TableCell>
              <TableCell width="15%">Quantity</TableCell>
              <TableCell width="20%">Unit Price</TableCell>
              <TableCell width="20%">Total</TableCell>
              <TableCell width="5%"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    {...register(`${name}.${index}.productId`, { required: true })}
                    defaultValue={field.productId}
                    error={!!errors[name]?.[index]?.productId}
                    onChange={(e) => {
                      register(`${name}.${index}.productId`).onChange(e);
                      handleProductChange(index, e.target.value);
                    }}
                  >
                    {products.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name} ({option.code})
                      </MenuItem>
                    ))}
                  </TextField>
                  <input type="hidden" {...register(`${name}.${index}.productName`)} />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 1 }}
                    {...register(`${name}.${index}.quantity`, { required: true, min: 1 })}
                    error={!!errors[name]?.[index]?.quantity}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, step: "0.01" }}
                    {...register(`${name}.${index}.unitPrice`, { required: true, min: 0 })}
                    error={!!errors[name]?.[index]?.unitPrice}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    {...register(`${name}.${index}.total`)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => remove(index)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No items added. Click "Add Item" to start.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FormLineItems;
