const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user storage (for demo purposes)
const users = [];

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password (in production, use bcrypt)
    if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        { expiresIn: '24h' }
    );

    // Return token and user data
    res.json({
        token,
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    });
});

// Signup endpoint
app.post('/api/auth/signup', (req, res) => {
    const { fullName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = {
        id: String(users.length + 1),
        fullName,
        email,
        password, // In production, hash this with bcrypt
        role: role || 'client',
    };

    users.push(newUser);

    res.status(201).json({
        message: 'User created successfully',
        userId: newUser.id,
    });
});

// Test endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', users: users.length });
});

app.listen(PORT, () => {
    console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
});
