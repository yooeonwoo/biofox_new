export interface ShopCustomerData {
    name: string;
    contractDate: string;
    manager: string;
}

// 추후 확장될 상세 데이터 타입을 미리 정의
export interface ShopCustomerProgress {
    // 예시: 성장 단계별 데이터
    growth?: any; 
    expert?: any;
}

export interface SelfAssessmentValue {
  q1YN?: boolean; // 1. 플레이스는 세팅하였는가?
  q2YN?: boolean; // 2. 인스타는 세팅하였는가?
  q3YN?: boolean; // 3. 정품 및 정량 프로토콜대로 시행하고 있는가?
  q4YN?: boolean; // 4. 상품 진열이 잘 되어있는가?
}

export interface TrainingTabsValue {
  application?: boolean;  // 신청
  completion?: boolean;   // 완료
} 