// seminars 테이블 생성 및 목업 데이터 삽입
const supabase = require('../utils/supabase');

/**
 * seminars 테이블 목업 데이터 삽입
 * 테이블구조.md에 정의된 실제 테이블 구조에 맞춤
 */
async function createAndInsertSeminars() {
  console.log('Checking seminars table...');
  
  try {
    // 1. 먼저 테이블 존재 여부 확인
    const { error: checkError } = await supabase
      .from('seminars')
      .select('id')
      .limit(1);
    
    // 2. 테이블이 없는 경우에 대한 처리
    if (checkError && checkError.code === '42P01') {
      console.log('Seminars 테이블이 없습니다. 관리자에게 문의하세요.');
      console.log('Seminars 테이블이 없어도 일부 목업 데이터 삽입을 진행합니다.');
      
      // 세미나 테이블이 없으면 더미 데이터 반환
      return [
        { id: 1, title: '제품 소개 세미나' },
        { id: 2, title: '판매 전략 세미나' }
      ];
    }
    
    // 3. 테이블 구조 확인 (실제 컬럼 확인)
    console.log('테이블 구조 확인 중...');
    const { data: columns, error: columnsError } = await supabase
      .from('seminars')
      .select('*')
      .limit(1);
      
    if (columnsError) {
      console.error('테이블 구조 확인 오류:', columnsError);
      
      // 세미나 테이블에 접근할 수 없으면 더미 데이터 반환
      return [
        { id: 1, title: '제품 소개 세미나' },
        { id: 2, title: '판매 전략 세미나' }
      ];
    }
    
    // 컬럼 정보 출력
    if (columns && columns.length > 0) {
      console.log('테이블 구조:', Object.keys(columns[0]));
    }
    
    // 4. 사용자 정보 가져오기 (세미나 주최자로 설정)
    console.log('Fetching users for seminar organizers...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(2);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found to assign as seminar organizers');
      return null;
    }
    
    // 5. 세미나 데이터 준비
    console.log('Preparing seminars data...');
    const seminarsData = [];
    
    // 세미나 시작 및 종료 시간 (미래 날짜)
    const seminar1Start = new Date();
    seminar1Start.setDate(seminar1Start.getDate() + 7); // 일주일 후
    seminar1Start.setHours(14, 0, 0, 0); // 오후 2시
    
    const seminar1End = new Date(seminar1Start);
    seminar1End.setHours(seminar1End.getHours() + 2); // 2시간 후
    
    const seminar2Start = new Date();
    seminar2Start.setDate(seminar2Start.getDate() + 14); // 2주일 후
    seminar2Start.setHours(15, 0, 0, 0); // 오후 3시
    
    const seminar2End = new Date(seminar2Start);
    seminar2End.setHours(seminar2End.getHours() + 2); // 2시간 후
    
    // 2개의 세미나 데이터 생성 (테이블구조.md에 맞게 필드명 조정)
    seminarsData.push({
      title: '제품 소개 세미나',
      description: '신제품 소개 및 사용법 안내 세미나',
      location: '서울시 강남구 삼성동 123',
      start_date: seminar1Start.toISOString(),
      end_date: seminar1End.toISOString(),
      organizer_id: users[0].id,
      max_attendees: 30,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    seminarsData.push({
      title: '판매 전략 세미나',
      description: '영업 담당자를 위한 판매 전략 및 고객 응대법',
      location: '서울시 서초구 서초동 456',
      start_date: seminar2Start.toISOString(),
      end_date: seminar2End.toISOString(),
      organizer_id: users[1] ? users[1].id : users[0].id,
      max_attendees: 20,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // 6. 세미나 데이터 삽입
    console.log('Inserting seminars data...');
    console.log('삽입할 데이터 필드:', Object.keys(seminarsData[0]));
    
    const { data: result, error: insertError } = await supabase
      .from('seminars')
      .insert(seminarsData)
      .select();
      
    if (insertError) {
      console.error('Error inserting seminars data:', insertError);
      
      // 세미나 삽입 실패 시 더미 데이터 반환
      return [
        { id: 1, title: '제품 소개 세미나' },
        { id: 2, title: '판매 전략 세미나' }
      ];
    }
    
    console.log(`Successfully inserted ${result.length} seminars`);
    return result;
    
  } catch (error) {
    console.error('Error in seminars operation:', error);
    // 오류 발생 시 더미 데이터 반환
    return [
      { id: 1, title: '제품 소개 세미나' },
      { id: 2, title: '판매 전략 세미나' }
    ];
  }
}

module.exports = createAndInsertSeminars; 