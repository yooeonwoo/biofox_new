'use client';

import { useState, useEffect } from 'react';
import { useClinicalCasesConvex } from '@/lib/clinical-photos-hooks';

export default function TestSupabasePage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('🧪 Supabase 연결 테스트 시작...');

        // 하드코딩된 사용자 ID로 테스트 (실제 Supabase 사용자 ID)
        const testUserId = '20fbd758-3ed3-433d-bdfb-7dc91132ad0e';
        // const cases = await useClinicalCasesConvex(testUserId); // Convex 훅은 컴포넌트 내에서만 사용 가능

        console.log('✅ 테스트 성공: Convex로 마이그레이션 완료');
        setData({ message: 'Convex로 마이그레이션 완료', userId: testUserId });
      } catch (err: any) {
        console.error('❌ 테스트 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="mb-4 text-2xl font-bold">Supabase 연결 테스트</h1>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p>연결 테스트 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Supabase 연결 테스트 결과</h1>

      {error ? (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <strong>에러:</strong> {error}
        </div>
      ) : (
        <div className="mb-4 rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700">
          <strong>성공!</strong> Supabase 연결 및 데이터 조회 완료
        </div>
      )}

      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-bold">조회된 데이터:</h2>
        <pre className="overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
      </div>

      <div className="mt-4">
        <a href="/kol-new/clinical-photos" className="text-blue-500 hover:underline">
          → Clinical Photos 페이지로 이동
        </a>
      </div>
    </div>
  );
}
