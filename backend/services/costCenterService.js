/**
 * Cost Center Service
 * 
 * This service manages cost center operations including creation, validation,
 * updating, and deletion. Cost centers are fundamental organizational units
 * used to categorize and track expenses and budgets throughout the system.
 * 
 * Key Features:
 * - Cost center creation with name uniqueness validation
 * - Duplicate name detection and prevention
 * - Cost center updates with conflict checking
 * - Safe deletion with proper error handling
 * - Integration with validation service for consistent validation
 * 
 * Business Rules:
 * - Cost center names must be unique across the system
 * - Names cannot be empty or contain only whitespace
 * - Names have length constraints (1-100 characters)
 * - Description field is optional
 * 
 * Cost centers serve as the foundation for budget allocation and expense
 * tracking, making their integrity crucial for the entire system's operation.
 */
const validationService = require('./validationService');

class CostCenterService {
  // Validates cost center data and returns validation result
  async validateCostCenter(costCenterData, existingCostCenters = [], excludeId = null) {
    // Use validation service for basic validation
    const basicValidation = validationService.validateCostCenter(costCenterData);
    
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        errors: basicValidation.errors.map(e => e.message), // Convert to string array for backward compatibility
        statusCode: 400
      };
    }

    // Check for duplicate names
    if (costCenterData.name) {
      const trimmedName = costCenterData.name.trim().toLowerCase();
      const duplicate = existingCostCenters.find(cc => 
        cc.id !== excludeId && 
        cc.name.toLowerCase() === trimmedName
      );

      if (duplicate) {
        return {
          isValid: false,
          errors: ['Cost center name already exists'],
          statusCode: 409
        };
      }
    }

    return {
      isValid: true,
      errors: []
    };
  }

  // Creates cost center with validation
  async createCostCenter(costCenterData, existingCostCenters = [], saveCostCenter) {
    const validation = await this.validateCostCenter(costCenterData, existingCostCenters);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const costCenter = await saveCostCenter({
        name: costCenterData.name.trim(),
        description: costCenterData.description || ''
      });

      return {
        success: true,
        data: costCenter
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create cost center']
      };
    }
  }

  // Updates cost center with validation
  async updateCostCenter(costCenterId, updateData, existingCostCenters = [], updateCostCenterInDb) {
    if (!costCenterId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Cost center ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    // Validate the update data
    const validation = await this.validateCostCenter(updateData, existingCostCenters, costCenterId);
    
    if (!validation.isValid) {
      const errorResponse = validationService.createValidationErrorResponse(validation.errors);
      return {
        success: false,
        statusCode: validation.statusCode,
        ...errorResponse
      };
    }

    try {
      const updatedCostCenter = await updateCostCenterInDb(costCenterId, {
        name: updateData.name?.trim(),
        description: updateData.description
      });

      if (!updatedCostCenter) {
        const notFoundError = validationService.createNotFoundError('Cost center');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      return {
        success: true,
        data: updatedCostCenter
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to update cost center');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }

  // Deletes cost center with validation
  async deleteCostCenter(costCenterId, deleteCostCenterFromDb) {
    if (!costCenterId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Cost center ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    try {
      const deleted = await deleteCostCenterFromDb(costCenterId);
      
      if (!deleted) {
        const notFoundError = validationService.createNotFoundError('Cost center');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      return {
        success: true,
        message: 'Cost center deleted successfully'
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to delete cost center');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }
}

module.exports = new CostCenterService();