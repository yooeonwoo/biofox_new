// User 관련 타입 정의
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  commission_rate?: number;
  total_subordinates: number;
  active_subordinates: number;
  naver_place_link?: string;
  approved_at?: string;
  approved_by?: { name: string };
  created_at: string;
  updated_at: string;
  current_relationship?: {
    parent_name: string;
    parent_role: string;
  };
  stats: {
    total_sales_this_month: number;
    total_commission_this_month: number;
    total_clinical_cases: number;
  };
}

export interface UserFilters {
  status?: 'pending' | 'approved' | 'rejected';
  role?: 'admin' | 'kol' | 'ol' | 'shop_owner';
  search?: string;
  hasRelationship?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface BulkActionRequest {
  user_ids: string[];
  action: 'approve' | 'reject' | 'change_role' | 'delete';
  data?: {
    role?: 'admin' | 'kol' | 'ol' | 'shop_owner';
  };
}

export interface ShopRelationship {
  id: string;
  shop_owner_id: string;
  parent_id: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMCard {
  id: string;
  kol_id: string;
  shop_id: string;
  stage_1_status: boolean;
  stage_2_status: boolean;
  stage_3_status: boolean;
  stage_4_status: boolean;
  stage_5_status: boolean;
  stage_6_status: boolean;
  stage_7_status: boolean;
  stage_8_status: boolean;
  stage_9_status: boolean;
  stage_10_status: boolean;
  installation_date?: string;
  installation_manager?: string;
  installation_contact?: string;
  q1_cleobios?: 'Y' | 'N';
  q2_instasure?: 'Y' | 'N';
  q3_proper_procedure?: 'Y' | 'N';
  q4_progress_check?: 'Y' | 'N';
  q5_feedback_need?: '상' | '중' | '하';
  q6_management?: '상' | '중' | '하';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  order_date: string;
  total_amount: number;
  order_number?: string;
  items?: OrderItem[];
  is_self_shop_order?: boolean;
  notes?: string;
  created_at: string;
  shop?: {
    shop_name: string;
    name: string;
    parent?: {
      name: string;
      role: string;
    };
  };
  commission_amount?: number;
  commission_rate?: number;
  commission_status?: 'calculated' | 'adjusted' | 'paid' | 'cancelled';
  order_status: 'pending' | 'completed' | 'cancelled' | 'refunded';
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface DeviceSale {
  id: string;
  shop_id: string;
  sale_date: string;
  device_name: string;
  quantity: number;
  tier_at_sale: 'tier_1_4' | 'tier_5_plus';
  standard_commission: number;
  actual_commission: number;
  commission_status?: string;
  serial_numbers?: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KolDeviceAccumulator {
  id: string;
  kol_id: string;
  total_devices_sold: number;
  total_devices_returned: number;
  net_devices_sold: number;
  current_tier: 'tier_1_4' | 'tier_5_plus';
  tier_changed_at?: string;
  last_updated: string;
  created_at: string;
}

export interface CommissionCalculation {
  id: string;
  kol_id: string;
  calculation_month: string; // YYYY-MM
  subordinate_shop_commission: number;
  self_shop_commission: number;
  device_commission: number;
  total_commission: number;
  status: 'calculated' | 'adjusted' | 'paid';
  adjustments?: Array<{
    amount: number;
    reason: string;
    adjusted_by: {
      id: string;
      name: string;
    };
    adjusted_at: string;
  }>;
  payment_info?: {
    payment_method: string;
    reference?: string;
    notes?: string;
    paid_at: string;
    receipt_url?: string;
  };
  calculated_at: string;
  calculated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalCase {
  id: string;
  shop_id: string;
  subject_type: 'self' | 'customer';
  name: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  consent_status: 'no_consent' | 'consented' | 'pending';
  consent_date?: string;
  marketing_consent?: boolean;
  treatment_item?: string;
  start_date: string;
  end_date?: string;
  total_sessions: number;
  latest_session?: number;
  notes?: string;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalPhoto {
  id: string;
  clinical_case_id: string;
  session_number: number;
  photo_type: 'front' | 'left_side' | 'right_side';
  file_path: string;
  file_size: number;
  upload_date: string;
  created_at: string;
}

export interface ConsentFile {
  id: string;
  clinical_case_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  created_at: string;
}
