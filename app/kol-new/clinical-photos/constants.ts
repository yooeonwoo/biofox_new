// 시스템에서 공통적으로 사용되는 옵션값 정리
// 실제 옵션 목록은 Admin 페이지 혹은 외부 API 에서 가져올 수도 있으므로,
// 우선 사용 중인 값들을 하드코딩해 두고 필요 시 동적 로딩 구조로 교체한다.

export const SYSTEM_OPTIONS = {
  genders: [
    { label: '남성', value: 'male' },
    { label: '여성', value: 'female' },
    { label: '기타', value: 'other' },
  ],
  treatmentTypes: [
    { label: '클렌징', value: 'cleansing' },
    { label: '필링', value: 'peeling' },
    { label: '스킨부스터', value: 'skin_booster' },
    // TODO: 실제 비즈니스 로직에 맞추어 항목 확장
  ],
  products: [
    { label: '큐어 부스터', value: 'cure_booster' },
    { label: '큐어 마스크', value: 'cure_mask' },
    { label: '프리미엄 마스크', value: 'premium_mask' },
    { label: '올인원 세럼', value: 'all_in_one_serum' },
  ],
  skinTypes: [
    { label: '민감, 붉은 피부', value: 'red_sensitive' },
    { label: '색소 침착', value: 'pigment' },
    { label: '모공', value: 'pore' },
    { label: '트러블', value: 'trouble' },
    { label: '주름', value: 'wrinkle' },
    { label: '기타', value: 'etc' },
  ],
} as const;

// 각 옵션들을 한 번에 export 할 수 있도록 재노출
export type GenderOption = typeof SYSTEM_OPTIONS.genders[number];
export type TreatmentTypeOption = typeof SYSTEM_OPTIONS.treatmentTypes[number];
export type ProductOption = typeof SYSTEM_OPTIONS.products[number];
export type SkinTypeOption = typeof SYSTEM_OPTIONS.skinTypes[number]; 