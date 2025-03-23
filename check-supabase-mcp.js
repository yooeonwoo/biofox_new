const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// mcp.json 파일 경로
const mcpJsonPath = path.join(os.homedir(), '.cursor', 'mcp.json');

// mcp.json 파일 존재 여부 확인
if (fs.existsSync(mcpJsonPath)) {
  console.log('mcp.json 파일이 존재합니다.');
  
  try {
    // mcp.json 파일 읽기
    const mcpJson = require(mcpJsonPath);
    
    // Supabase MCP 서버 설정 확인
    if (mcpJson.mcpServers && mcpJson.mcpServers['Supabase-mcp-server']) {
      console.log('Supabase MCP 서버가 설정되어 있습니다.');
      console.log('설정 내용:');
      console.log(JSON.stringify(mcpJson.mcpServers['Supabase-mcp-server'], null, 2));
      
      // Supabase 프로젝트 정보 확인
      const configStr = mcpJson.mcpServers['Supabase-mcp-server'].args[5];
      try {
        const config = JSON.parse(configStr);
        console.log('\nSupabase 프로젝트 정보:');
        console.log('- 지역:', config.supabaseRegion);
        console.log('- 프로젝트 레퍼런스:', config.supabaseProjectRef);
        console.log('- 액세스 토큰:', config.supabaseAccessToken ? '설정됨' : '미설정');
        console.log('- 서비스 역할 키:', config.supabaseServiceRoleKey ? '설정됨' : '미설정');
      } catch (error) {
        console.error('Supabase 설정 파싱 오류:', error.message);
      }
    } else {
      console.log('Supabase MCP 서버가 설정되어 있지 않습니다.');
      console.log('\n설정 방법:');
      console.log('1. Cursor 앱의 MCP 관리자로 이동합니다.');
      console.log('2. "@alexander-zuev/supabase-mcp-server" MCP를 추가합니다.');
      console.log('3. 필요한 Supabase 정보를 입력합니다.');
    }
  } catch (error) {
    console.error('mcp.json 파일 읽기 오류:', error.message);
  }
} else {
  console.log('mcp.json 파일이 존재하지 않습니다.');
  console.log('Cursor 앱을 먼저 설치하고 실행해 주세요.');
}

console.log('\n--- Supabase 연결 정보 ---');
require('./test-supabase');

console.log('\n--- 수동으로 MCP 서버 실행하는 방법 ---');
console.log('다음 명령어를 실행하여 Supabase MCP 서버를 수동으로 실행할 수 있습니다:');
console.log('npx @smithery/cli@latest run @alexander-zuev/supabase-mcp-server --config "{\\"supabaseRegion\\":\\"ap-northeast-2\\",\\"supabaseProjectRef\\":\\"lgzzqoaiukuywmenxzay\\",\\"supabaseAccessToken\\":\\"YOUR_ACCESS_TOKEN\\",\\"supabaseServiceRoleKey\\":\\"YOUR_SERVICE_ROLE_KEY\\"}"'); 