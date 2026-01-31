class RecordImmutabilityService {
  // Validates if a record can be updated based on its status
  validateRecordUpdate(record, recordType = 'record') {
    if (!record) {
      return {
        canUpdate: false,
        statusCode: 404,
        error: `${recordType} not found`
      };
    }

    if (record.status === 'posted') {
      return {
        canUpdate: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      };
    }

    return {
      canUpdate: true,
      statusCode: 200,
      message: `${recordType} can be updated`
    };
  }

  // Validates if a record can be deleted based on its status
  validateRecordDeletion(record, recordType = 'record') {
    if (!record) {
      return {
        canDelete: false,
        statusCode: 404,
        error: `${recordType} not found`
      };
    }

    if (record.status === 'posted') {
      return {
        canDelete: false,
        statusCode: 403,
        error: 'Posted records cannot be modified'
      };
    }

    return {
      canDelete: true,
      statusCode: 200,
      message: `${recordType} can be deleted`
    };
  }

  // Validates invoice update
  async validateInvoiceUpdate(invoiceId, getInvoiceById) {
    try {
      const invoice = await getInvoiceById(invoiceId);
      return this.validateRecordUpdate(invoice, 'Invoice');
    } catch (error) {
      return {
        canUpdate: false,
        statusCode: 500,
        error: 'Failed to retrieve invoice for validation'
      };
    }
  }

  // Validates invoice deletion
  async validateInvoiceDeletion(invoiceId, getInvoiceById) {
    try {
      const invoice = await getInvoiceById(invoiceId);
      return this.validateRecordDeletion(invoice, 'Invoice');
    } catch (error) {
      return {
        canDelete: false,
        statusCode: 500,
        error: 'Failed to retrieve invoice for validation'
      };
    }
  }

  // Validates purchase bill update
  async validatePurchaseBillUpdate(purchaseBillId, getPurchaseBillById) {
    try {
      const purchaseBill = await getPurchaseBillById(purchaseBillId);
      return this.validateRecordUpdate(purchaseBill, 'Purchase bill');
    } catch (error) {
      return {
        canUpdate: false,
        statusCode: 500,
        error: 'Failed to retrieve purchase bill for validation'
      };
    }
  }

  // Validates purchase bill deletion
  async validatePurchaseBillDeletion(purchaseBillId, getPurchaseBillById) {
    try {
      const purchaseBill = await getPurchaseBillById(purchaseBillId);
      return this.validateRecordDeletion(purchaseBill, 'Purchase bill');
    } catch (error) {
      return {
        canDelete: false,
        statusCode: 500,
        error: 'Failed to retrieve purchase bill for validation'
      };
    }
  }

  // Validates production expense update
  async validateProductionExpenseUpdate(productionExpenseId, getProductionExpenseById) {
    try {
      const productionExpense = await getProductionExpenseById(productionExpenseId);
      return this.validateRecordUpdate(productionExpense, 'Production expense');
    } catch (error) {
      return {
        canUpdate: false,
        statusCode: 500,
        error: 'Failed to retrieve production expense for validation'
      };
    }
  }

  // Validates production expense deletion
  async validateProductionExpenseDeletion(productionExpenseId, getProductionExpenseById) {
    try {
      const productionExpense = await getProductionExpenseById(productionExpenseId);
      return this.validateRecordDeletion(productionExpense, 'Production expense');
    } catch (error) {
      return {
        canDelete: false,
        statusCode: 500,
        error: 'Failed to retrieve production expense for validation'
      };
    }
  }

  // Generic validation for any record type
  async validateRecordOperation(recordId, getRecordById, operation = 'update', recordType = 'record') {
    try {
      const record = await getRecordById(recordId);
      
      if (operation === 'delete') {
        return this.validateRecordDeletion(record, recordType);
      } else {
        return this.validateRecordUpdate(record, recordType);
      }
    } catch (error) {
      return {
        canUpdate: false,
        canDelete: false,
        statusCode: 500,
        error: `Failed to retrieve ${recordType.toLowerCase()} for validation`
      };
    }
  }

  // Checks if a record is posted (immutable)
  isRecordPosted(record) {
    return record && record.status === 'posted';
  }

  // Checks if a record is draft (mutable)
  isRecordDraft(record) {
    return record && record.status === 'draft';
  }

  // Gets allowed operations for a record based on its status
  getAllowedOperations(record) {
    if (!record) {
      return {
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canPost: false
      };
    }

    const status = record.status;
    
    switch (status) {
      case 'draft':
        return {
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canPost: true
        };
      case 'posted':
        return {
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canPost: false
        };
      default:
        return {
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canPost: false
        };
    }
  }

  // Creates a standardized error response for immutability violations
  createImmutabilityError(recordType = 'record', operation = 'modify') {
    return {
      success: false,
      statusCode: 403,
      error: 'Posted records cannot be modified',
      details: {
        recordType,
        operation,
        reason: 'Record is in posted status and cannot be modified to maintain accounting integrity'
      }
    };
  }

  // Creates a standardized success response for allowed operations
  createOperationAllowedResponse(recordType = 'record', operation = 'modify') {
    return {
      success: true,
      statusCode: 200,
      message: `${recordType} ${operation} operation is allowed`,
      details: {
        recordType,
        operation,
        reason: 'Record is in draft status and can be modified'
      }
    };
  }

  // Validates bulk operations on multiple records
  async validateBulkOperation(recordIds, getRecordById, operation = 'update', recordType = 'record') {
    const results = [];
    let hasErrors = false;

    for (const recordId of recordIds) {
      const validation = await this.validateRecordOperation(recordId, getRecordById, operation, recordType);
      
      results.push({
        recordId,
        ...validation
      });

      if (!validation.canUpdate && !validation.canDelete) {
        hasErrors = true;
      }
    }

    return {
      success: !hasErrors,
      results,
      summary: {
        total: recordIds.length,
        allowed: results.filter(r => r.canUpdate || r.canDelete).length,
        blocked: results.filter(r => !r.canUpdate && !r.canDelete).length
      }
    };
  }

  // Middleware-style validation function
  async validateOperationMiddleware(recordId, getRecordById, operation, recordType) {
    const validation = await this.validateRecordOperation(recordId, getRecordById, operation, recordType);
    
    if (operation === 'delete' && !validation.canDelete) {
      throw {
        statusCode: validation.statusCode,
        message: validation.error,
        type: 'IMMUTABILITY_VIOLATION'
      };
    }
    
    if (operation === 'update' && !validation.canUpdate) {
      throw {
        statusCode: validation.statusCode,
        message: validation.error,
        type: 'IMMUTABILITY_VIOLATION'
      };
    }

    return validation;
  }
}

module.exports = new RecordImmutabilityService();