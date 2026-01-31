/**
 * Authentication Service
 * 
 * This service handles user authentication and role-based authorization logic.
 * It provides methods to validate user credentials, extract user context from
 * requests, and determine what operations users can perform based on their roles.
 * 
 * Supported Roles:
 * - ADMIN: Full access to all operations and data modification
 * - PORTAL: Read-only access to data, cannot modify business/financial records
 * 
 * Key Functions:
 * - authenticateUser: Validates email/password credentials against database
 * - extractUserContext: Extracts user information from request objects
 * - Role validation methods: Check if user has required permissions
 * - Business data access control: Restricts financial data modification to admins
 * 
 * This service is used by authentication middleware and throughout the application
 * to enforce security policies and maintain proper access control.
 */
const bcrypt = require('bcryptjs');

class AuthService {
  // Returns success/error object after validating email/password against database
  async authenticateUser(email, password, getUserByCredentials) {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    try {
      // Get user from database
      const user = await getUserByCredentials(email, password);

      if (!user) {
        console.warn(`⚠️ Auth failed: User not found for email ${email}`);
        // SECURITY: In production, use generic message. For debugging, be specific.
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.warn(`⚠️ Auth failed: Password mismatch for user ${email}`);
        return {
          success: false,
          error: 'Invalid password'
        };
      }

      // Return user identity and role on successful authentication
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.toLowerCase(), // Convert to lowercase for consistency
          name: user.name
        }
      };
    } catch (error) {
      console.error(`❌ authenticateUser internal error: ${error.message}`);
      return {
        success: false,
        error: 'Authentication failed due to internal error'
      };
    }
  }

  // Extracts user object from req.userContext, returns null if not found
  extractUserContext(req) {
    // User context is attached to request by middleware
    if (req.userContext) {
      return {
        userId: req.userContext.userId,
        email: req.userContext.email,
        role: req.userContext.role
      };
    }
    return null;
  }

  // Returns true if user's role matches the required role
  hasRole(userContext, requiredRole) {
    if (!userContext || !userContext.role) {
      return false;
    }
    return userContext.role.toLowerCase() === requiredRole.toLowerCase();
  }

  // Returns true only if user has admin role
  canAccessAdmin(userContext) {
    return this.hasRole(userContext, 'admin');
  }

  // Returns true if user has portal or admin role
  canAccessPortal(userContext) {
    return this.hasRole(userContext, 'portal') || this.hasRole(userContext, 'admin');
  }

  // Returns true only for admin users - portal users cannot modify business data
  canModifyBusinessData(userContext) {
    // Only admin users can modify business or financial data
    return this.hasRole(userContext, 'admin');
  }

  // Returns true if user has valid id and role properties
  isAuthenticated(userContext) {
    return !!(userContext && userContext.userId && userContext.role);
  }
}

module.exports = new AuthService();