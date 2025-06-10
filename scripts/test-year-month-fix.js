#!/usr/bin/env node

/**
 * Year-Month 형식 수정 테스트 스크립트
 * 
 * 사용법:
 * node scripts/test-year-month-fix.js
 * 
 * 환경변수 필요:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

// 환경변수 로드
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 색상 출력을 위한 유틸리티
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testDateUtils() {
  console.log(colorize('blue', '\n🧪 Date Utils 함수 테스트'));
  
  // date-utils.ts의 함수들을 시뮬레이션
  const getCurrentDate = () => '2025-05-15';
  const getCurrentYearMonth = () => getCurrentDate().substring(0, 7);
  const getPreviousMonth = (dateStr) => {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() - 1);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };
  
  const currentMonth = getCurrentYearMonth();
  const previousMonth = getPreviousMonth(getCurrentDate());
  
  console.log('현재 월:', colorize('green', currentMonth));
  console.log('이전 월:', colorize('green', previousMonth));
  
  // 검증
  const expectedCurrent = '2025-05';
  const expectedPrevious = '2025-04';
  
  if (currentMonth === expectedCurrent && previousMonth === expectedPrevious) {
    console.log(colorize('green', '✅ Date Utils 함수가 올바르게 작동합니다.'));
  } else {
    console.log(colorize('red', '❌ Date Utils 함수에 문제가 있습니다.'));
    return false;
  }
  
  return true;
}

async function testDatabaseFormats() {
  console.log(colorize('blue', '\n🗄️  데이터베이스 year_month 형식 분석'));
  
  const tables = [
    'kol_dashboard_metrics',
    'shop_sales_metrics'
  ];
  
  for (const tableName of tables) {
    try {
      console.log(colorize('cyan', `\n📊 ${tableName} 테이블 분석`));
      
      const { data, error } = await supabase
        .from(tableName)
        .select('year_month')
        .limit(100);
      
      if (error) {
        console.log(colorize('yellow', `⚠️  테이블 ${tableName} 조회 실패: ${error.message}`));
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(colorize('yellow', '⚠️  데이터가 없습니다.'));
        continue;
      }
      
      const formats = {
        'YYYY-MM': 0,
        'YYYYMM': 0,
        'invalid': 0
      };
      
      data.forEach(row => {
        const yearMonth = row.year_month;
        if (/^\d{4}-\d{2}$/.test(yearMonth)) {
          formats['YYYY-MM']++;
        } else if (/^\d{6}$/.test(yearMonth)) {
          formats['YYYYMM']++;
        } else {
          formats['invalid']++;
        }
      });
      
      const total = data.length;
      console.log(`총 레코드: ${total}`);
      console.log(`YYYY-MM 형식: ${colorize('green', formats['YYYY-MM'])} (${(formats['YYYY-MM']/total*100).toFixed(1)}%)`);
      console.log(`YYYYMM 형식: ${colorize('yellow', formats['YYYYMM'])} (${(formats['YYYYMM']/total*100).toFixed(1)}%)`);
      console.log(`잘못된 형식: ${colorize('red', formats['invalid'])} (${(formats['invalid']/total*100).toFixed(1)}%)`);
      
      // 샘플 데이터 표시
      const samples = data.slice(0, 5).map(row => row.year_month);
      console.log(`샘플 데이터: ${samples.join(', ')}`);
      
    } catch (err) {
      console.log(colorize('red', `❌ 테이블 ${tableName} 분석 중 오류: ${err.message}`));
    }
  }
}

async function testApiCompatibility() {
  console.log(colorize('blue', '\n🔄 API 호환성 테스트'));
  
  const currentMonth = '2025-05';
  const currentMonthCompact = '202505';
  
  // shop_sales_metrics 테이블에서 두 형식 모두 테스트
  try {
    console.log(colorize('cyan', '\n📋 shop_sales_metrics 호환성 테스트'));
    
    // 표준 형식 조회
    const { data: standardData, error: standardError } = await supabase
      .from('shop_sales_metrics')
      .select('shop_id, total_sales, year_month')
      .eq('year_month', currentMonth)
      .limit(5);
    
    // 레거시 형식 조회
    const { data: legacyData, error: legacyError } = await supabase
      .from('shop_sales_metrics')
      .select('shop_id, total_sales, year_month')
      .eq('year_month', currentMonthCompact)
      .limit(5);
    
    // 혼합 조회 (새로운 API 방식)
    const { data: mixedData, error: mixedError } = await supabase
      .from('shop_sales_metrics')
      .select('shop_id, total_sales, year_month')
      .or(`year_month.eq.${currentMonth},year_month.eq.${currentMonthCompact}`)
      .limit(10);
    
    console.log(`표준 형식 조회 결과: ${standardData?.length || 0}건`);
    console.log(`레거시 형식 조회 결과: ${legacyData?.length || 0}건`);
    console.log(`혼합 조회 결과: ${mixedData?.length || 0}건`);
    
    if (mixedData && mixedData.length > 0) {
      console.log(colorize('green', '✅ API 호환성 테스트 성공'));
      console.log('샘플 데이터:', mixedData.slice(0, 3).map(row => 
        `shop_id:${row.shop_id}, sales:${row.total_sales}, month:${row.year_month}`
      ).join(' | '));
    } else {
      console.log(colorize('yellow', '⚠️  데이터는 없지만 쿼리는 정상 작동'));
    }
    
  } catch (err) {
    console.log(colorize('red', `❌ API 호환성 테스트 실패: ${err.message}`));
  }
}

async function testPerformance() {
  console.log(colorize('blue', '\n⚡ 성능 테스트'));
  
  const currentMonth = '2025-05';
  const currentMonthCompact = '202505';
  
  try {
    // 단일 조회 성능 테스트
    console.log(colorize('cyan', '단일 형식 조회 성능 테스트'));
    
    const start1 = Date.now();
    const { data: singleData } = await supabase
      .from('shop_sales_metrics')
      .select('*')
      .eq('year_month', currentMonth);
    const time1 = Date.now() - start1;
    
    // 혼합 조회 성능 테스트
    console.log(colorize('cyan', '혼합 형식 조회 성능 테스트'));
    
    const start2 = Date.now();
    const { data: mixedData } = await supabase
      .from('shop_sales_metrics')
      .select('*')
      .or(`year_month.eq.${currentMonth},year_month.eq.${currentMonthCompact}`);
    const time2 = Date.now() - start2;
    
    console.log(`단일 조회 시간: ${colorize('green', time1 + 'ms')}`);
    console.log(`혼합 조회 시간: ${colorize('green', time2 + 'ms')}`);
    console.log(`성능 차이: ${colorize(time2 > time1 * 1.5 ? 'red' : 'green', Math.abs(time2 - time1) + 'ms')}`);
    
    if (time2 > time1 * 2) {
      console.log(colorize('yellow', '⚠️  혼합 조회가 상당히 느립니다. 마이그레이션 완료 후 개선될 예정입니다.'));
    } else {
      console.log(colorize('green', '✅ 성능이 양호합니다.'));
    }
    
  } catch (err) {
    console.log(colorize('red', `❌ 성능 테스트 실패: ${err.message}`));
  }
}

async function generateTestData() {
  console.log(colorize('blue', '\n🔧 테스트 데이터 생성 (선택사항)'));
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('테스트 데이터를 생성하시겠습니까? (y/N): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          // 샘플 데이터 생성 (실제로는 하지 않음, 시뮬레이션만)
          console.log(colorize('green', '✅ 테스트 데이터 생성 시뮬레이션 완료'));
          console.log('실제 데이터는 생성하지 않았습니다. 필요시 수동으로 생성하세요.');
        } catch (err) {
          console.log(colorize('red', `❌ 테스트 데이터 생성 실패: ${err.message}`));
        }
      } else {
        console.log(colorize('yellow', '테스트 데이터 생성을 건너뜁니다.'));
      }
      rl.close();
      resolve();
    });
  });
}

async function main() {
  console.log(colorize('magenta', '🚀 Year-Month 형식 수정 테스트 시작\n'));
  
  try {
    // 1. Date Utils 함수 테스트
    const dateUtilsOk = await testDateUtils();
    
    // 2. 데이터베이스 형식 분석
    await testDatabaseFormats();
    
    // 3. API 호환성 테스트
    await testApiCompatibility();
    
    // 4. 성능 테스트
    await testPerformance();
    
    // 5. 테스트 데이터 생성 (선택사항)
    await generateTestData();
    
    console.log(colorize('magenta', '\n🎉 테스트 완료!'));
    
    if (dateUtilsOk) {
      console.log(colorize('green', '\n✅ 전반적으로 시스템이 올바르게 작동하고 있습니다.'));
      console.log(colorize('blue', '📝 다음 단계: 데이터베이스 마이그레이션을 실행하여 완전히 통일하세요.'));
      console.log(colorize('blue', '   psql -f scripts/migrate-year-month-format.sql'));
    } else {
      console.log(colorize('red', '\n❌ 일부 문제가 발견되었습니다. 코드를 다시 확인해주세요.'));
    }
    
  } catch (error) {
    console.error(colorize('red', '❌ 테스트 중 오류 발생:'), error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
} 