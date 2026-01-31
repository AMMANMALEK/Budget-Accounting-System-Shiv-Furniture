const authService = require('../services/authService');

// Returns 401 if user not authenticated, otherwise continues with userContext attached
const requireAuth = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  if (!authService.isAuthenticated(userContext)) {
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
  const userContext = authService.extractUserContext(req);
  
  if (!authService.canAccessAdmin(userContext)) {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Returns 403 if user lacks portal access (needs portal or admin role)
const requirePortalAccess = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  if (!authService.canAccessPortal(userContext)) {
    return res.status(403).json({
      error: 'Portal access required'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Returns 403 if user cannot modify business data (only admin allowed)
const requireBusinessDataAccess = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
  
  if (!authService.canModifyBusinessData(userContext)) {
    return res.status(403).json({
      error: 'Insufficient permissions to modify business data'
    });
  }
  
  req.userContext = userContext;
  next();
};

// Attaches userContext to request without blocking (for optional auth)
const attachUserContext = (req, res, next) => {
  const userContext = authService.extractUserContext(req);
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