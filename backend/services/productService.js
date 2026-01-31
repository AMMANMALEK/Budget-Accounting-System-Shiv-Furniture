/**
 * Product Service
 * 
 * This service manages product information used throughout the system for
 * categorizing production expenses and tracking product-related costs.
 * Products help organize expenses by what is being produced or sold.
 * 
 * Key Features:
 * - Product creation with required field validation
 * - Product code uniqueness (enforced at application level)
 * - Price validation (cannot be negative)
 * - Product update validation
 * - Data sanitization for names and codes
 * 
 * Business Rules:
 * - Product name is required and cannot be empty
 * - Product code is required and cannot be empty
 * - Price cannot be negative (defaults to 0 if not provided)
 * - Description field is optional
 * 
 * Products are essential for production expense categorization and cost
 * analysis, enabling detailed tracking of expenses by product line.
 */
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