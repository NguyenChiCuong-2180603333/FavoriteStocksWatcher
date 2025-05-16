import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; 
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(() => localStorage.getItem('authToken')); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const loadUserFromToken = async () => {
        try {
          const response = await api.get('/users/profile');
          setUser(response.data);
        } catch (error) {
          console.error('AuthContext: Không thể load user từ token.', error.message || error);
          setUser(null);
          setToken(null); 
        } finally {
          setIsLoading(false); 
        }
      };
      loadUserFromToken();

    } else {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsLoading(false); 
    }
  }, [token]); 

    const login = (userData) => {
    const { token: newToken, ...userInfo } = userData;
    setUser(userInfo);      
    setIsLoading(true);    
    setToken(newToken);    
  };

  const register = (userData) => {
    const { token: newToken, ...userInfo } = userData;
    setUser(userInfo);
    setIsLoading(true);
    setToken(newToken);
  };

  const logout = () => {
    setUser(null);
    setIsLoading(true); 
    setToken(null);   
  };

  const updateUser = (updatedUserInfo) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserInfo }));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, updateUser }}>
    {!isLoading ? children : <div data-testid="auth-loading">Loading Authentication...</div>}
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

export { AuthContext };
