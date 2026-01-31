const invoiceService = require('../services/invoiceService');

describe('InvoiceService', () => {
  describe('validateInvoice', () => {
    test('requires cost center ID', () => {
      const result = invoiceService.validateInvoice({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
    });

    test('requires invoice amount', () => {
      const result = invoiceService.validateInvoice({ costCenterId: '123' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice amount is required');
    });

    test('rejects amount <= 0', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: 0,
        description: 'Test invoice'
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice amount must be greater than 0');
    });

    test('rejects negative amount', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: -100,
        description: 'Test invoice'
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice amount must be greater than 0');
    });

    test('requires description', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: 100
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice description is required');
    });

    test('rejects empty description', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: ''
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice description is required');
    });

    test('rejects whitespace-only description', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: '   '
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice description is required');
    });

    test('accepts valid invoice data', () => {
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice'
      };
      
      const result = invoiceService.validateInvoice(invoiceData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createInvoice', () => {
    test('creates invoice with status draft', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456', status: 'draft' });
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice',
        invoiceDate: '2024-01-01',
        contactId: '789'
      };
      
      const result = await invoiceService.createInvoice(invoiceData, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '456', status: 'draft' });
      expect(mockSave).toHaveBeenCalledWith({
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice',
        status: 'draft', // Always created with draft status
        invoiceDate: new Date('2024-01-01'),
        contactId: '789'
      });
    });

    test('sets default invoice date if not provided', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice'
      };
      
      const beforeCall = new Date();
      await invoiceService.createInvoice(invoiceData, mockSave);
      const afterCall = new Date();
      
      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.invoiceDate).toBeInstanceOf(Date);
      expect(savedData.invoiceDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(savedData.invoiceDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    test('handles missing optional fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice'
      };
      
      await invoiceService.createInvoice(invoiceData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        contactId: null
      }));
    });

    test('trims description whitespace', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: '  Test invoice  '
      };
      
      await invoiceService.createInvoice(invoiceData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Test invoice'
      }));
    });

    test('returns validation errors', async () => {
      const result = await invoiceService.createInvoice({ amount: -100 });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invoice amount must be greater than 0');
    });

    test('handles save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const invoiceData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test invoice'
      };
      
      const result = await invoiceService.createInvoice(invoiceData, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create invoice');
    });
  });

  describe('validateInvoiceUpdate', () => {
    test('requires invoice ID', async () => {
      const result = await invoiceService.validateInvoiceUpdate(null, { amount: 200 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice ID is required');
    });

    test('prevents updating posted invoices', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await invoiceService.validateInvoiceUpdate('123', { amount: 200 }, mockGetInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Posted invoices cannot be modified');
    });

    test('allows updating draft invoices', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await invoiceService.validateInvoiceUpdate('123', { amount: 200 }, mockGetInvoice);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('handles invoice not found', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue(null);
      
      const result = await invoiceService.validateInvoiceUpdate('123', { amount: 200 }, mockGetInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice not found');
    });

    test('validates amount if provided', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await invoiceService.validateInvoiceUpdate('123', { amount: -100 }, mockGetInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice amount must be greater than 0');
    });

    test('validates description if provided', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await invoiceService.validateInvoiceUpdate('123', { description: '' }, mockGetInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invoice description is required');
    });

    test('skips validation for fields not being updated', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await invoiceService.validateInvoiceUpdate('123', { contactId: '789' }, mockGetInvoice);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('handles database errors', async () => {
      const mockGetInvoice = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await invoiceService.validateInvoiceUpdate('123', { amount: 200 }, mockGetInvoice);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to retrieve invoice');
    });
  });

  describe('postInvoice', () => {
    test('requires invoice ID', async () => {
      const result = await invoiceService.postInvoice(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invoice ID is required');
    });

    test('posts draft invoice successfully', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      const mockUpdateStatus = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, mockUpdateStatus);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', status: 'posted' });
      expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'posted');
    });

    test('prevents posting non-existent invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue(null);
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invoice not found');
    });

    test('prevents posting already posted invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft invoices can be posted');
    });

    test('prevents posting non-draft invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'cancelled' });
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft invoices can be posted');
    });

    test('handles database errors during retrieval', async () => {
      const mockGetInvoice = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to post invoice');
    });

    test('handles database errors during update', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      const mockUpdateStatus = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await invoiceService.postInvoice('123', mockGetInvoice, mockUpdateStatus);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to post invoice');
    });
  });

  describe('canPostInvoice', () => {
    test('requires invoice ID', async () => {
      const result = await invoiceService.canPostInvoice(null);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Invoice ID is required');
    });

    test('allows posting draft invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await invoiceService.canPostInvoice('123', mockGetInvoice);
      
      expect(result.canPost).toBe(true);
      expect(result.reason).toBe('Invoice can be posted');
    });

    test('prevents posting non-existent invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue(null);
      
      const result = await invoiceService.canPostInvoice('123', mockGetInvoice);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Invoice not found');
    });

    test('prevents posting already posted invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await invoiceService.canPostInvoice('123', mockGetInvoice);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Invoice is already posted');
    });

    test('prevents posting non-draft invoice', async () => {
      const mockGetInvoice = jest.fn().mockResolvedValue({ id: '123', status: 'cancelled' });
      
      const result = await invoiceService.canPostInvoice('123', mockGetInvoice);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Only draft invoices can be posted');
    });

    test('handles database errors', async () => {
      const mockGetInvoice = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await invoiceService.canPostInvoice('123', mockGetInvoice);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Failed to check invoice status');
    });
  });

  describe('getInvoiceStatusInfo', () => {
    test('returns correct info for draft status', () => {
      const result = invoiceService.getInvoiceStatusInfo('draft');
      
      expect(result.canModify).toBe(true);
      expect(result.canPost).toBe(true);
      expect(result.description).toBe('Invoice is in draft status and can be modified or posted');
    });

    test('returns correct info for posted status', () => {
      const result = invoiceService.getInvoiceStatusInfo('posted');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Invoice is posted and cannot be modified or posted again');
    });

    test('returns default info for unknown status', () => {
      const result = invoiceService.getInvoiceStatusInfo('unknown');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Unknown invoice status');
    });
  });
});