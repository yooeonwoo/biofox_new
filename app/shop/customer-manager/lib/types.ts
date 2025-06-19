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