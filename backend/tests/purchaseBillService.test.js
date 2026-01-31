const purchaseBillService = require('../services/purchaseBillService');

describe('PurchaseBillService', () => {
  describe('validatePurchaseBill', () => {
    test('requires cost center ID', () => {
      const result = purchaseBillService.validatePurchaseBill({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
    });

    test('requires purchase bill amount', () => {
      const result = purchaseBillService.validatePurchaseBill({ costCenterId: '123' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill amount is required');
    });

    test('rejects amount <= 0', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: 0,
        description: 'Test purchase bill'
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill amount must be greater than 0');
    });

    test('rejects negative amount', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: -100,
        description: 'Test purchase bill'
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill amount must be greater than 0');
    });

    test('requires description', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill description is required');
    });

    test('rejects empty description', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: ''
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill description is required');
    });

    test('rejects whitespace-only description', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: '   '
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill description is required');
    });

    test('accepts valid purchase bill data', () => {
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill'
      };
      
      const result = purchaseBillService.validatePurchaseBill(purchaseBillData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createPurchaseBill', () => {
    test('creates purchase bill with status draft', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456', status: 'draft' });
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill',
        billDate: '2024-01-01',
        supplierId: '789'
      };
      
      const result = await purchaseBillService.createPurchaseBill(purchaseBillData, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '456', status: 'draft' });
      expect(mockSave).toHaveBeenCalledWith({
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill',
        status: 'draft', // Always created with draft status
        billDate: new Date('2024-01-01'),
        supplierId: '789'
      });
    });

    test('sets default bill date if not provided', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill'
      };
      
      const beforeCall = new Date();
      await purchaseBillService.createPurchaseBill(purchaseBillData, mockSave);
      const afterCall = new Date();
      
      const savedData = mockSave.mock.calls[0][0];
      expect(savedData.billDate).toBeInstanceOf(Date);
      expect(savedData.billDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(savedData.billDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    test('handles missing optional fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill'
      };
      
      await purchaseBillService.createPurchaseBill(purchaseBillData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        supplierId: null
      }));
    });

    test('trims description whitespace', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: '  Test purchase bill  '
      };
      
      await purchaseBillService.createPurchaseBill(purchaseBillData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        description: 'Test purchase bill'
      }));
    });

    test('returns validation errors', async () => {
      const result = await purchaseBillService.createPurchaseBill({ amount: -100 });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Purchase bill amount must be greater than 0');
    });

    test('handles save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const purchaseBillData = {
        costCenterId: '123',
        amount: 100,
        description: 'Test purchase bill'
      };
      
      const result = await purchaseBillService.createPurchaseBill(purchaseBillData, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create purchase bill');
    });
  });

  describe('validatePurchaseBillUpdate', () => {
    test('requires purchase bill ID', async () => {
      const result = await purchaseBillService.validatePurchaseBillUpdate(null, { amount: 200 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill ID is required');
    });

    test('prevents updating posted purchase bills', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { amount: 200 }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Posted purchase bills cannot be modified');
    });

    test('allows updating draft purchase bills', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { amount: 200 }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('handles purchase bill not found', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue(null);
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { amount: 200 }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill not found');
    });

    test('validates amount if provided', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { amount: -100 }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill amount must be greater than 0');
    });

    test('validates description if provided', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { description: '' }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Purchase bill description is required');
    });

    test('handles database errors', async () => {
      const mockGetPurchaseBill = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await purchaseBillService.validatePurchaseBillUpdate('123', { amount: 200 }, mockGetPurchaseBill);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Failed to retrieve purchase bill');
    });
  });

  describe('postPurchaseBill', () => {
    test('requires purchase bill ID', async () => {
      const result = await purchaseBillService.postPurchaseBill(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Purchase bill ID is required');
    });

    test('posts draft purchase bill successfully', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      const mockUpdateStatus = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await purchaseBillService.postPurchaseBill('123', mockGetPurchaseBill, mockUpdateStatus);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', status: 'posted' });
      expect(mockUpdateStatus).toHaveBeenCalledWith('123', 'posted');
    });

    test('prevents posting non-existent purchase bill', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue(null);
      
      const result = await purchaseBillService.postPurchaseBill('123', mockGetPurchaseBill, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Purchase bill not found');
    });

    test('prevents posting already posted purchase bill', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await purchaseBillService.postPurchaseBill('123', mockGetPurchaseBill, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft purchase bills can be posted');
    });

    test('prevents posting non-draft purchase bill', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'cancelled' });
      
      const result = await purchaseBillService.postPurchaseBill('123', mockGetPurchaseBill, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Only draft purchase bills can be posted');
    });

    test('handles database errors', async () => {
      const mockGetPurchaseBill = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await purchaseBillService.postPurchaseBill('123', mockGetPurchaseBill, null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to post purchase bill');
    });
  });

  describe('canPostPurchaseBill', () => {
    test('allows posting draft purchase bill', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'draft' });
      
      const result = await purchaseBillService.canPostPurchaseBill('123', mockGetPurchaseBill);
      
      expect(result.canPost).toBe(true);
      expect(result.reason).toBe('Purchase bill can be posted');
    });

    test('prevents posting already posted purchase bill', async () => {
      const mockGetPurchaseBill = jest.fn().mockResolvedValue({ id: '123', status: 'posted' });
      
      const result = await purchaseBillService.canPostPurchaseBill('123', mockGetPurchaseBill);
      
      expect(result.canPost).toBe(false);
      expect(result.reason).toBe('Purchase bill is already posted');
    });
  });

  describe('getPurchaseBillStatusInfo', () => {
    test('returns correct info for draft status', () => {
      const result = purchaseBillService.getPurchaseBillStatusInfo('draft');
      
      expect(result.canModify).toBe(true);
      expect(result.canPost).toBe(true);
      expect(result.description).toBe('Purchase bill is in draft status and can be modified or posted');
    });

    test('returns correct info for posted status', () => {
      const result = purchaseBillService.getPurchaseBillStatusInfo('posted');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Purchase bill is posted and cannot be modified or posted again');
    });

    test('returns default info for unknown status', () => {
      const result = purchaseBillService.getPurchaseBillStatusInfo('unknown');
      
      expect(result.canModify).toBe(false);
      expect(result.canPost).toBe(false);
      expect(result.description).toBe('Unknown purchase bill status');
    });
  });
});