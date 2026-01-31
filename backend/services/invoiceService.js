/**
 * Invoice Service
 * 
 * This service handles invoice management including creation, validation, updating,
 * posting, and deletion. It implements the draft/posted status workflow where
 * invoices start as drafts and can be posted to make them immutable.
 * 
 * Key Features:
 * - Invoice creation with automatic draft status
 * - Comprehensive validation for all invoice fields
 * - Status-based update restrictions (only draft invoices can be modified)
 * - Invoice posting workflow (draft → posted)
 * - Safe deletion (only draft invoices can be deleted)
 * - Status information utilities for UI display
 * 
 * Business Rules:
 * - New invoices are always created with 'draft' status
 * - Only draft invoices can be updated or deleted
 * - Posted invoices are immutable to maintain accounting integrity
 * - Invoice amounts must be positive numbers
 * - Cost center ID is required for all invoices
 * - Description field has length constraints
 * 
 * The draft/posted workflow ensures financial data integrity while allowing
 * flexibility during the data entry process.
 */
const validationService = require('./validationService');

class InvoiceService {
  // Validates invoice data and returns validation result
  validateInvoice(invoiceData) {
    const validation = validationService.validateInvoice(invoiceData);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors.map(e => e.message), // Convert to string array for backward compatibility
        statusCode: 400
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  // Creates invoice with validation - always sets status to 'draft'
  async createInvoice(invoiceData, saveInvoice) {
    const validation = this.validateInvoice(invoiceData);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    try {
      const invoice = await saveInvoice({
        costCenterId: invoiceData.costCenterId,
        amount: invoiceData.amount,
        description: invoiceData.description?.trim() || '',
        status: 'draft', // New invoices are always created with status = 'draft'
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
        contactId: invoiceData.contactId || null
      });

      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to create invoice']
      };
    }
  }

  // Updates invoice with validation - only draft invoices can be modified
  async updateInvoice(invoiceId, updateData, getInvoiceById, updateInvoiceInDb) {
    if (!invoiceId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Invoice ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    try {
      // Get current invoice to check status
      const currentInvoice = await getInvoiceById(invoiceId);
      
      if (!currentInvoice) {
        const notFoundError = validationService.createNotFoundError('Invoice');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      if (currentInvoice.status === 'posted') {
        const conflictError = validationService.createConflictError('RECORD_IMMUTABLE', 'Posted invoices cannot be modified');
        return {
          success: false,
          statusCode: conflictError.statusCode,
          ...conflictError.response
        };
      }

      // Validate the update data
      const validation = this.validateInvoice({ ...currentInvoice, ...updateData });
      
      if (!validation.isValid) {
        const errorResponse = validationService.createValidationErrorResponse(validation.errors);
        return {
          success: false,
          statusCode: validation.statusCode,
          ...errorResponse
        };
      }

      const updatedInvoice = await updateInvoiceInDb(invoiceId, {
        costCenterId: updateData.costCenterId,
        amount: updateData.amount,
        description: updateData.description?.trim(),
        invoiceDate: updateData.invoiceDate ? new Date(updateData.invoiceDate) : undefined,
        contactId: updateData.contactId
      });

      return {
        success: true,
        data: updatedInvoice
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to update invoice');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }

  // Posts an invoice - changes status from 'draft' to 'posted'
  async postInvoice(invoiceId, getInvoiceById, updateInvoiceStatus) {
    if (!invoiceId) {
      return {
        success: false,
        errors: ['Invoice ID is required']
      };
    }

    try {
      // Get current invoice to validate posting rules
      const invoice = await getInvoiceById(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          errors: ['Invoice not found']
        };
      }

      // Validate post operation
      const postValidation = validationService.validatePostOperation(invoice, 'Invoice');
      
      if (!postValidation.isValid) {
        return {
          success: false,
          errors: [postValidation.message]
        };
      }

      // Change status from 'draft' to 'posted'
      const updatedInvoice = await updateInvoiceStatus(invoiceId, 'posted');

      return {
        success: true,
        data: updatedInvoice
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Failed to post invoice']
      };
    }
  }

  // Deletes an invoice - only draft invoices can be deleted
  async deleteInvoice(invoiceId, getInvoiceById, deleteInvoiceFromDb) {
    if (!invoiceId) {
      const error = validationService.createBadRequestError('REQUIRED_FIELD_MISSING', 'Invoice ID is required');
      return {
        success: false,
        statusCode: error.statusCode,
        ...error.response
      };
    }

    try {
      const invoice = await getInvoiceById(invoiceId);
      
      if (!invoice) {
        const notFoundError = validationService.createNotFoundError('Invoice');
        return {
          success: false,
          statusCode: notFoundError.statusCode,
          ...notFoundError.response
        };
      }

      if (invoice.status === 'posted') {
        const conflictError = validationService.createConflictError('RECORD_IMMUTABLE', 'Posted invoices cannot be deleted');
        return {
          success: false,
          statusCode: conflictError.statusCode,
          ...conflictError.response
        };
      }

      await deleteInvoiceFromDb(invoiceId);

      return {
        success: true,
        message: 'Invoice deleted successfully'
      };
    } catch (error) {
      const serverError = validationService.createInternalServerError('Failed to delete invoice');
      return {
        success: false,
        statusCode: serverError.statusCode,
        ...serverError.response
      };
    }
  }

  // Gets invoice status information
  getInvoiceStatusInfo(status) {
    const statusInfo = {
      draft: {
        canModify: true,
        canPost: true,
        description: 'Invoice is in draft status and can be modified or posted'
      },
      posted: {
        canModify: false,
        canPost: false,
        description: 'Invoice is posted and cannot be modified or posted again'
      }
    };

    return statusInfo[status] || {
      canModify: false,
      canPost: false,
      description: 'Unknown invoice status'
    };
  }
}

module.exports = new InvoiceService();