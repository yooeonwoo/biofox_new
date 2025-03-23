const supabase = require('../utils/supabase');

/**
 * customers 테이블에 목업 데이터 삽입
 * leads와 shops 데이터를 기반으로 생성
 */
async function insertCustomers() {
  console.log('Inserting customers...');
  
  try {
    // 기존 데이터에서 leads 가져오기
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .limit(20); // 샘플 데이터로 20개만 가져옴
    
    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }
    
    if (!leads || leads.length === 0) {
      console.log('No leads data found, skipping customers insertion');
      return [];
    }
    
    // shops 데이터 가져오기
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id')
      .limit(10); // 샘플 데이터로 10개만 가져옴
    
    if (shopsError) {
      console.error('Error fetching shops:', shopsError);
      throw shopsError;
    }
    
    // Sales Rep 역할을 가진 사용자 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Sales Rep')
      .limit(5);
    
    if (usersError) {
      console.error('Error fetching Sales Rep users:', usersError);
      throw usersError;
    }
    
    // 목업 고객 데이터 생성
    const customersData = [];
    
    // 최소 한 개의 shops과 users가 있는지 확인
    const hasShops = shops && shops.length > 0;
    const hasUsers = users && users.length > 0;
    
    // 생년월일 랜덤 생성 함수
    const getRandomBirthDate = () => {
      const start = new Date(1970, 0, 1);
      const end = new Date(2000, 11, 31);
      const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return randomDate.toISOString().split('T')[0];
    };
    
    // 주소 랜덤 생성 함수
    const getRandomAddress = () => {
      const cities = ['서울시', '부산시', '인천시', '대구시', '대전시', '광주시', '울산시', '세종시'];
      const districts = ['강남구', '서초구', '중구', '동구', '남구', '북구', '서구', '동래구'];
      const details = ['123번길 45', '67번길 89', '101동 1234호', '202호', '상가 3층'];
      
      return `${cities[Math.floor(Math.random() * cities.length)]} ${districts[Math.floor(Math.random() * districts.length)]} ${details[Math.floor(Math.random() * details.length)]}`;
    };
    
    // leads 데이터를 기반으로 customers 생성
    leads.forEach((lead, index) => {
      customersData.push({
        lead_id: lead.id,
        name: lead.name,
        email: lead.email || `customer${index}@example.com`,
        phone: lead.phone || `010-${1000 + index}-${2000 + index}`,
        address: getRandomAddress(),
        birth_date: Math.random() > 0.3 ? getRandomBirthDate() : null, // 30% 확률로 null
        gender: ['남성', '여성'][Math.floor(Math.random() * 2)],
        shop_id: hasShops ? shops[index % shops.length].id : null,
        assigned_to: hasUsers ? users[index % users.length].id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
    
    if (customersData.length === 0) {
      console.log('No customer data to insert');
      return [];
    }
    
    // 데이터 삽입
    const { data, error } = await supabase
      .from('customers')
      .insert(customersData)
      .select();
      
    if (error) {
      console.error('Error inserting customers:', error);
      throw error;
    }
    
    console.log(`Successfully inserted ${data.length} customers`);
    return data;
  } catch (error) {
    console.error('Error in customers insertion process:', error);
    throw error;
  }
}

module.exports = insertCustomers; 