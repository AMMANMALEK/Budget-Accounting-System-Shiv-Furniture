/**
 * Access Control Middleware
 * 
 * This middleware module provides fine-grained access control for specific resources
 * and operations. It builds upon the basic authentication middleware to enforce
 * business rules about who can perform what operations on different resource types.
 * 
 * Key Features:
 * - Resource-specific access control (cost centers, budgets, invoices, etc.)
 * - Operation-specific validation (create, read, update, delete, post)
 * - Bulk operation validation with record count limits
 * - Read-only enforcement for portal users
 * - Audit logging for access attempts
 * - Standardized error responses for access violations
 * 
 * The middleware factory pattern allows creating specific middleware for different
 * resource types while maintaining consistent access control logic throughout
 * the application.
 */
const accessControlService = require('../services/accessControlService');
const authService = require('../services/authService');

// Middleware factory for resource-specific access control
const createResourceAccessMiddleware = (resourceType, operation) => {
  return (req, res, next) => {
    const userContext = authService.extractUserContext(req);
    
    try {
      // Enforce access control - throws on denial
      accessControlService.enforceAccess(userContext, operation, resourceType);
      
      // Attach user context for downstream use
      req.userContext = userContext;
      next();
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        error: error.message,
        type: error.type,
        details: error.details
      });
    }
  };
};

// Specific middleware for common operations
const requireCostCenterWrite = createResourceAccessMiddleware('costcenter', 'create');
const requireBudgetWrite = createResourceAccessMiddleware('budget', 'create');
const requireInvoiceWrite = createResourceAccessMiddleware('invoice', 'create');
const requireInvoicePost = createResourceAccessMiddleware('invoice', 'post');
const requirePurchaseBillWrite = createResourceAccessMiddleware('purchasebill', 'create');

module.exports = {
  createResourceAccessMiddleware,
  requireCostCenterWrite,
  requireBudgetWrite,
  requireInvoiceWrite,
  requireInvoicePost,
  requirePurchaseBillWrite
};
const requireProductionExpenseWrite = createResourceAccessMiddleware('productionexpense', 'create');

// Generic middleware for any resource and operation
const requireResourceAccess = (resourceType, operation) => {
  return createResourceAccessMiddleware(resourceType, operation);
};

// Middleware to check if user can modify business data
const requireBusinessDataAccess = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  const validation = accessControlService.requireBusinessDataAccess(userContext);
  
  if (!validation.allowed) {
    return res.status(validation.statusCode).json({
      error: validation.error
    });
  }
  
  req.userContext = userContext;
  next();
};

// Middleware to attach user permissions to request
const attachUserPermissions = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  // Attach permissions summary to request
  req.userPermissions = accessControlService.getUserPermissionsSummary(userContext);
  req.userContext = userContext;
  
  next();
};

// Middleware to validate bulk operations
const requireBulkOperationAccess = (resourceType, operation) => {
  return (req, res, next) => {
    const userContext = authService.extractUserContext(req);
    const recordCount = req.body?.ids?.length || req.body?.records?.length || 1;
    
    const validation = accessControlService.validateBulkOperation(
      userContext, 
      operation, 
      resourceType, 
      recordCount
    );
    
    if (!validation.allowed) {
      return res.status(validation.statusCode).json({
        error: validation.error,
        details: validation.details
      });
    }
    
    req.userContext = userContext;
    next();
  };
};

// Middleware to check read-only access for portal users
const ensureReadOnlyForPortal = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  // Allow all operations for admin users
  if (authService.canAccessAdmin(userContext)) {
    req.userContext = userContext;
    return next();
  }
  
  // For portal users, only allow GET requests
  if (userContext?.role === 'portal' && req.method !== 'GET') {
    return res.status(403).json({
      error: 'Portal users have read-only access',
      details: {
        userRole: 'portal',
        requestMethod: req.method,
        reason: 'Portal users cannot perform write operations'
      }
    });
  }
  
  req.userContext = userContext;
  next();
};

// Middleware to log access attempts for audit purposes
const logAccessAttempt = (resourceType, operation) => {
  return (req, res, next) => {
    const userContext = authService.extractUserContext(req);
    
    // Log access attempt (in production, this would go to a proper logging system)
    console.log(`Access attempt: ${userContext?.email || 'anonymous'} (${userContext?.role || 'unknown'}) attempting ${operation} on ${resourceType}`);
    
    next();
  };
};

module.exports = {
  // Factory functions
  createResourceAccessMiddleware,
  requireResourceAccess,
  requireBulkOperationAccess,
  
  // Specific resource middleware
  requireCostCenterWrite,
  requireBudgetWrite,
  requireInvoiceWrite,
  requireInvoicePost,
  requirePurchaseBillWrite,
  requireProductionExpenseWrite,
  
  // General access middleware
  requireBusinessDataAccess,
  attachUserPermissions,
  ensureReadOnlyForPortal,
  logAccessAttempt
};