import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; 
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(localStorage.getItem('authToken')); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);


  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        try {
          const response = await api.get('/users/profile');
          setUser(response.data); 
        } catch (error) {
          console.error('Không thể load user từ token, có thể token đã hết hạn.', error);
          setToken(null); 
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    loadUserFromToken();
  }, [token]); 

  const login = (userData) => {
    setUser({
        _id: userData._id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        favoriteStocks: userData.favoriteStocks
    });
    setToken(userData.token);
  };

  const register = (userData) => {
     setUser({
        _id: userData._id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        favoriteStocks: userData.favoriteStocks
    });
    setToken(userData.token);
  }

  const logout = () => {
    setUser(null);
    setToken(null);
   
  };

  const updateUser = (updatedUserInfo) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserInfo }));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  return useContext(AuthContext);
};