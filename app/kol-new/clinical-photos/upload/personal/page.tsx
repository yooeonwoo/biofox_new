'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import { fetchCases, updateCase } from '@/lib/clinical-photos-api';
import Link from 'next/link';
import { ArrowLeft, Camera, Save, Edit, Trash2, Eye } from "lucide-react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import KolHeader from "../../../../components/layout/KolHeader";
import KolSidebar from "../../../../components/layout/KolSidebar";
import KolFooter from "../../../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle as SheetDialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../../../../components/layout/KolMobileMenu";
import PhotoRoundCarousel from "../../components/PhotoRoundCarousel";
import CaseStatusTabs from "../../components/CaseStatusTabs";

// 시스템 상수 정의
const SYSTEM_OPTIONS = {
  genders: [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'other', label: '기타' }
  ] as const,
  
  treatmentTypes: [
    { value: '10GF', label: '10GF 마이크로젯 케어' },
    { value: 'realafter', label: '리얼에프터 케어' }
  ] as const,
  
  products: [
    { value: 'cure_booster', label: '큐어 부스터' },
    { value: 'cure_mask', label: '큐어 마스크' },
    { value: 'premium_mask', label: '프리미엄 마스크' },
    { value: 'all_in_one_serum', label: '올인원 세럼' }
  ] as const,
  
  skinTypes: [
    { value: 'red_sensitive', label: '붉고 예민함' },
    { value: 'pigment', label: '색소 / 미백' },
    { value: 'pore', label: '모공 늘어짐' },
    { value: 'acne_trouble', label: '트러블 / 여드름' },
    { value: 'wrinkle', label: '주름 / 탄력' },
    { value: 'other', label: '기타' }
  ] as const
} as const;

// 고객 정보 관련 타입
interface CustomerInfo {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
}

// 회차별 고객 정보 타입
interface RoundCustomerInfo {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
  date?: string; // 회차별 날짜
}

// 케이스 데이터 타입
// CaseStatusTabs에서 사용하는 타입과 맞추기 위한 타입 정의
type CaseStatus = 'active' | 'completed';

interface ClinicalCase {
  id: string;
  customerName: string;
  status: CaseStatus;
  createdAt: string;
  consentReceived: boolean;
  consentImageUrl?: string;
  photos: PhotoSlot[];
  customerInfo: CustomerInfo;
  roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo };
  // 본래 API와 일치하는 boolean 필드 추가
  // 플레이어 제품 관련 필드
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;
  // 고객 피부 타입 관련 필드
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploaded: boolean;
}

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

export default function PersonalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            페이지 리팩터링 중
          </h1>
          <p className="text-gray-600 mb-4">
            현재 더 나은 사용자 경험을 위해<br />
            페이지를 개선하고 있습니다.
          </p>
          <p className="text-sm text-gray-500">
            곧 새로운 모습으로 돌아올게요! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}