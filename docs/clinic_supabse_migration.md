# 📋 Clinical Photos 페이지 Supabase 마이그레이션 프로젝트 문서

## 🎯 프로젝트 개요

### **요구사항**

- **대상**: `/app/kol-new/clinical-photos` 페이지 **단독** 마이그레이션
- **소스**: Convex (프로덕션 환경)
- **목적지**: Supabase (Project ID: `cezxkgmzlkbjqataogtd`)
- **도구**: Convex MCP + Supabase MCP 툴 **필수 사용**
- **우선순위**: **속도 > 보안** (RLS 없이, 보안 고려 최소화)
- **SSR**: Supabase SSR 활용한 마이그레이션
- **접근방식**: Ultrathinking 방법론

---

## 📊 현재 Convex 분석 결과

### **핵심 테이블 구조**

1. **clinical_cases** (36개 필드)
   - 기본: id, profile_id, name, concern_area, treatment_plan
   - 동의서: consent_status, consent_date, consent_image_url
   - 상태: status, subject_type, metadata
   - 제품: cure_booster, cure_mask, premium_mask, all_in_one_serum
   - 피부타입: skin_red_sensitive, skin_pigment, skin_pore, skin_trouble, skin_wrinkle, skin_etc
   - **라운드 관리**: metadata.roundInfo 구조

2. **clinical_photos**
   - clinical_case_id, session_number, photo_type, file_path

3. **consent_files**
   - clinical_case_id, file_name, file_path

4. **file_metadata**
   - bucket_name, file_path, storageId

### **핵심 함수들**

- `saveRoundCustomerInfo()` - 라운드별 고객 정보 저장
- `getRoundCustomerInfo()` - 라운드별 정보 조회
- 파일 업로드/조회 관련 함수들

---

## ✅ Phase 1 완료 현황

### **Supabase 인프라 구축 완료**

#### **테이블 생성 (5개)**

- ✅ `clinical_cases` - **36개 컬럼** (Convex와 완전 동일)
- ✅ `clinical_photos` - 사진 메타데이터
- ✅ `consent_files` - 동의서 파일
- ✅ `file_metadata` - 파일 메타데이터
- ✅ `round_customer_info` - **라운드별 고객 정보** (신규)

#### **뷰 및 함수 생성**

- ✅ `clinical_cases_with_stats` - 통계 포함 뷰
- ✅ `save_round_customer_info()` - 라운드별 정보 저장
- ✅ `get_round_customer_info()` - 라운드별 정보 조회
- ✅ `get_storage_public_url()` - Storage URL 생성
- ✅ `generate_photo_path()` - 사진 경로 생성

#### **자동화 기능**

- ✅ 통계 자동 업데이트 트리거
- ✅ updated_at 자동 업데이트
- ✅ 라운드별 관리 시스템 (테스트 완료)

#### **인덱스 최적화**

- ✅ 모든 Foreign Key 인덱스
- ✅ 검색 최적화 인덱스
- ✅ 라운드별 조회 인덱스

---

## 🚧 남은 작업 (Phase 2-4)

### **Phase 2: API 레이어 구현**

- [ ] `lib/clinical-photos-supabase.ts` 생성
- [ ] Convex API와 동일한 인터페이스 구현
- [ ] React Query 훅으로 래핑
- [ ] SSR 호환 함수 생성

### **Phase 3: 컴포넌트 마이그레이션**

- [ ] Convex 훅 → Supabase 훅 교체
- [ ] Storage URL 처리 변경
- [ ] 에러 처리 업데이트

### **Phase 4: 정리 및 테스트**

- [ ] Convex 관련 코드 제거
- [ ] 기능 테스트 및 검증
- [ ] 성능 확인

---

## 📁 영향받는 파일들

### **Convex 의존 파일들**

```
lib/
├── clinical-photos-convex.ts     # 메인 API 레이어
├── clinical-photos-hooks.ts      # React 훅
└── clinical-photos-service.ts    # 서비스 레이어

app/kol-new/clinical-photos/
├── page.tsx                      # 메인 페이지
├── hooks/
│   ├── useCaseManagement.ts     # 케이스 관리 훅
│   └── usePhotoManagement.ts    # 사진 관리 훅
├── components/
│   ├── CaseCard/               # 케이스 카드 컴포넌트들
│   ├── CaseStatusTabs.tsx      # 상태 탭
│   ├── CustomerAddModal.tsx    # 고객 추가 모달
│   └── PhotoUploadSlot.tsx     # 사진 업로드 슬롯
└── upload/
    ├── customer/page.tsx       # 고객용 업로드
    └── personal/page.tsx       # 개인용 업로드

hooks/
├── useClinicalCases.ts         # 글로벌 훅
├── useCustomerCaseHandlers.ts  # 고객 케이스 핸들러
└── usePersonalCaseHandlers.ts  # 개인 케이스 핸들러
```

---

## 🎯 다음 단계 액션 플랜

### **Phase 2 우선순위**

1. **API 레이어 구현** (30분)
   - Supabase Client 설정
   - CRUD 함수 구현
   - 라운드별 관리 함수

2. **React Query 훅 생성** (20분)
   - 케이스 관리 훅
   - 사진 관리 훅
   - 라운드별 정보 훅

3. **SSR 지원** (10분)
   - Server Component 호환
   - 초기 데이터 로딩

### **예상 총 소요시간**

- **Phase 2**: 1시간
- **Phase 3**: 1.5시간
- **Phase 4**: 30분
- **총계**: **3시간**

---

## ⚠️ 주의사항

### **현재 완료된 부분**

- ✅ 데이터베이스 스키마 완전 구축
- ✅ 라운드별 관리 시스템 검증
- ✅ 테스트 데이터로 기능 확인

### **다음 Phase에서 중점사항**

- 🎯 Convex API와 **100% 동일한 인터페이스** 유지
- 🎯 기존 컴포넌트 **최소 변경**으로 마이그레이션
- 🎯 라운드별 관리 기능 **완전 호환**
- 🎯 Storage 파일 처리 **원활한 전환**

---

**다음 명령어**: `Phase 2로 진행하시겠습니까?`
