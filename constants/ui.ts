import { Info, AlertTriangle, Check, XCircle, Users, UserCheck } from "lucide-react";

// 아이콘 상수
export const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: Check,
  error: XCircle,
  users: Users,
  userCheck: UserCheck,
} as const;

// 빈 상태 메시지 상수
export const EMPTY_STATE = {
  noCases: {
    title: "등록된 케이스가 없습니다",
    description: "우측 상단 '새 고객 추가' 버튼으로 첫 케이스를 만들어 보세요.",
  },
  noPersonalCases: {
    title: "아직 본인 케이스가 없습니다",
    description: "첫 번째 본인 케이스를 추가해보세요",
  },
  noCustomerCases: {
    title: "아직 고객 케이스가 없습니다",
    description: "첫 번째 고객 케이스를 추가해보세요",
  },
} as const;

// 로딩 메시지 상수
export const LOADING_MESSAGES = {
  personal: {
    title: "본인 임상사진 로딩 중",
    description: "데이터를 불러오고 있습니다...",
  },
  customer: {
    title: "고객 임상사진 로딩 중",
    description: "데이터를 불러오고 있습니다...",
  },
  general: {
    title: "데이터 로딩 중",
    description: "데이터를 불러오고 있습니다...",
  },
} as const;

// 정보 메시지 상수
export const INFO_MESSAGES = {
  personalCaseLimit: "본인 케이스는 1개만 생성할 수 있습니다",
  customerCaseLimit: "고객 케이스는 최대 10개까지 생성할 수 있습니다",
  uploadInProgress: "업로드가 진행 중입니다...",
  saveInProgress: "저장 중입니다...",
} as const;

// 버튼 텍스트 상수
export const BUTTON_TEXTS = {
  addPersonalCase: "본인 케이스 추가",
  addCustomerCase: "고객 케이스 추가",
  addCase: "케이스 추가",
  save: "저장",
  cancel: "취소",
  delete: "삭제",
  edit: "수정",
} as const; 