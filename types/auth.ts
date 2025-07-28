import type { User, Session } from '@supabase/supabase-js';

/**
 * Supabase 기반 사용자 역할 타입 정의
 */
export type UserRole =
  | 'admin'
  | 'kol'
  | 'shop'
  | 'hq'
  | 'unassigned'
  | 'ol'
  | 'shop_owner'
  | 'sales'
  | null;

/**
 * 프로필 상태 타입
 */
export type ProfileStatus = 'pending' | 'approved' | 'rejected';

/**
 * 프로필 인터페이스 (Supabase profiles 테이블 기반)
 */
export interface Profile {
  id: string;
  _id?: string; // Convex ID
  userId?: string;
  supabaseUserId?: string;
  email: string;
  name: string;
  display_name?: string; // 표시 이름
  bio?: string; // 자기소개
  image?: string; // 프로필 이미지
  role: UserRole;
  status: ProfileStatus;
  shop_name: string;
  region?: string;
  naver_place_link?: string;
  approved_at?: string;
  approved_by?: string;
  commission_rate?: number;
  total_subordinates?: number;
  active_subordinates?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * useAuth 훅이 반환하는 인증 상태 객체의 인터페이스
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  signOut: () => Promise<void>;
  syncError: Error | null;
}

/**
 * 인증 컨텍스트 타입
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (attributes: any) => Promise<void>;
  supabase: any; // Supabase Client 타입
}

/**
 * 프로필 생성 파라미터
 */
export interface CreateProfileParams {
  supabaseUserId: string;
  email: string;
  name: string;
  display_name?: string;
  role?: UserRole;
  status?: ProfileStatus;
  shop_name?: string;
  metadata?: Record<string, any>;
}
