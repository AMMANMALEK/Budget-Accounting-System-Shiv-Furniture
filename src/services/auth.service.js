import client from '../api/axiosConfig';

const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  // Adjust based on whether backend returns { user: ... } or just user fields in root
  return response.data.user || response.data;
};

const signup = async (userData) => {
  const response = await client.post('/auth/signup', userData);
  return response.data;
};

const logout = async () => {
  try {
    await client.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('user');
  }
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const data = JSON.parse(userStr);
      // If data has a user property (common in JWT responses), return that.
      // Otherwise assume data IS the user.
      return data.user || data;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const fetchMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

const authService = {
  login,
  signup,
  logout,
  getCurrentUser,
  fetchMe,
};

export default authService;
