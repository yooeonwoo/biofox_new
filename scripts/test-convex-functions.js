#!/usr/bin/env node

/**
 * Convex 함수 단위 테스트 실행 스크립트
 *
 * 이 스크립트는 Convex 함수들의 단위 테스트를 실행하고
 * 테스트 결과를 종합적으로 분석합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 환경 변수 설정
const CONVEX_TEST_ENV = process.env.CONVEX_TEST_ENV || 'test';
const VERBOSE = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
const COVERAGE = process.env.COVERAGE === 'true' || process.argv.includes('--coverage');
const WATCH_MODE = process.argv.includes('--watch');

console.log('🧪 Convex 함수 단위 테스트를 시작합니다...');
console.log(`📍 테스트 환경: ${CONVEX_TEST_ENV}`);

/**
 * 명령어 실행 헬퍼 함수
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: VERBOSE ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        CONVEX_TEST_ENV,
        ...options.env,
      },
      ...options,
    });

    let stdout = '';
    let stderr = '';

    if (!VERBOSE) {
      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });
    }

    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      }
    });
  });
}

/**
 * Convex 테스트 파일 검색
 */
function findConvexTestFiles() {
  const convexDir = path.join(process.cwd(), 'convex');

  if (!fs.existsSync(convexDir)) {
    throw new Error('Convex 디렉토리를 찾을 수 없습니다.');
  }

  const testFiles = fs
    .readdirSync(convexDir)
    .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.js'))
    .map(file => path.join(convexDir, file));

  return testFiles;
}

/**
 * 테스트 의존성 확인
 */
function checkTestDependencies() {
  console.log('🔍 테스트 의존성을 확인합니다...');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const requiredDeps = ['convex-test', 'vitest', '@edge-runtime/vm'];
  const missingDeps = requiredDeps.filter(
    dep => !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.error(`❌ 필수 의존성이 누락되었습니다: ${missingDeps.join(', ')}`);
    console.log('다음 명령어로 설치하세요:');
    console.log(`npm install --save-dev ${missingDeps.join(' ')}`);
    process.exit(1);
  }

  console.log('  ✅ 모든 테스트 의존성이 설치되어 있습니다.');
}

/**
 * Vitest 설정 확인
 */
function checkVitestConfig() {
  console.log('⚙️  Vitest 설정을 확인합니다...');

  const configPath = path.join(process.cwd(), 'vitest.config.ts');

  if (!fs.existsSync(configPath)) {
    console.warn('⚠️  vitest.config.ts 파일이 없습니다.');
    return false;
  }

  const configContent = fs.readFileSync(configPath, 'utf8');

  // edge-runtime 환경 설정 확인
  const hasEdgeRuntime = configContent.includes('edge-runtime');
  const hasConvexTestInline = configContent.includes('convex-test');

  if (!hasEdgeRuntime) {
    console.warn('⚠️  Vitest 설정에 edge-runtime 환경이 구성되지 않았습니다.');
  }

  if (!hasConvexTestInline) {
    console.warn('⚠️  Vitest 설정에 convex-test 인라인 의존성이 구성되지 않았습니다.');
  }

  if (hasEdgeRuntime && hasConvexTestInline) {
    console.log('  ✅ Vitest 설정이 올바르게 구성되어 있습니다.');
    return true;
  }

  return false;
}

/**
 * 메인 테스트 실행 함수
 */
async function runConvexTests() {
  try {
    // 의존성 및 설정 확인
    checkTestDependencies();
    checkVitestConfig();

    // 테스트 파일 검색
    const testFiles = findConvexTestFiles();

    if (testFiles.length === 0) {
      console.log('📝 Convex 테스트 파일이 없습니다.');
      console.log('다음 파일들을 생성하여 테스트를 시작하세요:');
      console.log('  - convex/profiles.test.ts');
      console.log('  - convex/auth.test.ts');
      console.log('  - convex/orders.test.ts');
      return;
    }

    console.log(`📋 발견된 테스트 파일: ${testFiles.length}개`);
    testFiles.forEach(file => {
      console.log(`  - ${path.relative(process.cwd(), file)}`);
    });

    // Vitest 명령어 구성
    const vitestArgs = ['run'];

    if (WATCH_MODE) {
      vitestArgs[0] = 'watch';
    }

    if (COVERAGE) {
      vitestArgs.push('--coverage');
      vitestArgs.push('--coverage.reporter=text');
      vitestArgs.push('--coverage.reporter=json-summary');
    }

    // Convex 테스트만 실행하도록 패턴 지정
    vitestArgs.push('convex/**/*.test.{ts,js}');

    if (VERBOSE) {
      vitestArgs.push('--reporter=verbose');
    }

    console.log('\n🚀 테스트를 실행합니다...');
    console.log(`명령어: npx vitest ${vitestArgs.join(' ')}\n`);

    // 테스트 실행
    const result = await runCommand('npx', ['vitest', ...vitestArgs]);

    console.log('\n✅ Convex 함수 테스트가 완료되었습니다!');

    // 커버리지 결과 표시
    if (COVERAGE) {
      const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryPath)) {
        console.log('\n📊 커버리지 요약:');
        const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        const total = coverageSummary.total;

        console.log(`  Lines: ${total.lines.pct}%`);
        console.log(`  Functions: ${total.functions.pct}%`);
        console.log(`  Branches: ${total.branches.pct}%`);
        console.log(`  Statements: ${total.statements.pct}%`);
      }
    }

    return result;
  } catch (error) {
    console.error('\n❌ Convex 함수 테스트 실행 중 오류가 발생했습니다:');
    console.error(error.message);

    if (VERBOSE) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

/**
 * 도움말 표시
 */
function showHelp() {
  console.log(`
🧪 Convex 함수 테스트 실행기

사용법: node scripts/test-convex-functions.js [옵션]

옵션:
  --help        이 도움말을 표시합니다
  --verbose     상세한 출력을 표시합니다
  --coverage    코드 커버리지를 측정합니다
  --watch       파일 변경을 감지하고 자동으로 테스트를 재실행합니다

환경 변수:
  CONVEX_TEST_ENV    테스트 환경 (기본값: test)
  VERBOSE           상세 출력 활성화 (true/false)
  COVERAGE          커버리지 측정 활성화 (true/false)

예시:
  node scripts/test-convex-functions.js
  node scripts/test-convex-functions.js --coverage
  node scripts/test-convex-functions.js --watch --verbose
  COVERAGE=true node scripts/test-convex-functions.js
`);
}

// 스크립트 실행
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  runConvexTests()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('예상치 못한 오류:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runConvexTests,
  findConvexTestFiles,
  checkTestDependencies,
  checkVitestConfig,
};
