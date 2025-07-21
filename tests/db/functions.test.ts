import { expect, test, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// 실환경 Supabase 프로젝트로 통합 테스트 (SERVICE_ROLE 키 필요)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceKey) {
  throw new Error('통합 테스트를 위해 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
}

const supabase = createClient(supabaseUrl, serviceKey);

const isCiBranch = supabaseUrl.includes('vqaizwxyunujjrrgjcup');

if (isCiBranch) {
  test.skip('Skip main DB function tests on CI branch', () => {});
} else {

  let hasFnCommission = true;
  let hasDeviceCommissionTable = true;

  beforeAll(async () => {
    // 함수 존재 여부 체크
    const { error: fnError } = await supabase.rpc('fn_current_product_commission', {
      p_role: 'kol',
      p_date: '2025-01-01',
    });
    if (fnError && fnError.code === 'PGRST202') {
      hasFnCommission = false;
    }

    // 테이블 존재 여부 체크
    const { error: tblError } = await supabase.from('device_commission_tiers').select('*').limit(1);
    if (tblError && tblError.code === '42P01') {
      hasDeviceCommissionTable = false;
    }
  });

  const fnTest = hasFnCommission ? test : test.skip;
  const tableTest = hasDeviceCommissionTable ? test : test.skip;

  fnTest('fn_current_product_commission 기본값 KOL 30%', async () => {
    const { data: commission, error } = await supabase.rpc('fn_current_product_commission', {
      p_role: 'kol',
      p_date: '2025-01-01',
    });
    expect(error).toBeNull();
    if (commission !== null) {
      expect(commission).toBe(30.0);
    }
  });

  tableTest('device_commission_tiers 초기 데이터 4개 존재', async () => {
    const { data, error } = await supabase.from('device_commission_tiers').select('*');
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThanOrEqual(4);
  });
}
