'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface User {
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users - in production, this should be from a database
const DEMO_USERS: Record<string, { password: string; name: string; role: string }> = {
  'admin': { password: 'admin123', name: 'Administrator', role: 'Admin' },
  'operator': { password: 'operator123', name: 'Operator', role: 'Operator' },
  'viewer': { password: 'viewer123', name: 'Viewer', role: 'Viewer' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to localStorage changes on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Check for existing session
    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Use queueMicrotask to defer state update
        queueMicrotask(() => {
          setUser(parsed);
          setIsLoading(false);
        });
        return;
      }
    } catch {
      // Ignore errors
    }
    queueMicrotask(() => {
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoUser = DEMO_USERS[username.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      const userData: User = {
        username: username.toLowerCase(),
        name: demoUser.name,
        role: demoUser.role,
      };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
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
