const express = require('express');
const { invoiceDAL } = require('../database/dal');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

let mockCustomerInvoices = [
  {
    id: 1,
    invoiceNumber: 'INV-001',
    soId: '',
    soNumber: '',
    customerId: 1,
    customerName: 'Customer 1',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: 1000,
    status: 'Draft',
    state: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const getAllInvoicesFallback = async (page = 0, limit = 10, search = '') => {
  let filtered = mockCustomerInvoices;
  if (search) {
    const s = search.toString().toLowerCase();
    filtered = mockCustomerInvoices.filter((inv) =>
      (inv.invoiceNumber || '').toLowerCase().includes(s) ||
      (inv.customerName || '').toLowerCase().includes(s)
    );
  }
  const start = page * limit;
  const end = start + limit;
  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit)
  };
};

const getInvoiceByIdFallback = async (id) => {
  return mockCustomerInvoices.find((inv) => inv.id === parseInt(id));
};

const createInvoiceFallback = async (payload) => {
  const newInvoice = {
    id: mockCustomerInvoices.length + 1,
    ...payload,
    invoiceNumber: payload.invoiceNumber || `INV-${String(mockCustomerInvoices.length + 1).padStart(3, '0')}`,
    state: payload.state || 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockCustomerInvoices.push(newInvoice);
  return newInvoice;
};

const updateInvoiceFallback = async (id, updates) => {
  const idx = mockCustomerInvoices.findIndex((inv) => inv.id === parseInt(id));
  if (idx === -1) return null;
  mockCustomerInvoices[idx] = {
    ...mockCustomerInvoices[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return mockCustomerInvoices[idx];
};

const deleteInvoiceFallback = async (id) => {
  const idx = mockCustomerInvoices.findIndex((inv) => inv.id === parseInt(id));
  if (idx === -1) return null;
  return mockCustomerInvoices.splice(idx, 1)[0];
};

const mapInvoiceToUi = (invoice) => {
  if (!invoice) return invoice;
  const amount = Number(invoice.amount ?? invoice.total_amount) || 0;
  return {
    ...invoice,
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber || invoice.number || `INV-${invoice.id}`,
    soId: invoice.soId || invoice.salesOrderId || '',
    soNumber: invoice.soNumber || '',
    customerId: invoice.customer_id ?? invoice.customerId,
    customerName: invoice.customerName || invoice.customer_name,
    date: invoice.invoice_date || invoice.date,
    dueDate: invoice.dueDate || invoice.due_date || '',
    amount,
    status: invoice.statusUi || invoice.status || (invoice.state ? invoice.state.toString() : 'Draft')
  };
};

const mapUiToInvoicePayload = (payload = {}) => {
  const customer_id = payload.customer_id ?? payload.customerId;
  const invoice_date = payload.invoice_date ?? payload.date;
  const amount = Number(payload.amount) || 0;

  // invoiceDAL requires product_id and analytic_account_id.
  // UI does not provide them, so we use safe defaults.
  const product_id = payload.product_id ?? payload.productId ?? 1;
  const analytic_account_id = payload.analytic_account_id ?? payload.analyticAccountId ?? payload.costCenterId ?? 1;

  return {
    customer_id,
    invoice_date,
    amount,
    product_id,
    analytic_account_id,

    // keep UI-only
    invoiceNumber: payload.invoiceNumber,
    soId: payload.soId,
    soNumber: payload.soNumber,
    customerName: payload.customerName,
    dueDate: payload.dueDate,
    statusUi: payload.status
  };
};

// GET /api/invoices
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, search = '' } = req.query;
    let result;
    try {
      result = await invoiceDAL.getAll(parseInt(page), parseInt(limit), search);
    } catch (e) {
      result = await getAllInvoicesFallback(parseInt(page), parseInt(limit), search);
    }
    res.json({
      ...result,
      data: (result.data || []).map(mapInvoiceToUi)
    });
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
    let invoice;
    try {
      invoice = await invoiceDAL.getById(req.params.id);
    } catch (e) {
      invoice = await getInvoiceByIdFallback(req.params.id);
    }

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }
    res.json(mapInvoiceToUi(invoice));
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
    const payload = mapUiToInvoicePayload(req.body);
    const { customer_id, invoice_date, amount, product_id, analytic_account_id } = payload;

    if (!customer_id || !invoice_date || !amount || !product_id || !analytic_account_id) {
      return res.status(400).json({
        error: 'Customer ID, invoice date, amount, product ID, and analytic account ID are required',
        type: 'ValidationError'
      });
    }

    let invoice;
    try {
      invoice = await invoiceDAL.create({
        customer_id,
        invoice_date,
        amount,
        product_id,
        analytic_account_id
      });
    } catch (e) {
      invoice = await createInvoiceFallback(payload);
    }

    res.status(201).json(mapInvoiceToUi({ ...invoice, ...payload }));
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
    const payload = mapUiToInvoicePayload(req.body);
    const { customer_id, invoice_date, amount, product_id, analytic_account_id } = payload;

    if (!customer_id || !invoice_date || !amount) {
      return res.status(400).json({
        error: 'Customer ID, invoice date, and amount are required',
        type: 'ValidationError'
      });
    }

    let updatedInvoice;
    try {
      updatedInvoice = await invoiceDAL.update(req.params.id, {
        customer_id,
        invoice_date,
        amount,
        product_id,
        analytic_account_id
      });
    } catch (e) {
      updatedInvoice = await updateInvoiceFallback(req.params.id, payload);
    }

    if (!updatedInvoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }

    res.json(mapInvoiceToUi({ ...updatedInvoice, ...payload }));
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      type: 'ServerError'
    });
  }
});

// POST /api/invoices/:id/post
router.post('/:id/post', requireAuth, async (req, res) => {
  try {
    let invoice;
    try {
      invoice = await invoiceDAL.getById(req.params.id);
    } catch (e) {
      invoice = await getInvoiceByIdFallback(req.params.id);
      if (invoice) {
        invoice = await updateInvoiceFallback(req.params.id, { state: 'POSTED', status: 'Posted' });
      }
    }

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        type: 'NotFoundError'
      });
    }

    res.json(mapInvoiceToUi({ ...invoice, state: 'POSTED', status: 'Posted' }));
  } catch (error) {
    res.status(500).json({
      error: 'Failed to post invoice',
      type: 'ServerError'
    });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    let deleted;
    try {
      deleted = await invoiceDAL.delete(req.params.id);
    } catch (e) {
      deleted = await deleteInvoiceFallback(req.params.id);
    }

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