'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  email: string;
  role: 'kol' | 'sales';
  name: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 하드코딩된 사용자 정보
const HARDCODED_USERS: Record<string, { password: string; role: 'kol' | 'sales'; name: string }> = {
  'reflance88@gmail.com': {
    password: 'admin123',
    role: 'kol',
    name: 'KOL 사용자',
  },
  'sales@sales.com': {
    password: 'sales123',
    role: 'sales',
    name: '영업 사용자',
  },
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 페이지 로드시 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    // 클라이언트 사이드에서만 실행되도록 보장
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('simple-auth-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('simple-auth-user');
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // 간단한 인증 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const userInfo = HARDCODED_USERS[email];

    if (userInfo && userInfo.password === password) {
      const loggedInUser: User = {
        email,
        role: userInfo.role,
        name: userInfo.name,
      };

      setUser(loggedInUser);
      localStorage.setItem('simple-auth-user', JSON.stringify(loggedInUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('simple-auth-user');
    router.push('/signin');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSimpleAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within an AuthProvider');
  }
  return context;
}
