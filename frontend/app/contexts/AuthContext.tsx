'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = auth.getToken();
    if (token) {
      // You could verify the token here or fetch user data
      // For now, we'll just set loading to false
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await auth.login(email, password);
    auth.setToken(response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await auth.register(email, password, name);
    auth.setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
