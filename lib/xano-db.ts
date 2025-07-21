/**
 * Xano PostgreSQL 데이터베이스 직접 연결 유틸리티
 * BIOFOX KOL 시스템용 데이터베이스 접근 레이어
 */

import { Pool } from 'pg';

// Xano 데이터베이스 연결 설정
const DB_CONFIG = {
  host: process.env.XANO_DB_HOST || '34.64.147.136',
  database: process.env.XANO_DB_NAME || 'xano-xcj1-wluk-xdjk-db',
  user: process.env.XANO_DB_USER || 'full-33f4a67d',
  password: process.env.XANO_DB_PASSWORD || '7fa048da53a894e14aac1ba4ce160601',
  port: parseInt(process.env.XANO_DB_PORT || '5432'),
  ssl: false
};

// 연결 풀 생성
const pool = new Pool({
  ...DB_CONFIG,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 이벤트 리스너
pool.on('error', (err) => {
  console.error('Xano PostgreSQL 연결 풀 오류:', err);
});

/**
 * Xano 데이터베이스 유틸리티 클래스
 */
export class XanoDatabase {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * 쿼리 실행
   */
  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * 트랜잭션 실행
   */
  async transaction(callback: (client: any) => Promise<any>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 연결 종료
   */
  async end() {
    await this.pool.end();
  }
}

// 싱글톤 인스턴스 생성
export const xanoDb = new XanoDatabase();

/**
 * 응답 유틸리티 함수들
 */
export const ApiResponse = {
  success: (data: any, message?: string) => ({
    success: true,
    data,
    message: message || 'Success'
  }),

  error: (message: string, code: number = 500, details?: any) => ({
    success: false,
    message,
    code,
    details
  }),

  paginated: (data: any[], totalCount: number, page: number, limit: number, extra?: any) => ({
    success: true,
    data,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    },
    ...(extra || {})
  })
};

/**
 * 공통 데이터베이스 타입 정의
 */
export interface Order {
  id: number;
  shop_id: number;
  order_date: string;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  is_self_shop_order: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface DeviceSale {
  id: number;
  kol_id: number;
  device_model: string;
  sale_date: string;
  tier: 'tier_1_4' | 'tier_5_plus';
  standard_commission: number;
  actual_commission: number;
  serial_numbers: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmCard {
  id: number;
  kol_id: number;
  shop_id: number;
  stage_1_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_1_completed_at?: string;
  stage_2_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_2_completed_at?: string;
  stage_3_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_3_completed_at?: string;
  stage_4_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_4_completed_at?: string;
  stage_5_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_5_completed_at?: string;
  stage_6_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_6_completed_at?: string;
  stage_7_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_7_completed_at?: string;
  stage_8_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_8_completed_at?: string;
  stage_9_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_9_completed_at?: string;
  stage_10_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  stage_10_completed_at?: string;
  installation_training_completed: boolean;
  installation_training_date?: string;
  q1_answer?: string;
  q2_answer?: string;
  q3_answer?: string;
  q4_answer?: string;
  q5_answer?: string;
  q6_answer?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ClinicalCase {
  id: number;
  kol_id: number;
  shop_id: number;
  subject_type: 'customer' | 'personal' | 'model';
  subject_name: string;
  subject_age?: number;
  subject_gender?: 'male' | 'female' | 'other';
  subject_phone?: string;
  subject_email?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  consent_status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date?: string;
  estimated_duration_weeks: number;
  treatment_type?: string;
  treatment_area?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalSession {
  id: number;
  case_id: number;
  session_number: number;
  session_date: string;
  session_type: 'consultation' | 'treatment' | 'followup' | 'final';
  duration_minutes: number;
  notes?: string;
  before_photos: string[];
  after_photos: string[];
  pain_level: number;
  satisfaction_score: number;
  side_effects?: string;
  next_session_date?: string;
  next_session_notes?: string;
  session_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
