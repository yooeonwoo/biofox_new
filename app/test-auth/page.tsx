'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  // Convex queries
  const profile = useQuery(
    api.supabaseAuth.getProfileBySupabaseId,
    currentUser ? { supabaseUserId: currentUser.id } : 'skip'
  );

  const syncProfile = useMutation(api.supabaseAuth.syncSupabaseProfile);
  const updateProfile = useMutation(api.supabaseAuth.updateProfileBySupabaseId);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  // 1. Supabase 회원가입 테스트
  const testSignUp = async () => {
    try {
      addTestResult('🔄 Supabase 회원가입 시작...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Test User',
            shop_name: 'Test Shop',
            role: 'shop_owner',
            region: '서울',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        addTestResult('✅ Supabase 회원가입 성공');
        addTestResult(`- User ID: ${data.user.id}`);
        addTestResult(`- Email: ${data.user.email}`);
        setCurrentUser(data.user);
      }
    } catch (error: any) {
      addTestResult(`❌ 회원가입 실패: ${error.message}`);
    }
  };

  // 2. Supabase 로그인 테스트
  const testSignIn = async () => {
    try {
      addTestResult('🔄 Supabase 로그인 시작...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        addTestResult('✅ Supabase 로그인 성공');
        addTestResult(`- User ID: ${data.user.id}`);
        setCurrentUser(data.user);
      }
    } catch (error: any) {
      addTestResult(`❌ 로그인 실패: ${error.message}`);
    }
  };

  // 3. Convex 프로필 동기화 테스트
  const testSyncProfile = async () => {
    if (!currentUser) {
      addTestResult('❌ 로그인된 사용자가 없습니다');
      return;
    }

    try {
      addTestResult('🔄 Convex 프로필 동기화 시작...');

      const profileId = await syncProfile({
        supabaseUserId: currentUser.id,
        email: currentUser.email!,
        metadata: currentUser.user_metadata,
      });

      addTestResult('✅ Convex 프로필 동기화 성공');
      addTestResult(`- Profile ID: ${profileId}`);
    } catch (error: any) {
      addTestResult(`❌ 프로필 동기화 실패: ${error.message}`);
    }
  };

  // 4. Convex 프로필 조회 테스트
  const testGetProfile = async () => {
    if (!currentUser) {
      addTestResult('❌ 로그인된 사용자가 없습니다');
      return;
    }

    addTestResult('🔄 Convex 프로필 조회 중...');

    if (profile) {
      addTestResult('✅ Convex 프로필 조회 성공');
      addTestResult(`- Name: ${profile.name}`);
      addTestResult(`- Shop: ${profile.shop_name}`);
      addTestResult(`- Role: ${profile.role}`);
      addTestResult(`- Status: ${profile.status}`);
    } else {
      addTestResult('❌ 프로필이 없습니다');
    }
  };

  // 5. Convex 프로필 업데이트 테스트
  const testUpdateProfile = async () => {
    if (!currentUser) {
      addTestResult('❌ 로그인된 사용자가 없습니다');
      return;
    }

    try {
      addTestResult('🔄 Convex 프로필 업데이트 시작...');

      await updateProfile({
        supabaseUserId: currentUser.id,
        name: 'Updated Test User',
        shop_name: 'Updated Test Shop',
        region: '부산',
        naver_place_link: 'https://naver.com/test',
      });

      addTestResult('✅ Convex 프로필 업데이트 성공');
    } catch (error: any) {
      addTestResult(`❌ 프로필 업데이트 실패: ${error.message}`);
    }
  };

  // 6. 로그아웃 테스트
  const testSignOut = async () => {
    try {
      addTestResult('🔄 로그아웃 시작...');

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      addTestResult('✅ 로그아웃 성공');
      setCurrentUser(null);
    } catch (error: any) {
      addTestResult(`❌ 로그아웃 실패: ${error.message}`);
    }
  };

  // 7. 현재 세션 확인
  const checkSession = async () => {
    try {
      addTestResult('🔄 현재 세션 확인 중...');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        addTestResult('✅ 활성 세션 발견');
        addTestResult(`- User ID: ${session.user.id}`);
        addTestResult(`- Email: ${session.user.email}`);
        setCurrentUser(session.user);
      } else {
        addTestResult('❌ 활성 세션이 없습니다');
      }
    } catch (error: any) {
      addTestResult(`❌ 세션 확인 실패: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Supabase + Convex 인증 시스템 테스트</h1>

      {/* 입력 폼 */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">테스트 계정 정보</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="password123"
            />
          </div>
        </div>
      </div>

      {/* 테스트 버튼 */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">테스트 액션</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={testSignUp}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            1. 회원가입
          </button>
          <button
            onClick={testSignIn}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            2. 로그인
          </button>
          <button
            onClick={testSyncProfile}
            className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            3. 프로필 동기화
          </button>
          <button
            onClick={testGetProfile}
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            4. 프로필 조회
          </button>
          <button
            onClick={testUpdateProfile}
            className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          >
            5. 프로필 업데이트
          </button>
          <button
            onClick={testSignOut}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            6. 로그아웃
          </button>
          <button
            onClick={checkSession}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            7. 세션 확인
          </button>
          <button
            onClick={() => setTestResults([])}
            className="rounded bg-slate-500 px-4 py-2 text-white hover:bg-slate-600"
          >
            결과 초기화
          </button>
        </div>
      </div>

      {/* 현재 상태 */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">현재 상태</h2>
        <div className="space-y-2">
          <p>
            <strong>Supabase User:</strong> {currentUser ? currentUser.email : '로그인 안됨'}
          </p>
          <p>
            <strong>Convex Profile:</strong> {profile ? profile.name : '프로필 없음'}
          </p>
        </div>
      </div>

      {/* 테스트 결과 */}
      <div className="rounded-lg bg-gray-900 p-6 text-green-400 shadow">
        <h2 className="mb-4 text-xl font-semibold">테스트 결과</h2>
        <div className="max-h-96 space-y-1 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500">테스트를 시작하려면 위 버튼을 클릭하세요</p>
          ) : (
            testResults.map((result, index) => <div key={index}>{result}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
