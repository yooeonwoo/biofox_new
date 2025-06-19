// 프론트엔드에서 사용하기 위한 카멜케이스 변환 타입 ----------------------
export interface Customer {
  id: string;
  kolId: number; // 👈 신규 컬럼
  name: string;
  shopName?: string;
  phone: string;
  region: string;
  placeAddress?: string;
  assignee: string;
  manager: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ---------------- 단계별 상세 타입 -----------------------------
export interface InflowStage {
  /** 유입 채널 */
  channel?: "온라인" | "오프라인" | "지인";
  /** 최초 연락/유입 일자 (ISO string) */
  date?: string;
  /** 메모 */
  memo?: string;
}

export interface ContractStage {
  /** 계약서 서명 여부 */
  contractSigned: boolean;
  /** 계약일 (ISO string) */
  contractDate?: string;
}

export interface DeliveryStage {
  /** 장비·제품 설치 완료 여부 */
  delivered: boolean;
  /** 설치일 (ISO string) */
  deliveryDate?: string;
}

export interface EducationNotesStage {
  /** 교육/설치 시 특이사항 메모 */
  note?: string;
  /** 작성일 (ISO string) */
  date?: string;
}

export interface GrowthStage {
  /** 성장 단계(레벨) 또는 점수 */
  growthLevel?: number;
  /** 메모 */
  memo?: string;
  /** 기록일 (ISO string) */
  date?: string;
}

export interface ExpertStage {
  /** 전문가(mentor) 인증 여부 */
  expertCertified: boolean;
  /** 인증일 (ISO string) */
  date?: string;
}

export interface StageData {
  inflow?: InflowStage;
  contract?: ContractStage;
  delivery?: DeliveryStage;
  educationNotes?: EducationNotesStage;
  growth?: GrowthStage;
  expert?: ExpertStage;
}

export interface Achievements {
  basicTraining: boolean;
  standardProtocol: boolean;
  expertCourse: boolean;
}

export interface CustomerProgress {
  id: string;
  customerId: string;
  stageData: StageData;
  achievements: Achievements;
  /** 마지막 수정 시각 (Supabase Nullable) */
  updatedAt: string | null;
}

export interface ContractStageValue {
  type?: "purchase" | "deposit" | "reject";
  purchaseDate?: string;
  purchaseAmount?: string;
  depositDate?: string;
  depositAmount?: string;
  rejectDate?: string;
  rejectReason?: string;
  rejectAd?: boolean;
  memo?: string;
} 