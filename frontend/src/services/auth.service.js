import client from '../api/axiosConfig';

const login = async (email, password) => {
  console.log('🌐 Making login API call to:', client.defaults.baseURL);
  try {
    const response = await client.post('/auth/login', { email, password });
    console.log('📡 API response:', response.data);
    
    if (response.data.token) {
      // Store the entire response data (includes token and user)
      localStorage.setItem('user', JSON.stringify(response.data));
      console.log('💾 Stored auth data in localStorage');
    }
    
    // Return the user object for the AuthContext
    return response.data;
  } catch (error) {
    console.error('🚨 Login API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
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
      console.log('📖 Retrieved user from localStorage:', data);
      // Return the user object from the stored data
      return data.user || data;
    } catch (e) {
      console.error('❌ Error parsing user data from localStorage:', e);
      return null;
    }
  }
  return null;
};

const fetchMe = async () => {
  console.log('🔍 Fetching user profile from /auth/me');
  const response = await client.get('/auth/me');
  console.log('👤 /auth/me response:', response.data);
  // /auth/me returns the user object directly (not wrapped in a user property)
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
