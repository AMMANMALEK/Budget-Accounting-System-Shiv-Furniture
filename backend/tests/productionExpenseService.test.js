const productionExpenseService = require('../services/productionExpenseService');

describe('ProductionExpenseService', () => {
  describe('validateProductionExpense', () => {
    test('requires cost center ID', () => {
      const result = productionExpenseService.validateProductionExpense({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
    });

    test('requires production expense amount', () => {
      const result = productionExpenseService.validateProductionExpense({ costCenterId: '123' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense amount is required');
    });

    test('rejects amount <= 0', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: 0,
        description: 'Test production expense'
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense amount must be greater than 0');
    });

    test('rejects negative amount', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: -100,
        description: 'Test production expense'
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense amount must be greater than 0');
    });

    test('requires description', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense description is required');
    });

    test('rejects empty description', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: ''
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense description is required');
    });

    test('rejects whitespace-only description', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: '   '
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense description is required');
    });

    test('accepts valid production expense data', () => {
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense'
      };
      
      const result = productionExpenseService.validateProductionExpense(productionExpenseData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createProductionExpense', () => {
    test('creates production expense with status draft', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456', status: 'draft' });
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense',
        expenseDate: '2024-01-01',
        productId: '789'
      };
      
      const result = await productionExpenseService.createProductionExpense(productionExpenseData, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '456', status: 'draft' });
      expect(mockSave).toHaveBeenCalledWith({
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense',
        status: 'draft', // Always created with draft status
        expenseDate: new Date('2024-01-01'),
        productId: '789'
      });
    });

    test('sets default expense date if not provided', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense'
      };
      
      const beforeCall = new Date();
      await productionExpenseService.createProductionExpense(productionExpenseData, mockSave);
      const afterCall = new Date();
      
      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.expenseDate).toBeInstanceOf(Date);
      expect(savedData.expenseDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(savedData.expenseDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    test('handles missing optional fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense'
      };
      
      await productionExpenseService.createProductionExpense(productionExpenseData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        productId: null
      }));
    });

    test('trims description whitespace', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: '  Test production expense  '
      };
      
      await productionExpenseService.createProductionExpense(productionExpenseData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Test production expense'
      }));
    });

    test('returns validation errors', async () => {
      const result = await productionExpenseService.createProductionExpense({ amount: -100 });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Production expense amount must be greater than 0');
    });

    test('handles save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const productionExpenseData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test production expense'
      };
      
      const result = await productionExpenseService.createProductionExpense(productionExpenseData, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create production expense');
    });
  });

  describe('validateProductionExpenseUpdate', () => {
    test('requires production expense ID', async () => {
      const result = await productionExpenseService.validateProductionExpenseUpdate(null, { amount: 200 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense ID is required');
    });

    test('prevents updating posted production expenses', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { amount: 200 }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Posted production expenses cannot be modified');
    });

    test('allows updating draft production expenses', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { amount: 200 }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('handles production expense not found', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue(null);
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { amount: 200 }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense not found');
    });

    test('validates amount if provided', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { amount: -100 }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense amount must be greater than 0');
    });

    test('validates description if provided', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { description: '' }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Production expense description is required');
    });

    test('handles database errors', async () => {
      const mockGetProductionExpense = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await productionExpenseService.validateProductionExpenseUpdate('123', { amount: 200 }, mockGetProductionExpense);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to retrieve production expense');
    });
  });

  describe('postProductionExpense', () => {
    test('requires production expense ID', async () => {
      const result = await productionExpenseService.postProductionExpense(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Production expense ID is required');
    });

    test('posts draft production expense successfully', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      const mockUpdateStatus = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await productionExpenseService.postProductionExpense('123', mockGetProductionExpense, mockUpdateStatus);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', status: 'posted' });
      expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'posted');
    });

    test('prevents posting non-existent production expense', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue(null);
      
      const result = await productionExpenseService.postProductionExpense('123', mockGetProductionExpense, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Production expense not found');
    });

    test('prevents posting already posted production expense', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await productionExpenseService.postProductionExpense('123', mockGetProductionExpense, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft production expenses can be posted');
    });

    test('prevents posting non-draft production expense', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'cancelled' });
      
      const result = await productionExpenseService.postProductionExpense('123', mockGetProductionExpense, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft production expenses can be posted');
    });

    test('handles database errors', async () => {
      const mockGetProductionExpense = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await productionExpenseService.postProductionExpense('123', mockGetProductionExpense, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to post production expense');
    });
  });

  describe('canPostProductionExpense', () => {
    test('allows posting draft production expense', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await productionExpenseService.canPostProductionExpense('123', mockGetProductionExpense);
      
      expect(result.canPost).toBe(true);
      expect(result.reason).toBe('Production expense can be posted');
    });

    test('prevents posting already posted production expense', async () => {
      const mockGetProductionExpense = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await productionExpenseService.canPostProductionExpense('123', mockGetProductionExpense);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Production expense is already posted');
    });
  });

  describe('getProductionExpenseStatusInfo', () => {
    test('returns correct info for draft status', () => {
      const result = productionExpenseService.getProductionExpenseStatusInfo('draft');
      
      expect(result.canModify).toBe(true);
      expect(result.canPost).toBe(true);
      expect(result.description).toBe('Production expense is in draft status and can be modified or posted');
    });

    test('returns correct info for posted status', () => {
      const result = productionExpenseService.getProductionExpenseStatusInfo('posted');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Production expense is posted and cannot be modified or posted again');
    });

    test('returns default info for unknown status', () => {
      const result = productionExpenseService.getProductionExpenseStatusInfo('unknown');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Unknown production expense status');
    });
  });
});