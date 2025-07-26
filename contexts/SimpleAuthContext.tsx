'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export interface User {
  email: string;
  role: 'kol' | 'sales' | 'admin' | 'ol' | 'shop_owner';
  name: string;
  profileId?: Id<'profiles'>;
  shop_name?: string;
  region?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 실제 프로필과 연동된 사용자 정보 (개발용)
const DEVELOPMENT_USERS: Record<string, { password: string; email: string }> = {
  'reflance88@gmail.com': {
    password: 'admin123',
    email: 'reflance88@gmail.com',
  },
  'sales@sales.com': {
    password: 'sales123',
    email: 'sales@sales.com',
  },
  'admin@admin.com': {
    password: 'admin123',
    email: 'admin@admin.com',
  },
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // 현재 로그인된 사용자의 프로필 조회
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    currentUserEmail ? { email: currentUserEmail } : 'skip'
  );

  // 페이지 로드시 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('simple-auth-email');
      if (storedEmail && DEVELOPMENT_USERS[storedEmail]) {
        setCurrentUserEmail(storedEmail);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // 프로필 데이터가 로드되면 사용자 상태 업데이트
  useEffect(() => {
    if (currentUserEmail && profile !== undefined) {
      if (profile) {
        // Convex 프로필이 있는 경우
        const userData: User = {
          email: profile.email,
          role: profile.role as User['role'],
          name: profile.name,
          profileId: profile._id,
          shop_name: profile.shop_name,
          region: profile.region,
          status: profile.status,
        };
        setUser(userData);
      } else {
        // 프로필이 없는 경우 (아직 생성되지 않음)
        const userData: User = {
          email: currentUserEmail,
          role: 'kol', // 기본값
          name: currentUserEmail.split('@')[0], // 이메일에서 이름 추출
        };
        setUser(userData);
      }
      setIsLoading(false);
    }
  }, [currentUserEmail, profile]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // 개발용 인증 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const userInfo = DEVELOPMENT_USERS[email];

    if (userInfo && userInfo.password === password) {
      localStorage.setItem('simple-auth-email', email);
      setCurrentUserEmail(email);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentUserEmail(null);
    localStorage.removeItem('simple-auth-email');
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
