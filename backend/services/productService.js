class ProductService {
  // Validates product data and returns validation result
  validateProduct(productData) {
    const errors = [];

    // Basic required field validation
    if (!productData.name || productData.name.trim() === '') {
      errors.push('Product name is required');
    }

    if (!productData.code || productData.code.trim() === '') {
      errors.push('Product code is required');
    }

    if (productData.price !== undefined && productData.price < 0) {
      errors.push('Product price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Creates product with validation
  async createProduct(productData, saveProduct) {
    const validation = this.validateProduct(productData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const product = await saveProduct({
        name: productData.name.trim(),
        code: productData.code.trim(),
        price: productData.price || 0,
        description: productData.description || ''
      });

      return {
        success: true,
        data: product
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create product']
      };
    }
  }

  // Validates product update
  validateProductUpdate(productId, updateData) {
    const errors = [];

    if (!productId) {
      errors.push('Product ID is required');
    }

    // Validate fields only if they're being updated
    if (updateData.name !== undefined && (!updateData.name || updateData.name.trim() === '')) {
      errors.push('Product name is required');
    }

    if (updateData.code !== undefined && (!updateData.code || updateData.code.trim() === '')) {
      errors.push('Product code is required');
    }

    if (updateData.price !== undefined && updateData.price < 0) {
      errors.push('Product price cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ProductService();