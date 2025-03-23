const supabase = require('../utils/supabase');

/**
 * settings 테이블에 목업 데이터 삽입
 */
async function insertSettings() {
  console.log('Inserting settings...');
  
  // 기본 설정 목업 데이터
  const settingsData = [
    {
      category: 'system',
      key: 'company_name',
      value: 'Example Company',
      description: '회사명',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      category: 'email',
      key: 'notification_enabled',
      value: 'true',
      description: '이메일 알림 활성화 여부',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      category: 'system',
      key: 'default_language',
      value: 'ko',
      description: '기본 언어 설정',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      category: 'system',
      key: 'timezone',
      value: 'Asia/Seoul',
      description: '시스템 타임존',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      category: 'lead',
      key: 'default_status',
      value: '1',
      description: '리드 기본 상태 ID',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .insert(settingsData)
      .select();
      
    if (error) {
      console.error('Error inserting settings:', error);
      throw error;
    }
    
    console.log(`Successfully inserted ${data.length} settings`);
    return data;
  } catch (error) {
    console.error('Error in settings insertion process:', error);
    throw error;
  }
}

module.exports = insertSettings; 