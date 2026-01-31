const authService = require('./authService');

class AccessControlService {
  // Validates if user can perform operation on resource type
  validateAccess(userContext, operation, resourceType) {
    if (!authService.isAuthenticated(userContext)) {
      return {
        allowed: false,
        statusCode: 401,
        error: 'Authentication required'
      };
    }

    const userRole = userContext.role;

    // Admin users have full access to everything
    if (userRole === 'admin') {
      return {
        allowed: true,
        statusCode: 200,
        message: `Admin access granted for ${operation} on ${resourceType}`
      };
    }

    // Portal users have restricted access
    if (userRole === 'portal') {
      return this._validatePortalAccess(operation, resourceType);
    }

    // Unknown role
    return {
      allowed: false,
      statusCode: 403,
      error: 'Invalid user role'
    };
  }

  // Portal user access validation logic
  _validatePortalAccess(operation, resourceType) {
    // Portal users can read all data
    if (operation === 'read' || operation === 'view' || operation === 'list') {
      return {
        allowed: true,
        statusCode: 200,
        message: `Portal user can ${operation} ${resourceType}`
      };
    }

    // Portal users cannot modify business data
    const businessResources = [
      'costcenter', 'budget', 'invoice', 'purchasebill', 'productionexpense',
      'product', 'contact', 'analytics'
    ];

    if (businessResources.includes(resourceType.toLowerCase())) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Portal users cannot modify business data'
      };
    }

    // Portal users cannot perform admin operations
    if (operation === 'admin' || operation === 'configure') {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Portal users cannot perform admin operations'
      };
    }

    // Default deny for unknown operations
    return {
      allowed: false,
      statusCode: 403,
      error: `Portal users cannot perform ${operation} on ${resourceType}`
    };
  }

  // Validates cost center operations
  validateCostCenterAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'costcenter');
  }

  // Validates budget operations
  validateBudgetAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'budget');
  }

  // Validates invoice operations
  validateInvoiceAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'invoice');
  }

  // Validates purchase bill operations
  validatePurchaseBillAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'purchasebill');
  }

  // Validates production expense operations
  validateProductionExpenseAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'productionexpense');
  }

  // Validates product operations
  validateProductAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'product');
  }

  // Validates contact operations
  validateContactAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'contact');
  }

  // Validates analytics operations
  validateAnalyticsAccess(userContext, operation) {
    return this.validateAccess(userContext, operation, 'analytics');
  }

  // Validates dashboard access
  validateDashboardAccess(userContext, operation = 'read') {
    return this.validateAccess(userContext, operation, 'dashboard');
  }

  // Validates report access
  validateReportAccess(userContext, operation = 'read') {
    return this.validateAccess(userContext, operation, 'report');
  }

  // Validates if user can create new records
  canCreate(userContext, resourceType) {
    const validation = this.validateAccess(userContext, 'create', resourceType);
    return validation.allowed;
  }

  // Validates if user can update existing records
  canUpdate(userContext, resourceType) {
    const validation = this.validateAccess(userContext, 'update', resourceType);
    return validation.allowed;
  }

  // Validates if user can delete records
  canDelete(userContext, resourceType) {
    const validation = this.validateAccess(userContext, 'delete', resourceType);
    return validation.allowed;
  }

  // Validates if user can post/publish records
  canPost(userContext, resourceType) {
    const validation = this.validateAccess(userContext, 'post', resourceType);
    return validation.allowed;
  }

  // Validates if user can read records
  canRead(userContext, resourceType) {
    const validation = this.validateAccess(userContext, 'read', resourceType);
    return validation.allowed;
  }

  // Returns comprehensive permissions for a resource type
  getResourcePermissions(userContext, resourceType) {
    return {
      canRead: this.canRead(userContext, resourceType),
      canCreate: this.canCreate(userContext, resourceType),
      canUpdate: this.canUpdate(userContext, resourceType),
      canDelete: this.canDelete(userContext, resourceType),
      canPost: this.canPost(userContext, resourceType)
    };
  }

  // Validates bulk operations
  validateBulkOperation(userContext, operation, resourceType, recordCount = 1) {
    const validation = this.validateAccess(userContext, operation, resourceType);
    
    if (!validation.allowed) {
      return {
        ...validation,
        details: {
          operation,
          resourceType,
          recordCount,
          reason: 'Access denied for bulk operation'
        }
      };
    }

    return {
      ...validation,
      details: {
        operation,
        resourceType,
        recordCount,
        reason: 'Bulk operation allowed'
      }
    };
  }

  // Middleware-style access control that throws on denial
  enforceAccess(userContext, operation, resourceType) {
    const validation = this.validateAccess(userContext, operation, resourceType);
    
    if (!validation.allowed) {
      const error = new Error(validation.error);
      error.statusCode = validation.statusCode;
      error.type = 'ACCESS_DENIED';
      error.details = {
        operation,
        resourceType,
        userRole: userContext?.role || 'unknown'
      };
      throw error;
    }

    return validation;
  }

  // Creates standardized access denied response
  createAccessDeniedResponse(operation, resourceType, userRole = 'unknown') {
    return {
      success: false,
      statusCode: 403,
      error: 'Access denied',
      details: {
        operation,
        resourceType,
        userRole,
        reason: 'Insufficient permissions for requested operation'
      }
    };
  }

  // Creates standardized access granted response
  createAccessGrantedResponse(operation, resourceType, userRole) {
    return {
      success: true,
      statusCode: 200,
      message: 'Access granted',
      details: {
        operation,
        resourceType,
        userRole,
        reason: 'User has sufficient permissions'
      }
    };
  }

  // Validates admin-only operations
  requireAdminAccess(userContext, operation = 'admin') {
    if (!authService.canAccessAdmin(userContext)) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Admin access required'
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      message: `Admin access granted for ${operation}`
    };
  }

  // Validates portal access (portal or admin)
  requirePortalAccess(userContext, operation = 'read') {
    if (!authService.canAccessPortal(userContext)) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Portal access required'
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      message: `Portal access granted for ${operation}`
    };
  }

  // Validates business data modification access (admin only)
  requireBusinessDataAccess(userContext, operation = 'modify') {
    if (!authService.canModifyBusinessData(userContext)) {
      return {
        allowed: false,
        statusCode: 403,
        error: 'Insufficient permissions to modify business data'
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      message: `Business data access granted for ${operation}`
    };
  }

  // Returns user's effective permissions summary
  getUserPermissionsSummary(userContext) {
    if (!authService.isAuthenticated(userContext)) {
      return {
        authenticated: false,
        role: null,
        permissions: {
          canAccessAdmin: false,
          canAccessPortal: false,
          canModifyBusinessData: false,
          allowedOperations: []
        }
      };
    }

    const role = userContext.role;
    
    return {
      authenticated: true,
      role,
      permissions: {
        canAccessAdmin: authService.canAccessAdmin(userContext),
        canAccessPortal: authService.canAccessPortal(userContext),
        canModifyBusinessData: authService.canModifyBusinessData(userContext),
        allowedOperations: this._getAllowedOperations(role)
      }
    };
  }

  // Returns allowed operations for a role
  _getAllowedOperations(role) {
    switch (role) {
      case 'admin':
        return ['read', 'create', 'update', 'delete', 'post', 'admin'];
      case 'portal':
        return ['read'];
      default:
        return [];
    }
  }
}

module.exports = new AccessControlService();