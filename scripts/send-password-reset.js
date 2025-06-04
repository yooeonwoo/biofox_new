/**
 * 기존 사용자들에게 패스워드 리셋 이메일을 발송하는 스크립트
 * 사용법: node scripts/send-password-reset.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sendPasswordResetEmails() {
  try {
    console.log('=== 패스워드 리셋 이메일 발송 시작 ===');

    // 1. pending 상태인 기존 사용자들 조회
    const { data: pendingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .like('clerk_id', 'pending_migrated_%');

    if (fetchError) {
      throw new Error(`사용자 조회 실패: ${fetchError.message}`);
    }

    console.log(`패스워드 리셋 대상 사용자: ${pendingUsers.length}명`);

    // 2. 이메일 발송을 위한 HTML 템플릿
    const emailTemplate = (userEmail, userName) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>바이오폭시 시스템 업그레이드 안내</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">바이오폭시 KOL 시스템</h1>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2>시스템 업그레이드 완료 안내</h2>
            <p>안녕하세요, ${userName || userEmail.split('@')[0]}님!</p>
            
            <p>바이오폭시 KOL 시스템이 보안 강화 및 성능 개선을 위해 업그레이드되었습니다.</p>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1d4ed8;">⚡ 액션 필요: 새 비밀번호 설정</h3>
                <p>보안상의 이유로 모든 사용자는 새 비밀번호를 설정해야 합니다.</p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="https://app.biofoxi.com/signin" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        로그인 페이지로 이동
                    </a>
                </div>
            </div>
            
            <h3>📋 로그인 방법:</h3>
            <ol>
                <li><strong>https://app.biofoxi.com</strong> 접속</li>
                <li>"<strong>비밀번호를 잊으셨나요?</strong>" 클릭</li>
                <li>이메일 주소 입력: <strong>${userEmail}</strong></li>
                <li>발송된 이메일의 링크를 통해 새 비밀번호 설정</li>
                <li>새 비밀번호로 로그인</li>
            </ol>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #92400e;">💡 중요 안내</h4>
                <ul style="margin-bottom: 0;">
                    <li>기존의 모든 데이터(매장 정보, 수당 내역 등)는 그대로 유지됩니다</li>
                    <li>이메일 주소는 변경되지 않습니다: <strong>${userEmail}</strong></li>
                    <li>로그인 후 기존과 동일한 서비스를 이용하실 수 있습니다</li>
                </ul>
            </div>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>문의사항이 있으시면 관리자에게 연락해 주세요.</p>
            <p>© 2025 바이오폭시. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    // 3. 이메일 목록 생성
    const emailList = pendingUsers.map(user => ({
      email: user.email,
      name: user.name,
      role: user.role,
      subject: '[바이오폭시] 시스템 업그레이드 완료 - 새 비밀번호 설정 필요',
      html: emailTemplate(user.email, user.name)
    }));

    // 4. 이메일 발송 리스트를 파일로 저장
    const fs = require('fs');
    const emailData = {
      timestamp: new Date().toISOString(),
      totalUsers: pendingUsers.length,
      emails: emailList
    };

    const emailFileName = `password-reset-emails-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(emailFileName, JSON.stringify(emailData, null, 2));
    console.log(`📧 이메일 발송 목록 저장: ${emailFileName}`);

    // 5. 사용자별 안내 정보 출력
    console.log('\n=== 패스워드 리셋 안내 ===');
    console.log('다음 사용자들에게 패스워드 리셋 안내가 필요합니다:\n');
    
    pendingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
    });

    console.log('\n=== 발송 방법 ===');
    console.log('1. 수동 발송: 생성된 이메일 템플릿을 복사하여 각 사용자에게 발송');
    console.log('2. 대량 발송: 이메일 서비스(예: SendGrid, AWS SES)를 통한 자동 발송');
    console.log('3. 시스템 안내: 로그인 페이지에 공지사항 추가');

    console.log('\n=== 사용자 안내 메시지 ===');
    console.log('다음 메시지를 사용자들에게 전달하세요:');
    console.log('---');
    console.log('시스템 업그레이드로 인해 새 비밀번호 설정이 필요합니다.');
    console.log('1. https://app.biofoxi.com 접속');
    console.log('2. "비밀번호를 잊으셨나요?" 클릭');
    console.log('3. 이메일 주소 입력 후 비밀번호 재설정');
    console.log('4. 새 비밀번호로 로그인');
    console.log('※ 기존 데이터는 모두 유지됩니다.');
    console.log('---');

    console.log('\n=== 완료 ===');

    return {
      success: true,
      totalUsers: pendingUsers.length,
      emailFileName
    };

  } catch (error) {
    console.error('패스워드 리셋 이메일 준비 실패:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  sendPasswordResetEmails();
}

module.exports = { sendPasswordResetEmails };