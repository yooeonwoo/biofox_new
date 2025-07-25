import '@/tests/setup';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  createCase,
  fetchCase,
  updateCase,
  deleteCase,
} from '@/lib/clinical-photos';

import * as clinicalApi from '@/lib/clinical-photos';

// 통합 테스트는 실제 Supabase 연결이 필요합니다.
// 환경변수 미설정 시 테스트를 건너뜁니다.
const skip = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

process.env.TEST_KOL_ID = '00000000-0000-4000-8000-000000000001';

(skip ? describe.skip : describe)('clinical-photos-api integration', () => {
  let createdCaseId: number;
  const uniqueName = `통합테스트_${Date.now()}`;

  // 테스트용 KOL UUID 이미 env로 설정되어 별도 스텁 필요 없음

  it('createCase → fetchCase', async () => {
    const newCase = await createCase({
      customerName: uniqueName,
      caseName: `케이스_${uniqueName}`,
    });
    expect(newCase).toBeTruthy();
    createdCaseId = newCase!.id;

    const fetched = await fetchCase(createdCaseId);
    expect(fetched?.customerName).toBe(uniqueName);
  }, 20_000);

  it('updateCase 변경사항 반영', async () => {
    const updated = await updateCase(createdCaseId, { concernArea: '리액트테스트' });
    expect(updated?.concernArea).toBe('리액트테스트');
  }, 20_000);

  afterAll(async () => {
    if (createdCaseId) {
      await deleteCase(createdCaseId);
    }
  });
}); 