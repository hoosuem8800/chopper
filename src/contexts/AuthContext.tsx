import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, USE_MOCK_DATA, authService } from '@/services/api';
import { customToast } from '@/lib/toast';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: string; // Optional profile picture URL
  role: 'patient' | 'assistant' | 'doctor' | 'admin';
  name: string;
  is_premium: boolean;
  subscription_type?: 'free' | 'premium';
  subscription_end_date?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  isLogin: boolean;
  setIsLogin: (isLogin: boolean) => void;
  changeUserRole: (userId: number, newRole: User['role']) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get user from localStorage on initialization
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Add a lastRefreshTime variable to track when we last did a refresh
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Load user data on mount if token exists
  useEffect(() => {
    const loadInitialData = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
        
        // Check if we already have a user in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          // Just use the saved user data
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            console.log('Loaded user from localStorage:', parsedUser);
          } catch (e) {
            console.error('Failed to parse user from localStorage, fetching profile');
            fetchUserProfile();
          }
        } else {
          // Only fetch profile if we don't have user data
          fetchUserProfile();
        }
      }
    };
    
    loadInitialData();
    
    // Listen for refresh-user events
    const handleRefreshUser = () => {
      const now = Date.now();
      // Only allow refreshes every 5 seconds
      if (now - lastRefreshTime < 5000) {
        console.log('Skipping refresh - too soon since last refresh');
        return;
      }
      
      console.log('Auth context: Refreshing user from event');
      refreshUserProfile();
      setLastRefreshTime(now);
    };
    
    window.addEventListener('refresh-user', handleRefreshUser);
    
    return () => {
      window.removeEventListener('refresh-user', handleRefreshUser);
    };
  }, []);

  // Refresh the user profile
  const refreshUserProfile = () => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      console.log('Auth context: Refreshing user profile with saved token');
      fetchUserProfile();
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    
    try {
      // Verify we have a token before attempting to fetch
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.log('No token available, aborting profile fetch');
        setLoading(false);
        return;
      }
      
      console.log('Attempting to fetch user profile...');
      
      // Try multiple endpoints in sequence until one works
      let userData = null;
      let profilePicture = 'placeholder';
      
      // 1. Try the profiles endpoint
      try {
        console.log('Trying /profiles/ endpoint...');
        const profilesResponse = await api.get('/profiles/');
        
        if (Array.isArray(profilesResponse.data) && profilesResponse.data.length > 0) {
          console.log('Successfully fetched profile from /profiles/');
          const profile = profilesResponse.data[0];
          
          if (profile.user && typeof profile.user === 'object') {
            userData = profile.user;
          } else if (typeof profile.user === 'number') {
            // If user is just an ID, fetch the user details
            try {
              const userResponse = await api.get(`/users/${profile.user}/`);
              if (userResponse.data) {
                userData = userResponse.data;
              }
            } catch (error) {
              console.log(`Failed to fetch user details for ID ${profile.user}`);
            }
          } else {
            console.log('Profile found but user data is missing or not an object');
          }
          
          profilePicture = profile.profile_picture || 'placeholder';
        }
      } catch (error) {
        console.log('Failed to fetch from /profiles/, trying next alternative...');
      }
      
      // 2. If that fails, try the users endpoint
      if (!userData) {
        try {
          console.log('Trying /users/ endpoint...');
          const usersResponse = await api.get('/users/');
          
          if (Array.isArray(usersResponse.data) && usersResponse.data.length > 0) {
            console.log('Successfully fetched users from /users/');
            // Use the first user (which should be the current user)
            userData = usersResponse.data[0];
          }
        } catch (error) {
          console.log('Failed to fetch from /users/');
        }
      }
      
      // 3. If all API calls fail, try to get user info from the token
      if (!userData) {
        try {
          console.log('Attempting to extract user info from token...');
          const storedToken = localStorage.getItem('token');
          
          if (storedToken && storedToken.split('.').length === 3) {
            // Token is a JWT, try to decode the payload
            const base64Url = storedToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            
            const payload = JSON.parse(jsonPayload);
            console.log('Extracted token payload:', payload);
            
            if (payload.user_id) {
              // Create minimal user data from the token
              userData = {
                id: payload.user_id,
                username: `user_${payload.user_id}`,
                email: `user_${payload.user_id}@example.com`,
                first_name: 'User',
                last_name: `${payload.user_id}`,
                role: 'patient'
              };
              console.log('Created minimal user data from token:', userData);
            }
          }
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
      
      // 4. Try loading from localStorage as last resort
      if (!userData) {
        try {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            userData = JSON.parse(savedUser);
            console.log('Loaded user data from localStorage:', userData);
          }
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      
      // If we still don't have user data, we need to log out
      if (!userData) {
        console.error('Failed to get user data from any source');
        handleLogout();
        customToast.error('Failed to load your profile. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Create and set the user object
      const user = {
        id: userData.id,
        username: userData.username || `user_${userData.id}`,
        email: userData.email || `user_${userData.id}@example.com`,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        profile_picture: profilePicture || userData.profile_picture || 'placeholder',
        role: userData.role || 'patient',
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || `User ${userData.id}`,
        is_premium: userData.subscription_type === 'premium',
        subscription_type: userData.subscription_type || 'free',
        subscription_end_date: userData.subscription_end_date || undefined
      };
      
      console.log('Setting user data:', user);
      setUser(user);
      
      // Save user to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('User profile loaded successfully');
    } catch (error) {
      console.error('Error in user profile loading process:', error);
      
      // Check if we still have a valid token
      const tokenStillValid = await verifyTokenIsValid();
      if (!tokenStillValid) {
        handleLogout();
        customToast.error('Session expired. Please login again.');
      } else {
        // If token is valid but we still can't get profile, just use saved user
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            console.log('Using saved user data due to API error');
          } catch (e) {
            console.error('Error parsing saved user:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to verify token is valid
  const verifyTokenIsValid = async (): Promise<boolean> => {
    try {
      // This endpoint should return success if token is valid
      await api.post('/auth/token/verify/');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Handle logout - extract to reuse in error cases
  const handleLogout = () => {
    setToken(null);
    
    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear auth headers
    delete api.defaults.headers.common['Authorization'];
    
    // Auth modal reference removed
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt with:", email);
      
      // Use the authService from api.ts
      const data = await authService.login(email, password);
      console.log("Login response:", data);
      
      if (!data || !data.token) {
        throw new Error('Login failed: No token received');
      }
      
      // Store token in multiple places for compatibility
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      // Store also as accessToken for compatibility with some parts of the app
      localStorage.setItem('accessToken', data.token);
      
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Set global default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      // Create the auth session
      await createAuthSession(data.token, email);
      
      // Show success message
      customToast.success('Logged in successfully!');
      
      // Auth modal reference removed
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message if available
      const errorMsg = error.response?.data?.detail || 
                    error.response?.data?.error || 
                    error.message || 
                    'Login failed. Please try again.';
      
      customToast.error(`Login failed: ${errorMsg}`);
      throw error;
    }
  };

  // Helper to create an auth session - centralizes the logic
  const createAuthSession = async (authToken: string, userEmail?: string) => {
    // Set token in state and localStorage
    setToken(authToken);
    localStorage.setItem('token', authToken);
    
    // Detect token type and set appropriate prefix
    const prefix = authToken.startsWith('ey') ? 'Bearer' : 'Token';
    api.defaults.headers.common['Authorization'] = `${prefix} ${authToken}`;
    
    // Always get the real user profile, never use mock data
      return await fetchUserProfile();
  };

  const register = async (userData: any) => {
    try {
      console.log("Registration attempt with:", userData);
      
      // Use the authService with mock implementation
      const data = await authService.register(userData);
      console.log("Registration response:", data);
      
      if (!data || !data.token) {
        throw new Error('Registration failed: No token received');
      }
      
      // Create the auth session
      await createAuthSession(data.token, userData.email);
      
      // Show success message
      customToast.success('Account created successfully!');
      
      // Navigate to welcome page
      console.log('Navigating to welcome page');
      navigate('/welcome');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // More detailed error handling
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        if (error.response.data && typeof error.response.data === 'object') {
          // Extract validation error message
          const errorMsg = Object.values(error.response.data)
            .flat()
            .join(', ');
          
          if (errorMsg) {
            customToast.error(`Registration failed: ${errorMsg}`);
            throw new Error(errorMsg);
          }
        }
      }
      
      // Generic error if nothing specific was identified
      customToast.error('Registration failed. Please try again.');
      throw error;
    }
  };

  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear all possible token storage locations
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Also clear from sessionStorage if used
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    
    // Clear authorization header
    delete api.defaults.headers.common['Authorization'];
    
    console.log('User logged out, all auth data cleared');
    
    // Redirect to home page
    navigate('/');
  };

  const changeUserRole = async (userId: number, newRole: User['role']) => {
    try {
      // Only admin can change roles
      if (user?.role !== 'admin') {
        throw new Error('Only admin can change user roles');
      }

      const response = await api.patch(`/users/${userId}/role/`, { role: newRole });
      
      // If the current user's role is being changed, update the local state
      if (user?.id === userId) {
        setUser(prev => prev ? { ...prev, role: newRole } : null);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isPremium: !!user?.is_premium,
      login,
      register,
      logout,
      showAuthModal: false,
      setShowAuthModal: () => {},
      isLogin,
      setIsLogin,
      changeUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 