// Frontend-only mock authentication service (no backend required)

// Mock user database stored in localStorage
const USERS_KEY = 'erp_mock_users';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Static test credentials
const STATIC_USERS = [
    {
        id: '1',
        fullName: 'Admin User',
        email: 'admin@erp.com',
        password: 'admin123',
        role: 'admin',
    },
    {
        id: '2',
        fullName: 'John Client',
        email: 'client@erp.com',
        password: 'client123',
        role: 'client',
    },
    {
        id: '3',
        fullName: 'Jane Vendor',
        email: 'vendor@erp.com',
        password: 'vendor123',
        role: 'vendor',
    },
];

// Initialize mock database with static users
const initializeMockDB = () => {
    const existingUsers = localStorage.getItem(USERS_KEY);
    if (!existingUsers) {
        localStorage.setItem(USERS_KEY, JSON.stringify(STATIC_USERS));
    }
};

// Get all users from mock database
const getUsers = () => {
    initializeMockDB();
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
};

// Save users to mock database
const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Generate mock JWT token
const generateMockToken = (user) => {
    const tokenData = {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(tokenData)); // Base64 encode
};

const authService = {
    // Login user (frontend-only)
    login: async (email, password) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const users = getUsers();
        const user = users.find((u) => u.email === email);

        if (!user) {
            throw 'Invalid email or password';
        }

        if (user.password !== password) {
            throw 'Invalid email or password';
        }

        // Generate mock token
        const token = generateMockToken(user);

        // Store token and user data
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        }));

        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    },

    // Signup user (frontend-only)
    signup: async (userData) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const users = getUsers();

        // Check if user already exists
        const existingUser = users.find((u) => u.email === userData.email);
        if (existingUser) {
            throw 'User already exists with this email';
        }

        // Create new user
        const newUser = {
            id: String(users.length + 1),
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            role: userData.role || 'client',
        };

        users.push(newUser);
        saveUsers(users);

        return {
            message: 'User created successfully',
            userId: newUser.id,
        };
    },

    // Logout user
    logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Get current user
    getCurrentUser: () => {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return false;

        try {
            const tokenData = JSON.parse(atob(token));
            return tokenData.exp > Date.now();
        } catch {
            return false;
        }
    },

    // Get static test credentials (for display)
    getTestCredentials: () => {
        return STATIC_USERS.map(user => ({
            email: user.email,
            password: user.password,
            role: user.role,
        }));
    },
};

export default authService;
