const productService = require('../services/productService');

describe('ProductService', () => {
  describe('validateProduct', () => {
    test('requires product name', () => {
      const result = productService.validateProduct({});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    test('rejects empty product name', () => {
      const result = productService.validateProduct({ name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    test('rejects whitespace-only product name', () => {
      const result = productService.validateProduct({ name: '   ' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    test('requires product code', () => {
      const result = productService.validateProduct({ name: 'Test Product' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product code is required');
    });

    test('rejects empty product code', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: ''
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product code is required');
    });

    test('rejects whitespace-only product code', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: '   '
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product code is required');
    });

    test('rejects negative price', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: 'TP001',
        price: -10
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product price cannot be negative');
    });

    test('accepts zero price', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: 'TP001',
        price: 0
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts valid product data', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: 'TP001',
        price: 99.99,
        description: 'A test product'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts product without price', () => {
      const result = productService.validateProduct({ 
        name: 'Test Product',
        code: 'TP001'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createProduct', () => {
    test('creates product with valid data', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123', name: 'Test Product' });
      const productData = {
        name: 'Test Product',
        code: 'TP001',
        price: 99.99,
        description: 'A test product'
      };
      
      const result = await productService.createProduct(productData, mockSave);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', name: 'Test Product' });
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Product',
        code: 'TP001',
        price: 99.99,
        description: 'A test product'
      });
    });

    test('trims whitespace from name and code', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123' });
      const productData = {
        name: '  Test Product  ',
        code: '  TP001  '
      };
      
      await productService.createProduct(productData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Product',
        code: 'TP001',
        price: 0,
        description: ''
      });
    });

    test('handles missing optional fields', async () => {
      const mockSave = jest.fn().mockResolvedValue({ id: '123' });
      const productData = {
        name: 'Test Product',
        code: 'TP001'
      };
      
      await productService.createProduct(productData, mockSave);
      
      expect(mockSave).toHaveBeenCalledWith({
        name: 'Test Product',
        code: 'TP001',
        price: 0,
        description: ''
      });
    });

    test('returns validation errors', async () => {
      const result = await productService.createProduct({ name: '' });
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    test('handles save errors', async () => {
      const mockSave = jest.fn().mockRejectedValue(new Error('Database error'));
      const productData = {
        name: 'Test Product',
        code: 'TP001'
      };
      
      const result = await productService.createProduct(productData, mockSave);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create product');
    });
  });

  describe('validateProductUpdate', () => {
    test('requires product ID', () => {
      const result = productService.validateProductUpdate(null, { name: 'Updated Product' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product ID is required');
    });

    test('validates name if provided', () => {
      const result = productService.validateProductUpdate('123', { name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    test('validates code if provided', () => {
      const result = productService.validateProductUpdate('123', { code: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product code is required');
    });

    test('validates price if provided', () => {
      const result = productService.validateProductUpdate('123', { price: -10 });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product price cannot be negative');
    });

    test('skips validation for fields not being updated', () => {
      const result = productService.validateProductUpdate('123', { description: 'Updated description' });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('accepts valid update data', () => {
      const result = productService.validateProductUpdate('123', {
        name: 'Updated Product',
        price: 149.99
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});