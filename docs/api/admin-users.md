# 관리자 사용자 관리 API 문서

## API 개요

이 문서는 BIOFOX KOL 프로젝트에서 관리자가 사용자를 관리하기 위한 API에 대해 설명합니다. 이 API는 Clerk API와 연동하여 실제 사용자 계정을 생성하고 관리합니다.

## API 엔드포인트

### 1. 사용자 생성 API

**URL:** `/api/admin/clerk/create-user`  
**Method:** `POST`  
**설명:** 새로운 사용자를 생성합니다.

#### 요청 본문

```json
{
  "email": "user@example.com",
  "firstName": "홍길동",
  "lastName": "", // 선택 사항
  "role": "kol" // 또는 "본사관리자"
}
```

#### 성공 응답 (201 Created)

```json
{
  "success": true,
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "firstName": "홍길동",
    "lastName": "",
    "role": "kol"
  }
}
```

#### 오류 응답

- **400 Bad Request:** 필수 필드 누락
- **401 Unauthorized:** 인증 실패
- **403 Forbidden:** 권한 없음
- **500 Internal Server Error:** 서버 오류

### 2. 사용자 목록 조회 API

**URL:** `/api/admin/clerk/users`  
**Method:** `GET`  
**설명:** 등록된 모든 사용자 목록을 조회합니다.

#### 성공 응답 (200 OK)

```json
{
  "users": [
    {
      "id": "user_1234567890",
      "email": "user1@example.com",
      "firstName": "홍길동",
      "lastName": "",
      "role": "kol",
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": "user_0987654321",
      "email": "user2@example.com",
      "firstName": "김관리",
      "lastName": "",
      "role": "본사관리자",
      "createdAt": "2023-01-02T00:00:00.000Z"
    }
  ]
}
```

#### 오류 응답

- **401 Unauthorized:** 인증 실패
- **403 Forbidden:** 권한 없음
- **500 Internal Server Error:** 서버 오류

### 3. 사용자 삭제 API

**URL:** `/api/admin/clerk/users`  
**Method:** `DELETE`  
**Query Parameter:** `id` (사용자 ID)  
**설명:** 지정된 ID의 사용자를 삭제합니다.

#### 요청 예시

```
DELETE /api/admin/clerk/users?id=user_1234567890
```

#### 성공 응답 (200 OK)

```json
{
  "success": true
}
```

#### 오류 응답

- **400 Bad Request:** 사용자 ID 누락
- **401 Unauthorized:** 인증 실패
- **403 Forbidden:** 권한 없음
- **404 Not Found:** 사용자를 찾을 수 없음
- **500 Internal Server Error:** 서버 오류

## 인증 및 권한

- 모든 API는 인증된 요청만 처리합니다.
- 본사관리자 역할을 가진 사용자만 API에 접근할 수 있습니다.
- 인증 및 권한은 Clerk를 통해 관리됩니다.

## 비고

- 실제 환경에서는 더 견고한 권한 검증이 필요합니다.
- 비밀번호는 임의로 생성되므로, 사용자는 '비밀번호 재설정' 기능을 사용하여 비밀번호를 설정해야 합니다. 