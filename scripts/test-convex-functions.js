#!/usr/bin/env node

/**
 * Convex 함수 테스트 스크립트
 * CI/CD에서 Convex 함수들의 무결성을 검증합니다.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CONVEX_DIR = path.join(__dirname, '..', 'convex');
const TEST_TIMEOUT = 60000; // 60초

console.log('🔮 Convex 함수 테스트를 시작합니다...');

class ConvexTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runTests() {
    console.log('📁 Convex 디렉토리 확인 중...');

    // 1. Convex 디렉토리 존재 확인
    if (!fs.existsSync(CONVEX_DIR)) {
      this.addError('Convex 디렉토리가 존재하지 않습니다.');
      return false;
    }

    // 2. 필수 파일들 확인
    await this.checkRequiredFiles();

    // 3. TypeScript 컴파일 테스트
    await this.testTypeScriptCompilation();

    // 4. 함수 파일 구문 검사
    await this.testFunctionSyntax();

    // 5. 스키마 검증
    await this.testSchema();

    // 6. 의존성 검사
    await this.testDependencies();

    // 결과 출력
    this.printResults();

    return this.failed === 0;
  }

  async checkRequiredFiles() {
    console.log('📋 필수 파일 확인 중...');

    const requiredFiles = [
      'tsconfig.json',
      '_generated/api.d.ts',
      '_generated/api.js',
      '_generated/dataModel.d.ts',
    ];

    const optionalFiles = [
      'auth.ts',
      'utils.ts',
      'realtime.ts',
      'profiles.ts',
      'orders.ts',
      'notifications.ts',
    ];

    // 필수 파일 검사
    for (const file of requiredFiles) {
      const filePath = path.join(CONVEX_DIR, file);
      if (fs.existsSync(filePath)) {
        this.addPass(`✅ ${file} 존재 확인`);
      } else {
        this.addError(`❌ 필수 파일 누락: ${file}`);
      }
    }

    // 선택적 파일 검사
    for (const file of optionalFiles) {
      const filePath = path.join(CONVEX_DIR, file);
      if (fs.existsSync(filePath)) {
        this.addPass(`✅ ${file} 존재 확인`);
      } else {
        this.addWarning(`⚠️ 선택적 파일 누락: ${file}`);
      }
    }
  }

  async testTypeScriptCompilation() {
    console.log('🔧 TypeScript 컴파일 테스트 중...');

    return new Promise(resolve => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--project', 'convex/tsconfig.json'], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout.on('data', data => {
        output += data.toString();
      });

      tsc.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      tsc.on('close', code => {
        if (code === 0) {
          this.addPass('✅ TypeScript 컴파일 성공');
        } else {
          this.addError(`❌ TypeScript 컴파일 실패 (exit code: ${code})`);
          if (errorOutput) {
            this.addError(`컴파일 오류: ${errorOutput.slice(0, 500)}...`);
          }
        }
        resolve();
      });

      // 타임아웃 설정
      setTimeout(() => {
        tsc.kill();
        this.addError('❌ TypeScript 컴파일 타임아웃');
        resolve();
      }, TEST_TIMEOUT);
    });
  }

  async testFunctionSyntax() {
    console.log('🔍 함수 파일 구문 검사 중...');

    const functionFiles = this.getFunctionFiles();

    for (const file of functionFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // 기본 구문 검사
        if (this.checkBasicSyntax(content, file)) {
          this.addPass(`✅ ${path.basename(file)} 구문 검사 통과`);
        }

        // Convex 특화 검사
        this.checkConvexPatterns(content, file);
      } catch (error) {
        this.addError(`❌ ${path.basename(file)} 읽기 실패: ${error.message}`);
      }
    }
  }

  getFunctionFiles() {
    const files = [];

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('_')) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    }

    scanDirectory(CONVEX_DIR);
    return files;
  }

  checkBasicSyntax(content, filePath) {
    const fileName = path.basename(filePath);

    // 기본적인 Convex 패턴 검사
    const patterns = {
      hasImports: /import\s+.+from\s+['"].+['"];?/,
      hasExports: /export\s+(const|function|default)/,
      hasConvexImport: /from\s+['"]\.?\/?_generated\/server['"];?/,
    };

    let passed = true;

    // Convex 함수 파일이라면 _generated/server import가 있어야 함
    if (!patterns.hasConvexImport.test(content)) {
      this.addWarning(`⚠️ ${fileName}: Convex server import가 없습니다.`);
    }

    // export가 있어야 함
    if (!patterns.hasExports.test(content)) {
      this.addError(`❌ ${fileName}: export가 없습니다.`);
      passed = false;
    }

    return passed;
  }

  checkConvexPatterns(content, filePath) {
    const fileName = path.basename(filePath);

    // Convex 쿼리/뮤테이션 패턴 검사
    const convexPatterns = {
      query: /export\s+const\s+\w+\s*=\s*query\s*\(/,
      mutation: /export\s+const\s+\w+\s*=\s*mutation\s*\(/,
      action: /export\s+const\s+\w+\s*=\s*action\s*\(/,
    };

    let hasConvexFunction = false;

    for (const [type, pattern] of Object.entries(convexPatterns)) {
      if (pattern.test(content)) {
        hasConvexFunction = true;
        break;
      }
    }

    if (!hasConvexFunction && !fileName.includes('utils') && !fileName.includes('types')) {
      this.addWarning(`⚠️ ${fileName}: Convex 함수(query/mutation/action)가 없습니다.`);
    }

    // 비동기 함수 검사
    if (content.includes('query(') || content.includes('mutation(')) {
      if (!content.includes('async')) {
        this.addWarning(`⚠️ ${fileName}: Convex 함수에 async가 없을 수 있습니다.`);
      }
    }
  }

  async testSchema() {
    console.log('📊 스키마 검증 중...');

    const schemaFile = path.join(CONVEX_DIR, 'schema.ts');

    if (fs.existsSync(schemaFile)) {
      try {
        const content = fs.readFileSync(schemaFile, 'utf8');

        if (content.includes('defineSchema') && content.includes('export default')) {
          this.addPass('✅ 스키마 파일 구조 정상');
        } else {
          this.addError('❌ 스키마 파일 구조 이상');
        }
      } catch (error) {
        this.addError(`❌ 스키마 파일 읽기 실패: ${error.message}`);
      }
    } else {
      this.addWarning('⚠️ schema.ts 파일이 없습니다.');
    }
  }

  async testDependencies() {
    console.log('📦 의존성 검사 중...');

    try {
      const packageJsonPath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const requiredDeps = ['convex'];
      const optionalDeps = ['@convex-dev/auth'];

      // 필수 의존성 검사
      for (const dep of requiredDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addPass(`✅ 필수 의존성 ${dep} 설치됨`);
        } else {
          this.addError(`❌ 필수 의존성 ${dep} 누락`);
        }
      }

      // 선택적 의존성 검사
      for (const dep of optionalDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addPass(`✅ 선택적 의존성 ${dep} 설치됨`);
        } else {
          this.addWarning(`⚠️ 선택적 의존성 ${dep} 없음`);
        }
      }
    } catch (error) {
      this.addError(`❌ package.json 읽기 실패: ${error.message}`);
    }
  }

  addPass(message) {
    console.log(`  ${message}`);
    this.passed++;
  }

  addError(message) {
    console.log(`  ${message}`);
    this.errors.push(message);
    this.failed++;
  }

  addWarning(message) {
    console.log(`  ${message}`);
    this.warnings.push(message);
  }

  printResults() {
    console.log('\n📋 Convex 함수 테스트 결과:');
    console.log('═'.repeat(50));

    console.log(`✅ 통과: ${this.passed}`);
    console.log(`❌ 실패: ${this.failed}`);
    console.log(`⚠️ 경고: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 경고 목록:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    console.log('═'.repeat(50));

    if (this.failed === 0) {
      console.log('🎉 모든 Convex 함수 테스트가 통과했습니다!');
    } else {
      console.log('❌ 일부 Convex 함수 테스트가 실패했습니다.');
    }
  }
}

// 메인 실행
async function main() {
  const tester = new ConvexTester();

  try {
    const success = await Promise.race([
      tester.runTests(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('전체 테스트 타임아웃')), TEST_TIMEOUT)
      ),
    ]);

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 테스트 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
