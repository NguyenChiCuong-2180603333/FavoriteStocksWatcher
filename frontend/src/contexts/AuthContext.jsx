import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api'; 
import AuthService from '../services/authService';
const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(() => {
    const localToken = localStorage.getItem('authToken');
    if (localToken) return localToken;
    return sessionStorage.getItem('authToken');
  });
  const [isLoading, setIsLoading] = useState(true); 
  const loadUserFromToken = useCallback(async (currentToken) => {
    if (currentToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      try {
        const response = await api.get('/users/profile'); 
        setUser(response.data);
      } catch (error) {
        console.error('AuthContext: Không thể load user từ token.', error.message || error);
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization'];
      }
    } else {
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
    setIsLoading(false);
  }, []);
  

  useEffect(() => {
    setIsLoading(true);
    loadUserFromToken(token);
  }, [token, loadUserFromToken]);


    const login = async (credentials) => {
    setIsLoading(true);
    try {
      const userData = await AuthService.login(credentials); 
      const { token: newToken, ...userInfo } = userData;

      setUser(userInfo);
      setToken(newToken); 

      if (credentials.rememberMe) {
        localStorage.setItem('authToken', newToken);
        sessionStorage.removeItem('authToken'); 
      } else {
        sessionStorage.setItem('authToken', newToken);
        localStorage.removeItem('authToken'); 
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setIsLoading(false);
    } catch (error) {
      console.error("AuthContext login error:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      setIsLoading(false);
      throw error.response?.data || error; 
    }
  };


   const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUserInfo) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserInfo }));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
    { children}
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
