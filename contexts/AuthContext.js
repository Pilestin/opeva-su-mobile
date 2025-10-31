import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// API URL prioritesi: Environment variable > app.json extra > fallback
const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                Constants.expoConfig?.extra?.apiUrl || 
                'http://localhost:3000';

// Debug için API URL'yi konsola yazdır
console.log('🔗 API URL:', API_URL);
console.log('📱 Expo Config:', Constants.expoConfig?.extra);

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Validate token
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
        } catch (error) {
          // Token invalid, clear storage
          await logout();
        }
      }
    } catch (error) {
      console.error('Load auth error:', error);
    } finally {
      setLoading(false);
    }
  };
  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt to:', `${API_URL}/api/auth/login`);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return {
          success: false,
          message: `Sunucuya bağlanılamıyor. Backend ${API_URL} adresinde çalışıyor mu?`
        };
      }
      return {
        success: false,
        message: error.response?.data?.error || 'Giriş yapılamadı'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Kayıt oluşturulamadı'
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token,
        API_URL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
