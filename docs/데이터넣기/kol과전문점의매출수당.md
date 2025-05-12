

# KOL과 전문점 매출수당 처리 가이드

## 1. 이미지 데이터 해석 방법

### 기본 원칙
- 제공된 모든 데이터는 5월 기준 (이미지에 3월, 4월이 표기되어 있더라도 무시)
- 일자별 제품 수량 정보는 우선 무시 가능
- 전문점: 총 제품매출과 총 제품수당만 중점적으로 확인
- KOL: 매출총계, 총 수당, 제품수당을 중점적으로 확인 (기기수당은 무시)

### 표 구조 이해
- 맨 위 "스킨멘토/김지윤" 형태 → KOL 정보
- 그 아래 여러 행 → 해당 KOL에 소속된 전문점 정보
- 표 하단부 → KOL 전체 매출 요약 (매출총계, 제품수당, 장비수당, 총 수당)

### 제품 코드 해석
- CB: 큐어부스터
- AS: 올인원세럼
- CM: 큐어마스크팩
- PM: 프리미엄마스크팩
- VAM: V앰플
- PAM: 프리미엄앰플
- MB: 마이크로제부스터

### 중요 지표
- 전문점 개수: 표에 나열된 모든 전문점 수
- 활성 전문점: 제품 주문 내역이 있는 전문점 수
- 전문점 매출: "총 제품 매출" 행에 표시된 금액
- 전문점 수당: "총 제품 수당" 행에 표시된 금액
- KOL 매출/수당: 표 하단부 요약 정보 확인

## 2. Supabase 테이블 구조

### 주요 테이블
1. **kols**: KOL 기본 정보
   - id, name, shop_name 등 KOL 정보 저장

2. **shops**: 전문점 정보
   - id, shop_name, owner_name, kol_id(연결된 KOL) 등 저장
   - is_owner_kol: KOL이 직접 운영하는 전문점인지 여부

3. **products**: 제품 정보
   - id, name, price, is_device 등 저장

4. **kol_total_monthly_sales**: KOL 월별 매출/수당 통계
   - kol_id, year_month(202405), total_sales, product_sales
   - total_commission, device_sales 등 저장
   - total_active_shops, total_shops: 활성/전체 전문점 수

5. **shop_sales_metrics**: 전문점별 매출 정보
   - shop_id, year_month, total_sales, product_sales
   - device_sales, commission 등 저장

6. **product_sales_metrics**: 제품별 상세 매출 정보
   - kol_id, shop_id, product_id, year_month
   - quantity, sales_amount, sales_ratio 등 저장

7. **kol_dashboard_metrics**: KOL 대시보드용 통합 지표
   - kol_id, year_month, monthly_sales, monthly_commission
   - active_shops_count, total_shops_count 등 저장

## 3. 데이터 입력 프로세스

### 1단계: 전문점 판매 데이터 입력
- **product_sales_metrics** 테이블에 제품별 판매 데이터 입력
  - 각 제품(CB, AS 등)의 판매량, 판매금액 입력
  - sales_ratio: 전체 매출 대비 해당 제품 매출 비율 계산하여 입력

### 2단계: 전문점 총 매출/수당 입력
- **shop_sales_metrics** 테이블에 월별 전문점 매출 합계 입력
  - shop_id, year_month(202405)
  - total_sales: 총 매출액
  - product_sales: 제품 매출액
  - device_sales: 장비 매출액
  - commission: 수당액

### 3단계: KOL 총 매출/수당 입력
- **kol_total_monthly_sales** 테이블에 KOL 월별 통계 입력
  - kol_id, year_month(202405)
  - total_sales: 총 매출액
  - product_sales: 제품 매출액
  - device_sales: 장비 매출액
  - total_commission: 총 수당액
  - total_active_shops: 활성 전문점 수
  - total_shops: 총 전문점 수

### 4단계: 대시보드 지표 업데이트
- **kol_dashboard_metrics** 테이블 업데이트
  - 해당 KOL의 월별 통합 지표 제공
  - 전체 매출, 수당, 활성/총 전문점 수 등 요약 정보

## 4. 예시 데이터 해석 (제공된 이미지 기준)

### 비엣스파 (홍수연) 전문점 데이터
- 5월 7일 판매: CB 30개, AS 10개, CM 10개, PM 5개, PAM 10개
- 총 제품 매출: ₩5,164,000
- 총 제품 수당: ₩1,549,200

### KOL 종합 데이터
- 전문점 제품 매출 총계: ₩5,164,000
- 바이오퓨스 제품 수당: ₩1,549,200
- 바이크로넷 장비 수당: ₩5,000,000 (기기수당으로 참고만 함)
- 총 수당: ₩6,337,476

### 입력 시 주의사항
- 장비수당(₩5,000,000)은 별도 처리되므로 제품 수당만 집중
- 김지혜(뷰티맥아드)와 같이 금액만 표시되고 실제 매출이 없는 경우는 장비수당으로 간주하여 제품 매출/수당에 포함하지 않음
- 제품별 판매 비율 계산 시 전체 매출액 기준으로 계산