const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/authMiddleware');
const { userDAL } = require('../database/dal');

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    const result = await authService.authenticateUser(
      email,
      password,
      userDAL.getUserByCredentials
    );

    if (!result.success) {
      console.warn(`⚠️ Login failed for ${email}: ${result.error}`);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: result.error || 'Invalid email or password'
      });
    }

    console.log(`✅ Login successful for ${email} (Role: ${result.user.role})`);

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role, // ADMIN | PORTAL
        name: result.user.name
      }
    });
  } catch (error) {
    console.error('❌ Login system error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Login system error: ' + error.message
    });
  }
});

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role = 'PORTAL' } = req.body;
    console.log(`📝 Signup attempt for: ${email}`);

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email, password, and name are required'
      });
    }

    // Check availability first to avoid messy 500s
    try {
      const existingUser = await userDAL.getUserByCredentials(email);
      if (existingUser) {
        console.warn(`⚠️ Signup failed: User ${email} already exists`);
        return res.status(409).json({
          error: 'USER_ALREADY_EXISTS',
          message: 'User already exists'
        });
      }
    } catch (err) {
      console.error('Check existing user error:', err);
      // Continue to try insert, as this might just be a connection blip
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userDAL.createUser({
      email,
      password: hashedPassword,
      name,
      role: role.toUpperCase() // enforce ADMIN / PORTAL
    });

    console.log(`✅ Signup successful for ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    // Return specific DB errors
    if (error.code === '23505') { // Postgres unique_violation
      return res.status(409).json({
        error: 'USER_ALREADY_EXISTS',
        message: 'Email or login already in use.'
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Signup failed: ' + error.message
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, (req, res) => {
  // Stateless JWT: frontend just discards token
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userDAL.getUserById(req.userContext.userId);

    if (!user) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to get user info'
    });
  }
});

module.exports = router;
