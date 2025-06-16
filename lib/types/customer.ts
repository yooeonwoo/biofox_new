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

export interface StageData {
  inflow?: Record<string, unknown>;
  contract?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
  educationNotes?: Record<string, unknown>;
  growth?: Record<string, unknown>;
  expert?: Record<string, unknown>;
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
  updatedAt?: string | Date;
} 