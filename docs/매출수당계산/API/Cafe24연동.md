# Cafe24 API 연동 및 목업 데이터

## 1. 개요

이 문서는 Cafe24 쇼핑몰과의 API 연동 방법 및 개발 과정에서 사용할 목업 데이터 설계에 대해 설명합니다. 초기 개발 단계에서는 실제 Cafe24 API 연동 대신, 목업 데이터를 사용하여 기능을 구현합니다.

## 2. Cafe24 API 연동 계획

### 2.1 실제 Cafe24 API 연동 방식 (향후 구현)

1. **Cafe24 웹훅(Webhook) 설정**
   - Cafe24 관리자 페이지에서 웹훅 URL 등록: `https://yourdomain.com/api/webhook/cafe24`
   - 주문 완료, 주문 취소 등의 이벤트 설정

2. **API 인증**
   - OAuth 2.0 방식으로 인증 토큰 발급
   - 클라이언트 ID, 시크릿 키 관리

3. **주문 데이터 수신 및 처리**
   - 웹훅으로 수신된 주문 정보를 DB에 저장
   - 주문 정보를 기반으로 매출 및 수당 계산

### 2.2 연동 데이터 구조 (실제 연동 시)

Cafe24에서 수신할 주문 데이터 구조 예시:

```json
{
  "shop_no": 1,
  "order_id": "20230815-0000001",
  "order_date": "2023-08-15T14:30:00+09:00",
  "payment_date": "2023-08-15T14:35:00+09:00",
  "order_name": "홍길동",
  "member_id": "member123",
  "member_email": "hong@example.com",
  "currency": "KRW",
  "payment_amount": 300000,
  "shipping_fee": 0,
  "items": [
    {
      "variant_code": "P000000R000A",
      "product_code": "CURE001",
      "product_name": "큐어부스터",
      "option_value": "",
      "quantity": 2,
      "product_price": 74800,
      "option_price": 0,
      "additional_discount_price": 0,
      "tax_rate": 10,
      "supplied_price": 68000
    },
    {
      "variant_code": "P000000S000A",
      "product_code": "SERUM001",
      "product_name": "올인원세럼",
      "option_value": "",
      "quantity": 2,
      "product_price": 77000,
      "option_price": 0,
      "additional_discount_price": 0,
      "tax_rate": 10,
      "supplied_price": 70000
    }
  ]
}
```

## 3. 목업 데이터 설계

### 3.1 목업 데이터 엔드포인트

#### `GET /api/mock/cafe24-orders`

- 목업 주문 데이터 생성 및 조회
- 쿼리 파라미터로 생성할 주문 수 및 특정 전문점 지정 가능

#### `POST /api/mock/cafe24-webhook`

- Cafe24 웹훅을 시뮬레이션하는 엔드포인트
- 실제 Cafe24 웹훅과 동일한 로직으로 주문 데이터 처리

### 3.2 목업 데이터 구조

```json
{
  "order_no": "cafe24-20230815-001",
  "shop_name": "뷰티샵 A",
  "owner_name": "홍길동",
  "order_date": "2023-08-15T14:30:00+09:00",
  "total_price": 300000,
  "items": [
    {
      "product_name": "큐어부스터",
      "product_code": "CURE001",
      "price": 74800,
      "quantity": 2
    },
    {
      "product_name": "올인원세럼",
      "product_code": "SERUM001",
      "price": 77000,
      "quantity": 2
    }
  ]
}
```

### 3.3 목업 데이터 생성 로직

