'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, Store, PieChart } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';

// 대시보드 카드 컴포넌트
function DashboardCard({
  title,
  description,
  icon,
  linkText,
  linkHref,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkHref: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-md">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link 
        href={linkHref}
        className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
      >
        {linkText}
        <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </Link>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AdminDashboardMainPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [stats, setStats] = useState({
    kolsCount: 0,
    shopsCount: 0,
    productsCount: 0,
    isLoading: true
  });

  useEffect(() => {
    // Clerk 로딩 및 인증 확인
    if (!isLoaded || !isSignedIn) return;

    async function fetchStats() {
      try {
        // Supabase 클라이언트 생성
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // KOL 수 조회
        const { data: kols, error: kolsError } = await supabase
          .from('kols')
          .select('id', { count: 'exact' });

        // 전문점 수 조회
        const { data: shops, error: shopsError } = await supabase
          .from('shops')
          .select('id', { count: 'exact' });

        // 제품 수 조회
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id', { count: 'exact' });

        if (kolsError || shopsError || productsError) {
          console.error('데이터 조회 중 오류 발생:', { kolsError, shopsError, productsError });
        }

        setStats({
          kolsCount: kols?.length || 0,
          shopsCount: shops?.length || 0,
          productsCount: products?.length || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('통계 데이터 조회 오류:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, [isLoaded, isSignedIn]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
      
      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.isLoading ? (
          // 로딩 표시
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard title="전체 KOL 수" value={stats.kolsCount} />
            <StatCard title="전체 전문점 수" value={stats.shopsCount} />
            <StatCard title="전체 제품 수" value={stats.productsCount} />
          </>
        )}
      </div>
      
      {/* 관리 섹션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="KOL 및 전문점 관리"
          description="KOL과 전문점 정보를 추가, 수정, 조회합니다."
          icon={<Users size={24} />}
          linkText="관리하기"
          linkHref="/foxadmin/entities"
        />
        
        <DashboardCard
          title="KOL 월별 지표 관리"
          description="KOL의 월별 실적 및 통계 데이터를 관리합니다."
          icon={<BarChart3 size={24} />}
          linkText="관리하기"
          linkHref="/foxadmin/kol-metrics"
        />
        
        <DashboardCard
          title="전문점 매출 관리"
          description="전문점별 매출 데이터를 관리합니다."
          icon={<Store size={24} />}
          linkText="관리하기"
          linkHref="/foxadmin/shop-sales"
        />
        
        <DashboardCard
          title="제품 매출 비율 관리"
          description="제품별 매출 비율 및 수량을 관리합니다."
          icon={<PieChart size={24} />}
          linkText="관리하기"
          linkHref="/foxadmin/product-sales"
        />
      </div>
    </div>
  );
} 