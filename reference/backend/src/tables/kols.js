const supabase = require('../utils/supabase');

/**
 * kols 테이블에 데이터 삽입
 * KOL 역할을 가진 사용자를 기반으로 생성
 */
async function insertKols() {
  console.log('Inserting kols...');
  
  try {
    // KOL 역할을 가진 사용자 찾기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'KOL');
    
    if (usersError) {
      console.error('Error fetching KOL users:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users with KOL role found, skipping kols insertion');
      return [];
    }
    
    console.log(`Found ${users.length} users with KOL role`);
    
    // 현재 날짜와 1년 후 날짜 계산
    const currentDate = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(currentDate.getFullYear() + 1);
    
    // KOL 데이터 생성
    const kolsData = users.map((user, index) => ({
      user_id: user.id,
      specialty: ['피부케어', '헤어케어', '메이크업', '바디케어'][index % 4], // 랜덤 전문분야 할당
      bio: `${user.full_name}의 전문 프로필입니다.`,
      contract_start_date: currentDate.toISOString(),
      contract_end_date: oneYearLater.toISOString(),
      commission_rate: 10.00 + (index % 5), // 10%~14% 사이 랜덤 할당
      status: 'active',
      bank_account: `${1000000000 + index}`, // 임의의 계좌번호
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affiliated_shop_id: null, // 나중에 updateShopKolRelationships에서 업데이트
      device_sales_count: Math.floor(Math.random() * 100), // 0~99 사이 랜덤 값
      is_shop: false,
      parent_kol_id: null // 나중에 계층 구조 설정에서 업데이트
    }));
    
    // 데이터 삽입
    const { data, error } = await supabase
      .from('kols')
      .insert(kolsData)
      .select();
      
    if (error) {
      console.error('Error inserting kols:', error);
      throw error;
    }
    
    console.log(`Successfully inserted ${data.length} kols`);
    return data;
  } catch (error) {
    console.error('Error in kols insertion process:', error);
    throw error;
  }
}

module.exports = insertKols; 