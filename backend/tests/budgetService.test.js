const budgetService = require('../services/budgetService');

describe('BudgetService', () => {
  describe('validateBudget', () => {
    test('requires all mandatory fields', async () => {
      const result = await budgetService.validateBudget({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
      expect(result.errors).toContain('Start date is required');
      expect(result.errors).toContain('End date is required');
      expect(result.errors).toContain('Planned amount is required');
    });

    test('rejects plannedAmount <= 0', async () => {
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 0
      };
      
      const result = await budgetService.validateBudget(budgetData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Planned amount must be greater than 0');
    });

    test('rejects negative plannedAmount', async () => {
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: -100
      };
      
      const result = await budgetService.validateBudget(budgetData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Planned amount must be greater than 0');
    });

    test('rejects startDate >= endDate', async () => {
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-12-31',
        endDate: '2024-01-01',
        plannedAmount: 1000
      };
      
      const result = await budgetService.validateBudget(budgetData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });

    test('rejects equal start and end dates', async () => {
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        plannedAmount: 1000
      };
      
      const result = await budgetService.validateBudget(budgetData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });

    test('rejects overlapping budgets for same cost center', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(true);
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 1000
      };
      
      const result = await budgetService.validateBudget(budgetData, mockCheckOverlap);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Budget period overlaps with existing budget for this cost center');
      expect(mockCheckOverlap).toHaveBeenCalledWith('123', new Date('2024-01-01'), new Date('2024-12-31'));
    });

    test('accepts valid budget data', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(false);
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 1000
      };
      
      const result = await budgetService.validateBudget(budgetData, mockCheckOverlap);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createBudget', () => {
    test('creates budget with valid data', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockResolvedValue({ id: '456', costCenterId: '123' });
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 1000,
        description: 'Annual budget'
      };
      
      const result = await budgetService.createBudget(budgetData, mockCheckOverlap, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '456', costCenterId: '123' });
      expect(mockSave).toHaveBeenCalledWith({
        costCenterId: '123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        plannedAmount: 1000,
        description: 'Annual budget'
      });
    });

    test('handles missing description', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockResolvedValue({ id: '456' });
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 1000
      };
      
      await budgetService.createBudget(budgetData, mockCheckOverlap, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
        description: ''
      }));
    });

    test('returns validation errors', async () => {
      const result = await budgetService.createBudget({ plannedAmount: -100 });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Planned amount must be greater than 0');
    });

    test('handles save errors', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const budgetData = {
        costCenterId: '123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        plannedAmount: 1000
      };
      
      const result = await budgetService.createBudget(budgetData, mockCheckOverlap, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create budget');
    });
  });

  describe('validateBudgetUpdate', () => {
    test('requires budget ID', async () => {
      const result = await budgetService.validateBudgetUpdate(null, { plannedAmount: 1000 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Budget ID is required');
    });

    test('validates plannedAmount if provided', async () => {
      const result = await budgetService.validateBudgetUpdate('123', { plannedAmount: -100 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Planned amount must be greater than 0');
    });

    test('validates date range if both dates provided', async () => {
      const result = await budgetService.validateBudgetUpdate('123', {
        startDate: '2024-12-31',
        endDate: '2024-01-01'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });

    test('checks overlapping budgets excluding current budget', async () => {
      const mockCheckOverlap = jest.fn().mockResolvedValue(false);
      
      await budgetService.validateBudgetUpdate('123', {
        costCenterId: '456',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }, mockCheckOverlap);
      
      expect(mockCheckOverlap).toHaveBeenCalledWith(
        '456',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        '123'
      );
    });

    test('accepts valid update data', async () => {
      const result = await budgetService.validateBudgetUpdate('123', {
        plannedAmount: 2000,
        description: 'Updated budget'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('dateRangesOverlap', () => {
    test('detects overlapping ranges', () => {
      const start1 = new Date('2024-01-01');
      const end1 = new Date('2024-06-30');
      const start2 = new Date('2024-03-01');
      const end2 = new Date('2024-09-30');
      
      const result = budgetService.dateRangesOverlap(start1, end1, start2, end2);
      
      expect(result).toBe(true);
    });

    test('detects non-overlapping ranges', () => {
      const start1 = new Date('2024-01-01');
      const end1 = new Date('2024-06-30');
      const start2 = new Date('2024-07-01');
      const end2 = new Date('2024-12-31');
      
      const result = budgetService.dateRangesOverlap(start1, end1, start2, end2);
      
      expect(result).toBe(false);
    });

    test('detects adjacent ranges as non-overlapping', () => {
      const start1 = new Date('2024-01-01');
      const end1 = new Date('2024-06-30');
      const start2 = new Date('2024-06-30');
      const end2 = new Date('2024-12-31');
      
      const result = budgetService.dateRangesOverlap(start1, end1, start2, end2);
      
      expect(result).toBe(false);
    });
  });
});