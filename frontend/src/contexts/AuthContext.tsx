import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || 'Login failed');
      }
      const data = await res.json();
      // Backend returns user in data.user
      if (data.user) {
        const payload = { id: data.user.id, email: data.user.email, name: data.user.name };
        setUser(payload);
        localStorage.setItem('user', JSON.stringify(payload));
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      } else {
        throw new Error('Login failed: No user returned');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive"
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Signup failed');
      }
      const data = await res.json();
      // Use data.user from backend response
      if (data.user) {
        const payload = { id: data.user.id, email: data.user.email, name: data.user.name };
        setUser(payload);
        localStorage.setItem('user', JSON.stringify(payload));
      } else {
        throw new Error('Unexpected response format from signup');
      }
      toast({
        title: "Registration Successful",
        description: "You have been registered! Redirecting to dashboard...",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive"
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: String(otp) }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'OTP verification failed');
      }
      const data = await res.json();
      const payload = { id: data.data._id, email: data.data.email, name: data.data.name };
      setUser(payload);
      localStorage.setItem('user', JSON.stringify(payload));
      localStorage.setItem('token', data.data.token);
      toast({
        title: "OTP Verified",
        description: "Your account is now active.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP verification failed';
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive"
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Google login failed');
      }
      const data = await res.json();
      const payload = { id: data.data._id, email: data.data.email, name: data.data.name };
      setUser(payload);
      localStorage.setItem('user', JSON.stringify(payload));
      localStorage.setItem('token', data.data.token);
      toast({
        title: "Google Login Successful",
        description: "Welcome to your dashboard!",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast({
        title: "Google Login Failed",
        description: message,
        variant: "destructive"
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear(); // Remove all localStorage data including chats
    // Force theme to light after logout
    localStorage.setItem('theme', 'light');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // Reload the page to fully reset frontend/browser state
    window.location.replace('/login');
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    verifyOtp,
    googleLogin,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};