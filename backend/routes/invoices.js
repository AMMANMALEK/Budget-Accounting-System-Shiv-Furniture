const express = require('express');
const { invoiceDAL } = require('../database/dal');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/invoices
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    const result = await invoiceDAL.getAll(parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      type: 'ServerError'
    });
  }
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const invoice = await invoiceDAL.getById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      type: 'ServerError'
    });
  }
});

// POST /api/invoices
router.post('/', requireAuth, async (req, res) => {
  try {
    const { customer_id, invoice_date, amount, product_id, analytic_account_id } = req.body;
    
    if (!customer_id || !invoice_date || !amount || !product_id || !analytic_account_id) {
      return res.status(400).json({
        error: 'Customer ID, invoice date, amount, product ID, and analytic account ID are required',
        type: 'ValidationError'
      });
    }

    const invoice = await invoiceDAL.create({
      customer_id,
      invoice_date,
      amount,
      product_id,
      analytic_account_id
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      type: 'ServerError'
    });
  }
});

// PUT /api/invoices/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { customer_id, invoice_date, amount, product_id, analytic_account_id } = req.body;
    
    if (!customer_id || !invoice_date || !amount) {
      return res.status(400).json({
        error: 'Customer ID, invoice date, and amount are required',
        type: 'ValidationError'
      });
    }

    const updatedInvoice = await invoiceDAL.update(req.params.id, {
      customer_id,
      invoice_date,
      amount,
      product_id,
      analytic_account_id
    });
    
    if (!updatedInvoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      type: 'ServerError'
    });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await invoiceDAL.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      error: 'Failed to delete invoice',
      type: 'ServerError'
    });
  }
});

module.exports = router;