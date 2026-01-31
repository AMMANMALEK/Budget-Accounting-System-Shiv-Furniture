/**
 * Role Validator Utility
 * 
 * This utility module provides role-based validation functions for determining
 * what operations users can perform based on their roles. It works in conjunction
 * with the authentication service to enforce access control policies.
 * 
 * Key Features:
 * - Operation validation based on user role and resource type
 * - Endpoint access validation for different security levels
 * - Role capability enumeration
 * - Write-restricted resource identification
 * - Standardized validation responses
 * 
 * Access Levels:
 * - public: No authentication required
 * - portal: Portal or admin users can access
 * - admin: Only admin users can access
 * 
 * Operation Types:
 * - read: View data
 * - write: Modify data
 * - admin: Administrative operations
 * 
 * This utility is used throughout the application to make consistent
 * authorization decisions and provide clear feedback about access restrictions.
 */
const authService = require('../services/authService');

// Returns allowed/reason object based on user role and operation type
const validateOperation = (userContext, operation, resource) => {
  if (!authService.isAuthenticated(userContext)) {
    return {
      allowed: false,
      reason: 'User not authenticated'
    };
  }

  const userRole = userContext.role;

  // Admin can do everything
  if (userRole === 'admin') {
    return {
      allowed: true,
      reason: 'Admin has full access'
    };
  }

  // Portal user restrictions
  if (userRole === 'portal') {
    // Portal users can read all data
    if (operation === 'read') {
      return {
        allowed: true,
        reason: 'Portal user can read data'
      };
    }

    // Portal users cannot write/modify business or financial data
    if (operation === 'write' && ['budget', 'invoice', 'costcenter'].includes(resource)) {
      return {
        allowed: false,
        reason: 'Portal users cannot modify business or financial data'
      };
    }

    // Portal users cannot perform admin operations
    if (operation === 'admin') {
      return {
        allowed: false,
        reason: 'Portal users cannot perform admin operations'
      };
    }
  }

  return {
    allowed: false,
    reason: 'Operation not allowed for user role'
  };
};

// Returns true if user role can access the specified endpoint type
const canAccessEndpoint = (userContext, endpointType) => {
  switch (endpointType) {
    case 'public':
      return true;
    case 'portal':
      return authService.canAccessPortal(userContext);
    case 'admin':
      return authService.canAccessAdmin(userContext);
    default:
      return false;
  }
};

// Returns array of operations the role can perform
const getAllowedOperations = (role) => {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'admin'];
    case 'portal':
      return ['read'];
    default:
      return [];
  }
};

// Returns array of resources the role cannot write to
const getWriteRestrictedResources = (role) => {
  switch (role) {
    case 'admin':
      return [];
    case 'portal':
      return ['budget', 'invoice', 'costcenter'];
    default:
      return ['budget', 'invoice', 'costcenter', 'user'];
  }
};

module.exports = {
  validateOperation,
  canAccessEndpoint,
  getAllowedOperations,
  getWriteRestrictedResources
};