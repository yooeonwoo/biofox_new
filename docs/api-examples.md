# 🚀 BioFox KOL Platform API Examples

## 📋 개요

이 문서는 BioFox KOL 플랫폼 API의 실제 사용 예제와 응답 형식을 제공합니다. 모든 예제는 실제 구현을 기반으로 작성되었습니다.

---

## 🔐 인증

### Authorization Header

모든 보호된 API 엔드포인트는 인증이 필요합니다.

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Cookie 기반 인증

웹 브라우저에서는 HTTP-only 쿠키를 통한 자동 인증도 지원됩니다.

---

## 📊 관리자 API 예제

### 1. 현재 사용자 정보 조회

**Request:**

```bash
GET /api/auth/current-user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "김철수",
  "email": "kimcs@biofox.com",
  "role": "admin"
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "인증되지 않은 사용자"
}
```

### 2. 관리자 대시보드 통계

**Request:**

```bash
GET /api/admin/dashboard-stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**

```json
{
  "kolsCount": 45,
  "activeShops": 128,
  "monthlyOrders": 234,
  "lastMonthOrders": 189,
  "totalSales": 15750000,
  "salesChart": [
    {
      "date": "1/15",
      "sales": 2300000
    },
    {
      "date": "1/16",
      "sales": 1850000
    },
    {
      "date": "1/17",
      "sales": 3100000
    },
    {
      "date": "1/18",
      "sales": 2750000
    },
    {
      "date": "1/19",
      "sales": 2900000
    },
    {
      "date": "1/20",
      "sales": 1950000
    },
    {
      "date": "1/21",
      "sales": 2000000
    }
  ],
  "lastUpdated": "2024-01-21T10:30:00.000Z"
}
```

**Response (403 Forbidden):**

```json
{
  "error": "권한이 없습니다."
}
```

---

## 👥 Convex Functions API 예제

### 1. 프로필 생성 (ensureUserProfile)

**Function Call:**

```javascript
const profileId = await convex.mutation(api.auth.ensureUserProfile, {
  userId: 'user_123',
  email: 'newuser@example.com',
  name: '새로운 사용자',
  role: 'shop_owner',
  shop_name: '뷰티샵 강남점',
  region: '서울 강남구',
  commission_rate: 0.05,
});
```

**Response:**

```javascript
'k17f8d9c2a1b4e6f8a9b2c3d4e5f6789'; // Profile ID
```

### 2. 프로필 완성도 확인

**Function Call:**

```javascript
const completeness = await convex.query(api.auth.getProfileCompleteness, {
  userId: 'user_123',
});
```

**Response:**

```json
{
  "isComplete": true,
  "completionPercentage": 100,
  "missingFields": []
}
```

**Incomplete Profile Response:**

```json
{
  "isComplete": false,
  "completionPercentage": 75,
  "missingFields": ["region", "naver_place_link"]
}
```

### 3. 모든 프로필 조회

**Function Call:**

```javascript
const profiles = await convex.query(api.profiles.getAllProfiles);
```

**Response:**

```json
[
  {
    "_id": "k17f8d9c2a1b4e6f8a9b2c3d4e5f6789",
    "_creationTime": 1705123456789,
    "userId": "user_123",
    "email": "admin@biofox.com",
    "name": "관리자",
    "role": "admin",
    "status": "approved",
    "shop_name": "BioFox 본사",
    "region": "서울",
    "commission_rate": 0,
    "total_subordinates": 50,
    "active_subordinates": 48,
    "created_at": 1705123456789,
    "updated_at": 1705123456789
  },
  {
    "_id": "k27f8d9c2a1b4e6f8a9b2c3d4e5f6790",
    "_creationTime": 1705123456790,
    "userId": "user_124",
    "email": "kol@example.com",
    "name": "김영희 KOL",
    "role": "kol",
    "status": "approved",
    "shop_name": "김영희 뷰티센터",
    "region": "서울 강남구",
    "commission_rate": 0.15,
    "total_subordinates": 12,
    "active_subordinates": 10,
    "approved_at": 1705123456800,
    "approved_by": "k17f8d9c2a1b4e6f8a9b2c3d4e5f6789",
    "created_at": 1705123456790,
    "updated_at": 1705123456850
  }
]
```

### 4. 역할별 프로필 조회

**Function Call:**

```javascript
const shopOwners = await convex.query(api.profiles.getProfilesByRole, {
  role: 'shop_owner',
});
```

**Response:**

```json
[
  {
    "_id": "k37f8d9c2a1b4e6f8a9b2c3d4e5f6791",
    "_creationTime": 1705123456791,
    "userId": "user_125",
    "email": "shop1@example.com",
    "name": "박철수",
    "role": "shop_owner",
    "status": "approved",
    "shop_name": "박철수 뷰티샵",
    "region": "서울 종로구",
    "commission_rate": 0.08,
    "approved_at": 1705123456900,
    "approved_by": "k27f8d9c2a1b4e6f8a9b2c3d4e5f6790",
    "created_at": 1705123456791,
    "updated_at": 1705123456900
  }
]
```

### 5. 프로필 승인

**Function Call:**

```javascript
const result = await convex.mutation(api.profiles.approveProfile, {
  profileId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
  approved: true,
  approvedBy: 'k17f8d9c2a1b4e6f8a9b2c3d4e5f6789',
  commission_rate: 0.08,
});
```

**Response:**

```json
{
  "success": true
}
```

### 6. 주문 생성

**Function Call:**

```javascript
const orderId = await convex.mutation(api.orders.createOrder, {
  shopId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
  orderNumber: 'ORD-20240121-001',
  totalAmount: 150000,
  commissionRate: 0.08,
  commissionAmount: 12000,
  orderItems: [
    {
      productName: '프리미엄 세럼',
      productCode: 'SERUM-001',
      quantity: 2,
      unitPrice: 60000,
      subtotal: 120000,
    },
    {
      productName: '하이드로겔 마스크',
      productCode: 'MASK-001',
      quantity: 1,
      unitPrice: 30000,
      subtotal: 30000,
    },
  ],
  metadata: {
    customerInfo: {
      name: '고객이름',
      phone: '010-1234-5678',
    },
    paymentMethod: 'card',
  },
});
```

**Response:**

```javascript
'o17f8d9c2a1b4e6f8a9b2c3d4e5f6792'; // Order ID
```

### 7. 매장별 주문 조회 (페이지네이션)

**Function Call:**

```javascript
const orders = await convex.query(api.orders.getOrdersByShop, {
  shopId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
  limit: 10,
  cursor: null,
});
```

**Response:**

```json
{
  "orders": [
    {
      "_id": "o17f8d9c2a1b4e6f8a9b2c3d4e5f6792",
      "_creationTime": 1705123456792,
      "shop_id": "k37f8d9c2a1b4e6f8a9b2c3d4e5f6791",
      "order_date": 1705123456792,
      "order_number": "ORD-20240121-001",
      "total_amount": 150000,
      "commission_rate": 0.08,
      "commission_amount": 12000,
      "commission_status": "calculated",
      "order_status": "pending",
      "is_self_shop_order": false,
      "notes": "고객 요청: 빠른 배송",
      "metadata": {
        "customerInfo": {
          "name": "고객이름",
          "phone": "010-1234-5678"
        },
        "paymentMethod": "card"
      },
      "created_at": 1705123456792,
      "updated_at": 1705123456792,
      "created_by": "k37f8d9c2a1b4e6f8a9b2c3d4e5f6791"
    }
  ],
  "cursor": "eyJjcmVhdGVkQXQiOjE3MDUxMjM0NTY3OTJ9",
  "hasMore": true
}
```

### 8. KOL의 하위 매장 조회

**Function Call:**

```javascript
const subordinates = await convex.query(api.relationships.getSubordinateShops, {
  kolId: 'k27f8d9c2a1b4e6f8a9b2c3d4e5f6790',
  activeOnly: true,
});
```

**Response:**

```json
[
  {
    "_id": "r17f8d9c2a1b4e6f8a9b2c3d4e5f6793",
    "_creationTime": 1705123456793,
    "shop_owner_id": "k37f8d9c2a1b4e6f8a9b2c3d4e5f6791",
    "parent_id": "k27f8d9c2a1b4e6f8a9b2c3d4e5f6790",
    "started_at": 1705123456793,
    "is_active": true,
    "relationship_type": "direct",
    "notes": "직접 관리 매장",
    "created_at": 1705123456793,
    "updated_at": 1705123456793,
    "created_by": "k27f8d9c2a1b4e6f8a9b2c3d4e5f6790"
  }
]
```

### 9. 알림 생성

**Function Call:**

```javascript
const notificationId = await convex.mutation(api.notifications.createNotification, {
  userId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
  type: 'order_created',
  title: '새로운 주문이 생성되었습니다',
  message: '주문번호 ORD-20240121-001이 생성되었습니다. 총 금액: ₩150,000',
  relatedType: 'order',
  relatedId: 'o17f8d9c2a1b4e6f8a9b2c3d4e5f6792',
  priority: 'normal',
});
```

**Response:**

```javascript
'n17f8d9c2a1b4e6f8a9b2c3d4e5f6794'; // Notification ID
```

### 10. 사용자 알림 조회

**Function Call:**

```javascript
const notifications = await convex.query(api.notifications.getUserNotifications, {
  userId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
  unreadOnly: false,
  limit: 5,
});
```

**Response:**

```json
[
  {
    "_id": "n17f8d9c2a1b4e6f8a9b2c3d4e5f6794",
    "_creationTime": 1705123456794,
    "user_id": "k37f8d9c2a1b4e6f8a9b2c3d4e5f6791",
    "type": "order_created",
    "title": "새로운 주문이 생성되었습니다",
    "message": "주문번호 ORD-20240121-001이 생성되었습니다. 총 금액: ₩150,000",
    "related_type": "order",
    "related_id": "o17f8d9c2a1b4e6f8a9b2c3d4e5f6792",
    "action_url": "/orders/o17f8d9c2a1b4e6f8a9b2c3d4e5f6792",
    "is_read": false,
    "priority": "normal",
    "created_at": 1705123456794
  }
]
```

---

## 🔄 실시간 구독 예제

### 1. React에서 실시간 알림 구독

```typescript
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

