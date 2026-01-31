/**
 * Authentication Middleware
 * 
 * This middleware module provides authentication and authorization checks for API endpoints.
 * It works in conjunction with authService to validate user sessions and enforce role-based
 * access control throughout the application.
 * 
 * Key Functions:
 * - requireAuth: Ensures user is authenticated before accessing protected routes
 * - requireAdmin: Restricts access to admin-only endpoints
 * - requirePortalAccess: Allows both portal and admin users to access endpoints
 * - requireBusinessDataAccess: Restricts business data modification to admin users only
 * - attachUserContext: Optionally attaches user context without blocking access
 * 
 * Usage: Apply these middleware functions to Express routes to enforce authentication
 * and authorization policies. Each middleware attaches userContext to the request
 * object for downstream use.
 */
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

// Extract user context from JWT token
const extractUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
};

// Returns 401 if user not authenticated, otherwise continues with userContext attached
const requireAuth = (req, res, next) => {
  const userContext = extractUserFromToken(req);
  
  if (!userContext || !authService.isAuthenticated(userContext)) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }
  
  // Attach user context to request for downstream use
  req.userContext = userContext;
  next();
};

// Returns 403 if user is not admin, otherwise continues
const requireAdmin = (req, res, next) => {
  const userContext = extractUserFromToken(req);
  
  if (!userContext || !authService.canAccessAdmin(userContext)) {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Returns 403 if user lacks portal access (needs portal or admin role)
const requirePortalAccess = (req, res, next) => {
  const userContext = extractUserFromToken(req);
  
  if (!userContext || !authService.canAccessPortal(userContext)) {
    return res.status(403).json({
      error: 'Portal access required'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Returns 403 if user cannot modify business data (admin only)
const requireBusinessDataAccess = (req, res, next) => {
  const userContext = extractUserFromToken(req);
  
  if (!userContext || !authService.canModifyBusinessData(userContext)) {
    return res.status(403).json({
      error: 'Admin access required for business data modification'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Optionally attaches user context without blocking access
const attachUserContext = (req, res, next) => {
  const userContext = extractUserFromToken(req);
  req.userContext = userContext;
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePortalAccess,
  requireBusinessDataAccess,
  attachUserContext
};