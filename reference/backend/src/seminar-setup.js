/**
 * 세미나 관련 테이블 (seminars, seminar_attendees)에 목업 데이터 삽입
 * 테이블구조.md에 정의된 구조에 맞게 구현
 */
require('dotenv').config();
const supabase = require('./utils/supabase');

async function setupSeminars() {
  console.log('===== 세미나 관련 테이블 목업 데이터 삽입 시작 =====');
  
  try {
    // 1. 사용자 정보 가져오기 (세미나 주최자)
    console.log('세미나 주최자(사용자) 정보 조회...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(3);
      
    if (usersError) {
      console.error('사용자 정보 조회 오류:', usersError);
      throw usersError;
    }
    
    console.log(`${users.length}명의 사용자 정보 조회 완료`);
    
    // 2. 리드 정보 가져오기 (세미나 참석자)
    console.log('세미나 참석자(리드) 정보 조회...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, email')
      .limit(15);
      
    if (leadsError) {
      console.error('리드 정보 조회 오류:', leadsError);
      throw leadsError;
    }
    
    console.log(`${leads.length}명의 리드 정보 조회 완료`);
    
    // 3. 세미나 데이터 준비
    console.log('세미나 데이터 준비...');
    const seminarsData = [];
    
    // 세미나 일정 설정 (3개의 세미나)
    const seminarTitles = [
      '신제품 소개 및 사용법 세미나',
      '영업 담당자를 위한 판매 전략 세미나',
      '고객 관리 및 CRM 활용 세미나'
    ];
    
    const seminarLocations = [
      '서울시 강남구 삼성동 123번지 코엑스 회의실 3층',
      '서울시 서초구 서초동 456번지 그랜드호텔 2층 컨퍼런스룸',
      '서울시 송파구 잠실동 올림픽로 235 롯데타워 스카이라운지'
    ];
    
    const seminarDescriptions = [
      '최신 제품 소개와 효과적인 사용법을 안내하는 세미나입니다. 제품 시연 및 실습 시간이 포함됩니다.',
      '영업 담당자를 위한 고급 판매 전략과 고객 응대법에 대한 세미나입니다. 실전 사례 분석 및 토론이 진행됩니다.',
      '고객 관리 시스템 활용과 장기적 고객 관계 유지에 대한 노하우를 공유하는 세미나입니다.'
    ];
    
    // 세미나 일정 생성 (각 2주 간격)
    for (let i = 0; i < 3; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7 + (i * 14)); // 1주 후부터 2주 간격
      startDate.setHours(14, 0, 0, 0); // 오후 2시
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 3); // 3시간 진행
      
      seminarsData.push({
        title: seminarTitles[i],
        description: seminarDescriptions[i],
        location: seminarLocations[i],
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        organizer_id: users[i % users.length].id,
        max_attendees: 30 + (i * 10), // 30, 40, 50명씩
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 4. 기존 세미나 확인 및 삭제 (테스트를 위한 초기화)
    console.log('기존 세미나 데이터 확인...');
    const { data: existingSeminars, error: checkError } = await supabase
      .from('seminars')
      .select('id, title');
    
    if (!checkError && existingSeminars && existingSeminars.length > 0) {
      console.log(`${existingSeminars.length}개의 기존 세미나 발견`);
      
      // 기존 세미나 참석자 정보 삭제
      console.log('기존 세미나 참석자 정보 삭제...');
      const { error: deleteAttendeesError } = await supabase
        .from('seminar_attendees')
        .delete()
        .in('seminar_id', existingSeminars.map(s => s.id));
      
      if (deleteAttendeesError) {
        console.error('세미나 참석자 삭제 오류:', deleteAttendeesError);
        // 오류 발생해도 계속 진행
      } else {
        console.log('세미나 참석자 정보가 삭제되었습니다.');
      }
      
      // 기존 세미나 정보 삭제
      console.log('기존 세미나 정보 삭제...');
      const { error: deleteSeminarsError } = await supabase
        .from('seminars')
        .delete()
        .in('id', existingSeminars.map(s => s.id));
      
      if (deleteSeminarsError) {
        console.error('세미나 삭제 오류:', deleteSeminarsError);
        // 오류 발생해도 계속 진행
      } else {
        console.log('기존 세미나 정보가 삭제되었습니다.');
      }
    } else {
      console.log('기존 세미나 데이터가 없습니다.');
    }
    
    // 5. 세미나 데이터 삽입
    console.log(`${seminarsData.length}개의 세미나 데이터 삽입 중...`);
    const { data: seminarsResult, error: seminarsError } = await supabase
      .from('seminars')
      .insert(seminarsData)
      .select();
      
    if (seminarsError) {
      console.error('세미나 데이터 삽입 오류:', seminarsError);
      throw seminarsError;
    }
    
    console.log(`${seminarsResult.length}개의 세미나 데이터 삽입 완료`);
    
    // 6. 세미나 참석자 데이터 준비
    console.log('세미나 참석자 데이터 준비...');
    const attendeesData = [];
    
    // 참석 상태 옵션
    const statusOptions = ['registered', 'confirmed', 'attended', 'cancelled'];
    
    // 각 세미나별로 5~10명의 참석자 설정
    for (const seminar of seminarsResult) {
      // 각 세미나마다 참석자 수를 다르게 설정 (5~10명)
      const attendeeCount = 5 + Math.floor(Math.random() * 6);
      console.log(`세미나 "${seminar.title}"에 ${attendeeCount}명의 참석자 할당`);
      
      for (let i = 0; i < attendeeCount && i < leads.length; i++) {
        // 무작위 참석 상태 선택
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        // 피드백은 'attended' 상태인 경우에만 설정
        const feedback = status === 'attended' ? 
          `세미나가 매우 유익했습니다. ${leads[i].name}올림` : null;
        
        attendeesData.push({
          seminar_id: seminar.id,
          lead_id: leads[i].id,
          attendance_status: status,
          feedback: feedback,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // 7. 세미나 참석자 데이터 삽입
    console.log(`${attendeesData.length}명의 세미나 참석자 데이터 삽입 중...`);
    const { data: attendeesResult, error: attendeesError } = await supabase
      .from('seminar_attendees')
      .insert(attendeesData)
      .select();
      
    if (attendeesError) {
      console.error('세미나 참석자 데이터 삽입 오류:', attendeesError);
      throw attendeesError;
    }
    
    console.log(`${attendeesResult.length}명의 세미나 참석자 데이터 삽입 완료`);
    
    // 8. 결과 요약
    console.log('\n===== 세미나 관련 테이블 목업 데이터 삽입 결과 =====');
    console.log(`1. 세미나(seminars): ${seminarsResult.length}개`);
    console.log(`2. 세미나 참석자(seminar_attendees): ${attendeesResult.length}명`);
    
    // 세미나별 참석자 수 요약
    for (const seminar of seminarsResult) {
      const seminarAttendees = attendeesResult.filter(a => a.seminar_id === seminar.id);
      console.log(`   - "${seminar.title}": ${seminarAttendees.length}명 참석`);
    }
    
    console.log('===== 세미나 관련 테이블 목업 데이터 삽입 완료 =====');
    
  } catch (error) {
    console.error('세미나 데이터 설정 중 오류 발생:', error);
  }
}

// 실행
setupSeminars().catch(console.error); 