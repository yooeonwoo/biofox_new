#!/usr/bin/env node
/* eslint-disable */

/**
 * JWKS (JSON Web Key Set) 생성 스크립트
 * RSA Private Key로부터 JWKS 형식의 Public Key 생성
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateJWKS() {
  try {
    // Private key 파일 경로
    const privateKeyPath = path.join(process.cwd(), 'private_key.pem');

    // Private key 파일 존재 확인
    if (!fs.existsSync(privateKeyPath)) {
      log('❌ private_key.pem 파일을 찾을 수 없습니다.', 'red');
      log('\n먼저 다음 명령어로 private key를 생성하세요:', 'yellow');
      log(
        'openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048',
        'blue'
      );
      process.exit(1);
    }

    // Private key 읽기
    log('📖 Private key 읽는 중...', 'blue');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    // Public key 생성
    log('🔑 Public key 생성 중...', 'blue');
    const publicKey = crypto.createPublicKey(privateKey);

    // JWK 형식으로 변환
    const jwk = publicKey.export({ format: 'jwk' });
    jwk.use = 'sig';
    jwk.kid = crypto.randomUUID();
    jwk.alg = 'RS256';

    // JWKS 객체 생성
    const jwks = {
      keys: [jwk],
    };

    // 결과 출력
    log('\n✅ JWKS 생성 완료!', 'green');
    log('\n=== JWKS (환경변수용) ===', 'bright');
    console.log(JSON.stringify(jwks));

    // 파일로 저장
    const outputPath = path.join(process.cwd(), 'jwks.json');
    fs.writeFileSync(outputPath, JSON.stringify(jwks, null, 2));
    log(`\n📁 JWKS가 ${outputPath}에 저장되었습니다.`, 'green');

    // Private key 환경변수 형식으로 출력
    log('\n=== JWT_PRIVATE_KEY (환경변수용) ===', 'bright');
    console.log(privateKey);

    // 사용 안내
    log('\n📌 사용 방법:', 'yellow');
    log('1. Convex Dashboard에서 다음 환경변수를 설정하세요:', 'blue');
    log('   - JWT_PRIVATE_KEY: 위의 private key 전체 (BEGIN/END 포함)', 'blue');
    log('   - JWKS: 위의 JWKS JSON 문자열', 'blue');
    log(
      '\n2. Production 환경에서는 보안을 위해 private_key.pem 파일을 안전하게 보관하세요.',
      'yellow'
    );
    log('3. private_key.pem 파일은 절대 Git에 커밋하지 마세요!', 'red');
  } catch (error) {
    log(`\n❌ 에러 발생: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 스크립트 실행
generateJWKS();
