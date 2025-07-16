-- =========================================
-- BIOFOX KOL 시스템 초기 스키마
-- Phase 1: 기본 테이블 및 타입 정의
-- =========================================

-- 1. 커스텀 타입 정의
-- =========================================

-- 사용자 역할
CREATE TYPE user_role_enum AS ENUM ('admin', 'kol', 'ol', 'shop_owner');

-- 승인 상태
CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');

-- Yes/No 타입
CREATE TYPE yn_enum AS ENUM ('Y', 'N');

-- 평가 등급
CREATE TYPE rating_enum AS ENUM ('상', '중', '하');

-- 우선순위
CREATE TYPE priority_enum AS ENUM ('high', 'normal', 'low');

-- 교육 상태
CREATE TYPE education_status_enum AS ENUM (
  'not_started', 'applied', 'in_progress', 'completed', 'cancelled'
);

-- 성별
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');

-- 임