function NotificationComponent({ userId }: { userId: string }) {
  // 실시간으로 알림 데이터가 업데이트됨
  const notifications = useQuery(api.notifications.getUserNotifications, {
    userId,
    unreadOnly: true,
    limit: 10
  });

  // notifications가 null이면 로딩 중
  if (notifications === undefined) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification._id}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <small>{new Date(notification.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### 2. 실시간 주문 상태 구독

```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

function OrderStatusComponent({ shopId }: { shopId: string }) {
  // 실시간으로 주문 상태가 업데이트됨
  const orders = useQuery(api.orders.getOrdersByShop, {
    shopId,
    limit: 20
  });

  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    await updateOrderStatus({
      orderId,
      status: status as "pending" | "completed" | "cancelled" | "refunded"
    });
  };

  if (orders === undefined) {
    return <div>주문 정보 로딩 중...</div>;
  }

  return (
    <div>
      {orders.orders.map(order => (
        <div key={order._id}>
          <h4>주문번호: {order.order_number}</h4>
          <p>상태: {order.order_status}</p>
          <p>금액: ₩{order.total_amount.toLocaleString()}</p>
          <button onClick={() => handleStatusUpdate(order._id, 'completed')}>
            완료 처리
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## ❌ 에러 처리 예제

### 1. 권한 없음 에러

**Request:**

```bash
GET /api/admin/dashboard-stats
Authorization: Bearer invalid_token
```

**Response (403 Forbidden):**

```json
{
  "error": "권한이 없습니다."
}
```

### 2. Convex Function 에러

**Function Call:**

```javascript
try {
  const result = await convex.mutation(api.profiles.approveProfile, {
    profileId: 'invalid_id',
    approved: true,
    approvedBy: 'k17f8d9c2a1b4e6f8a9b2c3d4e5f6789',
  });
} catch (error) {
  console.error('승인 처리 오류:', error);
  // error.message: "Profile not found"
}
```

### 3. 유효성 검사 오류

**Function Call:**

```javascript
try {
  const profileId = await convex.mutation(api.auth.ensureUserProfile, {
    userId: 'user_123',
    email: 'invalid-email', // 잘못된 이메일 형식
    name: '', // 빈 이름
    role: 'invalid_role', // 잘못된 역할
  });
} catch (error) {
  console.error('프로필 생성 오류:', error);
  // error.message: "Validation failed: Invalid email format"
}
```

---

## 📊 페이지네이션 예제

### 커서 기반 페이지네이션

```javascript
async function loadAllOrders(shopId) {
  let allOrders = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const result = await convex.query(api.orders.getOrdersByShop, {
      shopId,
      limit: 50,
      cursor,
    });

    allOrders = [...allOrders, ...result.orders];
    cursor = result.cursor;
    hasMore = result.hasMore;
  }

  return allOrders;
}
```

---

## 🔍 검색 및 필터링 예제

### 1. 날짜 범위 주문 조회

**Function Call:**

```javascript
const startDate = new Date('2024-01-01').getTime();
const endDate = new Date('2024-01-31').getTime();

const monthlyOrders = await convex.query(api.orders.getOrdersByDateRange, {
  startDate,
  endDate,
  shopId: 'k37f8d9c2a1b4e6f8a9b2c3d4e5f6791',
});
```

### 2. 상태별 프로필 필터링

**Function Call:**

```javascript
const pendingProfiles = await convex.query(api.profiles.getPendingProfiles);
const approvedKOLs = await convex
  .query(api.profiles.getProfilesByRole, {
    role: 'kol',
  })
  .then(profiles => profiles.filter(p => p.status === 'approved'));
```

---

## 🚀 배치 작업 예제

### 1. 여러 주문 상태 일괄 업데이트

```javascript
async function batchUpdateOrderStatus(orderIds, newStatus) {
  const promises = orderIds.map(orderId =>
    convex.mutation(api.orders.updateOrderStatus, {
      orderId,
      status: newStatus,
    })
  );

  await Promise.all(promises);
}

// 사용 예
await batchUpdateOrderStatus(['order1', 'order2', 'order3'], 'completed');
```

### 2. 월말 수수료 계산

```javascript
async function calculateMonthlyCommissions(year, month) {
  const startDate = new Date(year, month - 1, 1).getTime();
  const endDate = new Date(year, month, 0, 23, 59, 59).getTime();

  // 해당 월의 모든 주문 조회
  const monthlyOrders = await convex.query(api.orders.getOrdersByDateRange, {
    startDate,
    endDate,
  });

  // 매장별 수수료 계산
  const commissionByShop = {};
  monthlyOrders.forEach(order => {
    const shopId = order.shop_id;
    if (!commissionByShop[shopId]) {
      commissionByShop[shopId] = 0;
    }
    commissionByShop[shopId] += order.commission_amount || 0;
  });

  return commissionByShop;
}
```

---

## 🔒 보안 고려사항

### 1. API 키 관리

```typescript
// 환경 변수로 민감한 정보 관리
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;

// 클라이언트에서는 공개 키만 사용
const convex = new ConvexReactClient(CONVEX_URL);
```

### 2. 역할 기반 데이터 접근

```javascript
// 사용자가 자신의 데이터만 접근할 수 있도록 제한
async function getMyOrders(userId) {
  const userProfile = await convex.query(api.profiles.getProfileByUserId, {
    userId,
  });

  if (!userProfile) {
    throw new Error('Profile not found');
  }

  // 사용자 역할에 따른 데이터 접근 제한
  if (userProfile.role === 'shop_owner') {
    return await convex.query(api.orders.getOrdersByShop, {
      shopId: userProfile._id,
    });
  } else if (userProfile.role === 'kol') {
    return await convex.query(api.orders.getOrdersByKOL, {
      kolId: userProfile._id,
    });
  }
}
```

---

이 문서의 모든 예제는 실제 BioFox KOL 플랫폼의 구현을 기반으로 작성되었으며, 실제 사용 시 참조할 수 있는 신뢰할 수 있는 가이드입니다.
