'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 동적 임포트로 컴포넌트 로드
const KOLDataEntry = dynamic(() => import('./components/kol-data-entry'), { ssr: false });
const ShopDataEntry = dynamic(() => import('./components/shop-data-entry'), { ssr: false });

export default function KOLDataEntryPage() {
  const [activeTab, setActiveTab] = useState<'kol' | 'shop'>('kol');
  
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">KOL 데이터 입력</h1>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'kol'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('kol')}
        >
          KOL 데이터 입력
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'shop'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('shop')}
        >
          전문점 매출 데이터 입력
        </button>
      </div>
      
      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'kol' && <KOLDataEntry />}
        {activeTab === 'shop' && <ShopDataEntry />}
      </div>
    </div>
  );
} 