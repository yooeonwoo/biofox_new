# Year-Month 형식 통일 마이그레이션 가이드

## 🎯 목적
기존 데이터베이스의 `year_month` 필드를 모두 `YYYY-MM` 형식으로 통일하여 API 일관성 문제를 해결합니다.

## 📋 변경 사항

### 변경 전 (문제 상황)
- **shops API**: `YYYYMM` 형식 사용 (예: "202505")
- **dashboard API**: 현재월 `YYYYMM`, 이전월 `YYYY-MM` 혼재
- **monthly-sales API**: 두 형식 모두 지원하지만 비효율적

### 변경 후 (해결 상태)
- **모든 API**: `YYYY-MM` 형식으로 통일 (예: "2025-05")
- **레거시 호환성**: 기존 `YYYYMM` 데이터도 자동 조회
- **새로운 데이터**: `YYYY-MM` 형식으로만 저장

## 🔧 마이그레이션 단계

### 1단계: 백업 확인
```bash
# 현재 상태 확인
psql -h your-host -d your-db -c "
SELECT 
  'kol_dashboard_metrics' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN LENGTH(year_month) = 6 THEN 1 END) as yyyymm_format,
  COUNT(CASE WHEN LENGTH(year_month) = 7 THEN 1 END) as yyyy_mm_format
FROM kol_dashboard_metrics
UNION ALL
SELECT 
  'shop_sales_metrics' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN LENGTH(year_month) = 6 THEN 1 END) as yyyymm_format,
  COUNT(CASE WHEN LENGTH(year_month) = 7 THEN 1 END) as yyyy_mm_format
FROM shop_sales_metrics;
"
```

### 2단계: 마이그레이션 실행
```bash
# 마이그레이션 스크립트 실행
psql -h your-host -d your-db -f scripts/migrate-year-month-format.sql
```

### 3단계: 결과 확인
```bash
# 변환 결과 확인
psql -h your-host -d your-db -c "
SELECT 
  table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN year_month ~ '^[0-9]{4}-[0-9]{2}$' THEN 1 END) as correct_format
FROM (
  SELECT 'kol_dashboard_metrics' as table_name, year_month FROM kol_dashboard_metrics
  UNION ALL
  SELECT 'shop_sales_metrics' as table_name, year_month FROM shop_sales_metrics
) t
GROUP BY table_name;
"
```

## 🚀 배포 순서

### 1. 코드 배포 (현재 상태)
- ✅ `lib/date-utils.ts` 수정 완료
- ✅ `app/api/kol-new/shops/route.ts` 수정 완료
- ✅ `app/api/kol-new/dashboard/route.ts` 수정 완료
- ✅ `app/api/kol-new/dashboard-complete/route.ts` 수정 완료
- ✅ `app/api/kol-new/monthly-sales/route.ts` 수정 완료
- ✅ `lib/supabase.ts` 정리 완료

### 2. 데이터베이스 마이그레이션
```bash
# 프로덕션 환경에서 실행
npm run migrate:year-month
# 또는 직접 SQL 실행
psql -h prod-host -d prod-db -f scripts/migrate-year-month-format.sql
```

### 3. 테스트 확인
- shops 페이지에서 매출 데이터 표시 확인
- dashboard에서 전월 대비 증감 확인
- monthly-sales 차트 데이터 확인

## 🔄 롤백 방법

### 긴급 롤백 (코드 수준)
```typescript
// lib/date-utils.ts에서 임시 롤백
export function getCurrentYearMonth(): string {
  const currentDate = getCurrentDate();
  return currentDate.substring(0, 7).replace('-', ''); // 다시 YYYYMM으로
}
```

### 데이터베이스 롤백
```sql
-- 백업에서 복원
BEGIN;

-- 1. kol_dashboard_metrics 롤백
DROP TABLE IF EXISTS kol_dashboard_metrics;
ALTER TABLE kol_dashboard_metrics_backup RENAME TO kol_dashboard_metrics;

-- 2. shop_sales_metrics 롤백
DROP TABLE IF EXISTS shop_sales_metrics;
ALTER TABLE shop_sales_metrics_backup RENAME TO shop_sales_metrics;

-- 다른 테이블들도 동일하게...

COMMIT;
```

## 📊 예상 효과

### 성능 개선
- **API 응답 시간**: 30-50% 단축 예상
- **데이터베이스 쿼리**: 중복 형식 조회 제거로 효율성 증대
- **캐싱 효율성**: 일관된 키 형식으로 캐시 히트율 향상

### 버그 수정
- ✅ shops 페이지에서 매출 데이터 미표시 문제 해결
- ✅ dashboard에서 전월 대비 계산 오류 해결
- ✅ 월별 차트 데이터 불일치 해결

## ⚠️ 주의사항

### 배포 전 확인사항
1. **백업 완료 확인**: 모든 테이블 백업이 정상적으로 생성되었는지 확인
2. **테스트 환경 검증**: 스테이징에서 전체 시나리오 테스트
3. **롤백 계획 준비**: 문제 발생시 즉시 롤백 가능한 상태 유지

### 배포 후 모니터링
1. **API 응답 시간**: 개선되었는지 확인
2. **에러 로그**: 새로운 오류가 발생하지 않는지 모니터링
3. **사용자 피드백**: 데이터 표시 정상 여부 확인

## 🔍 트러블슈팅

### 문제: 마이그레이션 후에도 데이터가 표시되지 않음
```sql
-- 데이터 존재 여부 확인
SELECT year_month, COUNT(*) 
FROM shop_sales_metrics 
WHERE shop_id IN (SELECT id FROM shops WHERE kol_id = YOUR_KOL_ID)
GROUP BY year_month
ORDER BY year_month;
```

### 문제: API 응답이 여전히 느림
```bash
# API 로그 확인
grep "매출 데이터 조회" /var/log/app.log | tail -20
```

### 문제: 이전 월 데이터 미표시
```sql
-- 이전 월 데이터 확인
SELECT * FROM kol_dashboard_metrics 
WHERE kol_id = YOUR_KOL_ID 
AND year_month = '2025-04';
```

## 📞 지원

문제 발생시 즉시 개발팀에 연락하여 롤백 여부를 결정하세요.

- **긴급 연락처**: 개발팀 Slack 채널
- **롤백 결정권자**: 시스템 관리자
- **모니터링 도구**: 서버 로그, API 응답 시간, 에러율 