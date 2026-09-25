import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ⚡ 1. Synchronously initialize user from localStorage: Instant UI render (0ms delay)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // ⚡ 2. Only show loading if a token exists but user data is not yet parsed
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return Boolean(token && !savedUser);
  });

  const navigate = useNavigate();

  // ⚡ 3. Non-blocking background session verification
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          localStorage.setItem('role', freshUser.role);
        }
      } catch (error) {
        // Only clear credentials if backend explicitly rejects the token (401)
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const res = await api.post('/auth/login', { email: normalizedEmail, password });
      
      if (res.data.success) {
        const { token, user: loggedUser } = res.data;
        
        // Save in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('role', loggedUser.role);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        
        // Update state
        setUser(loggedUser);
        
        return { success: true, user: loggedUser };
      }

      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
        // Log full error for debugging (visible in browser console)
        console.error('Login error:', error);
        const status = error.response?.status;
        const serverMsg = error.response?.data?.message;
        const errMsg = serverMsg || (status === 401 ? 'Invalid email or password' : 'Unable to sign in. Please try again.');
        return { success: false, message: errMsg, status };
    }
  };

  // Register handler — accepts optional idFrontFile and idBackFile blobs/files + emergencyContact
  const signup = async (fullName, email, phone, organization, password, idFrontFile, idBackFile, emergencyContact) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();

      // Use FormData so we can attach image files
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', normalizedEmail);
      formData.append('phone', phone || '');
      formData.append('organization', organization || '');
      formData.append('password', password);
      formData.append('role', 'parent');

      // Serialize emergency contact as JSON so it survives multipart/form-data
      if (emergencyContact && (emergencyContact.name || emergencyContact.phone || emergencyContact.relationship)) {
        formData.append('emergencyContact', JSON.stringify(emergencyContact));
      }

      if (idFrontFile) formData.append('idFront', idFrontFile, idFrontFile.name || 'id-front.jpg');
      if (idBackFile)  formData.append('idBack',  idBackFile,  idBackFile.name  || 'id-back.jpg');

      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (res.data.success) {
        const { token, user: registeredUser } = res.data;
        
        // Save in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('role', registeredUser.role);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        
        // Update state
        setUser(registeredUser);
        
        return { success: true, user: registeredUser };
      }

      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to create account';
      return { success: false, message: errMsg };
    }
  };

  // Google OAuth handler
  const googleLogin = async (idToken) => {
    try {
      const res = await api.post('/auth/google', { idToken });
      
      if (res.data.success) {
        const { token, user: loggedUser } = res.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', loggedUser.role);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }

      return { success: false, message: res.data.message || 'Google login failed' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Google authentication failed';
      return { success: false, message: errMsg };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Redirect routing helper
  const redirectUser = useCallback((role) => {
    switch (role) {
      case 'admin':
        navigate('/dashboard/admin', { replace: true });
        break;
      case 'parent':
        navigate('/dashboard/parent', { replace: true });
        break;
      case 'teacher':
        navigate('/dashboard/teacher', { replace: true });
        break;
      case 'reception':
        navigate('/dashboard/reception', { replace: true });
        break;
      case 'staff':
        navigate('/dashboard/reception', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, googleLogin, logout, redirectUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
