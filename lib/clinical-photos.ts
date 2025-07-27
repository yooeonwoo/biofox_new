// 이 파일은 더 이상 사용되지 않습니다.
// Convex 훅을 직접 사용하세요:
// - useQuery(api.clinical.listClinicalCases)
// - useMutation(api.clinical.createClinicalCase)
// - useMutation(api.clinical.updateClinicalCase)
// - useMutation(api.clinical.deleteClinicalCase)

import { ClinicalCase } from '@/types/clinical';
export type { ClinicalCase } from '@/types/clinical';

// PhotoSlot과 UploadResponse는 /types/clinical.ts에 정의되어 있습니다.
export type { PhotoSlot } from '@/types/clinical';

// 레거시 함수들은 제거되었습니다.
// Convex 훅을 사용하세요:
// const cases = useQuery(api.clinical.listClinicalCases);
// const createCase = useMutation(api.clinical.createClinicalCase);

// 모든 레거시 함수들이 제거되었습니다.
// 아래는 Convex 훅 사용 예시입니다:
/*
// 케이스 목록 조회
const cases = useQuery(api.clinical.listClinicalCases);

// 케이스 생성
const createCase = useMutation(api.clinical.createClinicalCase);
await createCase({
  subject_type: 'customer',
  name: '고객명',
  case_title: '케이스 제목',
  consent_status: 'no_consent'
});

// 케이스 업데이트
const updateCase = useMutation(api.clinical.updateClinicalCase);
await updateCase({
  caseId: 'clinical_cases_xxx',
  updates: {
    name: '새 이름',
    consent_status: 'consented'
  }
});

// 케이스 삭제
const deleteCase = useMutation(api.clinical.deleteClinicalCase);
await deleteCase({ caseId: 'clinical_cases_xxx' });
*/
