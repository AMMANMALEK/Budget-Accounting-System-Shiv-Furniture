const costCenterService = require('../services/costCenterService');

describe('CostCenterService', () => {
  describe('validateCostCenter', () => {
    test('rejects empty name', async () => {
      const result = await costCenterService.validateCostCenter({ name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center name is required');
    });

    test('rejects whitespace-only name', async () => {
      const result = await costCenterService.validateCostCenter({ name: '   ' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center name is required');
    });

    test('rejects missing name', async () => {
      const result = await costCenterService.validateCostCenter({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center name is required');
    });

    test('rejects duplicate names', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(true);
      
      const result = await costCenterService.validateCostCenter(
        { name: 'Marketing' },
        mockCheckDuplicate
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center name already exists');
      expect(mockCheckDuplicate).toHaveBeenCalledWith('Marketing');
    });

    test('accepts valid unique name', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      
      const result = await costCenterService.validateCostCenter(
        { name: 'Marketing' },
        mockCheckDuplicate
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('trims whitespace from name before duplicate check', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      
      await costCenterService.validateCostCenter(
        { name: '  Marketing  ' },
        mockCheckDuplicate
      );
      
      expect(mockCheckDuplicate).toHaveBeenCalledWith('Marketing');
    });
  });

  describe('createCostCenter', () => {
    test('creates cost center with valid data', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockResolvedValue({ id: '123', name: 'Marketing' });
      
      const result = await costCenterService.createCostCenter(
        { name: 'Marketing', description: 'Marketing department' },
        mockCheckDuplicate,
        mockSave
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', name: 'Marketing' });
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Marketing',
        description: 'Marketing department'
      });
    });

    test('handles missing description', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockResolvedValue({ id: '123', name: 'Marketing' });
      
      await costCenterService.createCostCenter(
        { name: 'Marketing' },
        mockCheckDuplicate,
        mockSave
      );
      
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Marketing',
        description: ''
      });
    });

    test('returns validation errors', async () => {
      const result = await costCenterService.createCostCenter(
        { name: '' },
        null,
        null
      );
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Cost center name is required');
    });

    test('handles save errors', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await costCenterService.createCostCenter(
        { name: 'Marketing' },
        mockCheckDuplicate,
        mockSave
      );
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create cost center');
    });
  });

  describe('validateCostCenterUpdate', () => {
    test('requires cost center ID', async () => {
      const result = await costCenterService.validateCostCenterUpdate(null, { name: 'Marketing' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center ID is required');
    });

    test('validates name if provided', async () => {
      const result = await costCenterService.validateCostCenterUpdate('123', { name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cost center name is required');
    });

    test('skips name validation if not provided', async () => {
      const result = await costCenterService.validateCostCenterUpdate('123', { description: 'Updated' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('checks for duplicates excluding current record', async () => {
      const mockCheckDuplicate = jest.fn().mockResolvedValue(false);
      
      await costCenterService.validateCostCenterUpdate(
        '123',
        { name: 'Marketing' },
        mockCheckDuplicate
      );
      
      expect(mockCheckDuplicate).toHaveBeenCalledWith('Marketing', '123');
    });
  });
});