```typescript
// 제품 목록 상수 정의
const PRODUCTS = [
  { id: 1, name: "큐어부스터", code: "CURE001", price: 74800, isDevice: false },
  { id: 2, name: "올인원세럼", code: "SERUM001", price: 77000, isDevice: false },
  { id: 3, name: "V앰플", code: "VAMP001", price: 220000, isDevice: false },
  { id: 4, name: "퓨어솔루션", code: "PURE001", price: 418000, isDevice: false },
  { id: 5, name: "마이크로젯 부스터", code: "MICRO001", price: 149000, isDevice: true }
];

// 목업 주문 생성 함수
function generateMockOrders(count = 10, specificShopId = null) {
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    // 랜덤 전문점 선택 또는 지정된 전문점 사용
    const shopId = specificShopId || Math.floor(Math.random() * 10) + 1;
    
    // 주문 날짜 (현재 날짜 기준 최근 30일 내)
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
    
    // 주문 아이템 생성 (1~4개 랜덤)
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items = [];
    let totalPrice = 0;
    
    // 중복 없이 랜덤 제품 선택
    const selectedProductIndexes = new Set();
    while (selectedProductIndexes.size < itemCount) {
      selectedProductIndexes.add(Math.floor(Math.random() * PRODUCTS.length));
    }
    
    // 선택된 제품으로 주문 아이템 생성
    selectedProductIndexes.forEach(index => {
      const product = PRODUCTS[index];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemPrice = product.price * quantity;
      
      items.push({
        product_name: product.name,
        product_code: product.code,
        price: product.price,
        quantity: quantity
      });
      
      totalPrice += itemPrice;
    });
    
    // 주문 객체 생성
    orders.push({
      order_no: `cafe24-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      shop_id: shopId,
      shop_name: `뷰티샵 ${String.fromCharCode(65 + (shopId - 1) % 26)}`,
      owner_name: `홍길동${shopId}`,
      order_date: orderDate.toISOString(),
      total_price: totalPrice,
      items: items
    });
  }
  
  return orders;
}
```

### 3.4 목업 데이터 사용 방법

1. **개발 환경에서 목업 데이터 활용**

```typescript
// 목업 주문 데이터 10개 생성
const mockOrders = generateMockOrders(10);

// 특정 전문점의 목업 주문 데이터 5개 생성
const specificShopOrders = generateMockOrders(5, 3); // shopId: 3

// 목업 웹훅 호출 테스트
fetch('/api/mock/cafe24-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(mockOrders[0]),
});
```

2. **테스트용 웹훅 시뮬레이션**

```typescript
// pages/api/mock/trigger-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateMockOrders } from '@/lib/mock-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { count = 1, shopId } = req.query;
    const mockOrders = generateMockOrders(Number(count), shopId ? Number(shopId) : null);
    
    // 각 목업 주문에 대해 웹훅 엔드포인트 호출
    const results = await Promise.all(
      mockOrders.map(order => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mock/cafe24-webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        }).then(r => r.json())
      )
    );
    
    res.status(200).json({ success: true, data: { results } });
  } catch (error) {
    console.error('웹훅 시뮬레이션 오류:', error);
    res.status(500).json({ success: false, error: { message: '웹훅 처리 중 오류가 발생했습니다.' } });
  }
}
```

## 4. 목업 데이터에서 실제 Cafe24 연동으로 전환 계획

### 4.1 전환 단계

1. **목업 데이터를 사용한 기능 개발 및 테스트**
   - 모든 매출/수당 계산 로직 구현
   - UI 및 데이터 시각화 구현

2. **Cafe24 API 명세 확인 및 인증 설정**
   - 실제 Cafe24 API 문서 검토
   - OAuth 인증 설정

3. **웹훅 엔드포인트 수정**
   - 목업 데이터 구조에서 실제 Cafe24 데이터 구조로 변환
   - 데이터 포맷 변환 로직 추가

4. **테스트 환경에서 실제 Cafe24 연동 테스트**
   - 실제 주문 테스트
   - 데이터 처리 검증

5. **프로덕션 환경으로 배포**
   - 실제 Cafe24 웹훅 URL 등록
   - 모니터링 및 로깅 설정

### 4.2 데이터 매핑 로직

목업 데이터에서 실제 Cafe24 데이터로 전환 시 필요한 데이터 매핑 로직:

```typescript
// Cafe24 데이터를 내부 시스템 형식으로 변환
function convertCafe24DataToInternalFormat(cafe24Data) {
  return {
    order_no: cafe24Data.order_id,
    shop_name: findShopNameByMemberId(cafe24Data.member_id), // 회원 ID로 전문점 찾기
    owner_name: cafe24Data.order_name,
    order_date: cafe24Data.order_date,
    total_price: cafe24Data.payment_amount,
    items: cafe24Data.items.map(item => ({
      product_name: item.product_name,
      product_code: item.product_code,
      price: item.product_price,
      quantity: item.quantity
    }))
  };
}
``` 