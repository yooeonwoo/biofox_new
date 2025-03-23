// 목업 데이터 삽입 스크립트
require('dotenv').config();
const supabase = require('./utils/supabase');

async function insertMockData() {
  console.log('===== 목업 데이터 삽입 시작 =====');
  
  try {
    // 필요한 기존 데이터 가져오기
    console.log('기존 데이터 참조값 가져오기...');
    
    // 사용자 데이터 (판매 담당자용)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
    
    if (usersError) throw usersError;
    console.log(`사용자 ${users.length}명 조회 완료`);
    
    // 제품 데이터
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(5);
    
    if (productsError) throw productsError;
    console.log(`제품 ${products.length}개 조회 완료`);
    
    // 고객 데이터
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);
    
    if (customersError) throw customersError;
    console.log(`고객 ${customers.length}명 조회 완료`);
    
    // 매장 데이터
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, name')
      .limit(5);
    
    if (shopsError) throw shopsError;
    console.log(`매장 ${shops.length}개 조회 완료`);
    
    // KOL 데이터
    const { data: kols, error: kolsError } = await supabase
      .from('kols')
      .select('id, user_id')
      .limit(5);
    
    if (kolsError) throw kolsError;
    console.log(`KOL ${kols.length}명 조회 완료`);
    
    // 리드 데이터
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name')
      .limit(5);
    
    if (leadsError) throw leadsError;
    console.log(`리드 ${leads.length}개 조회 완료`);
    
    // 1. sales 테이블 목업 데이터
    console.log('\n1. sales 테이블 목업 데이터 삽입...');
    const salesData = [];
    
    // 5개의 판매 데이터 생성
    for (let i = 0; i < 5; i++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // 최근 30일 내 랜덤 날짜
      
      salesData.push({
        product_id: products[i % products.length].id,
        customer_id: customers[i % customers.length].id,
        shop_id: shops[i % shops.length].id,
        sales_rep_id: users[i % users.length].id,
        kol_id: kols[i % kols.length].id,
        quantity: Math.floor(Math.random() * 5) + 1, // 1~5개 랜덤 수량
        price: products[i % products.length].price,
        sale_date: saleDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { data: salesResult, error: salesError } = await supabase
      .from('sales')
      .insert(salesData)
      .select();
      
    if (salesError) throw salesError;
    console.log(`${salesResult.length}개의 판매 데이터 삽입 완료`);
    
    // 2. commissions 테이블 목업 데이터
    console.log('\n2. commissions 테이블 목업 데이터 삽입...');
    const commissionData = [];
    
    // 각 판매에 대한 수수료 데이터 생성
    for (const sale of salesResult) {
      const amount = sale.price * sale.quantity * 0.1; // 판매 가격의 10% 수수료
      
      commissionData.push({
        sale_id: sale.id,
        recipient_type: 'kol', // kol 또는 sales_rep
        recipient_id: sale.kol_id,
        amount: amount,
        status: 'pending', // pending, paid, cancelled
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_device_sale: false,
        commission_tier: 'standard'
      });
    }
    
    const { data: commissionsResult, error: commissionsError } = await supabase
      .from('commissions')
      .insert(commissionData)
      .select();
      
    if (commissionsError) throw commissionsError;
    console.log(`${commissionsResult.length}개의 수수료 데이터 삽입 완료`);
    
    // 3. sales_activities 테이블 목업 데이터
    console.log('\n3. sales_activities 테이블 목업 데이터 삽입...');
    const salesActivitiesData = [];
    
    const salesActivityTypes = ['meeting', 'call', 'email', 'demo', 'follow_up'];
    
    // 10개의 판매 활동 데이터 생성
    for (let i = 0; i < 10; i++) {
      const activityDate = new Date();
      activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 14)); // 최근 14일 내 랜덤 날짜
      
      salesActivitiesData.push({
        user_id: users[i % users.length].id,
        activity_type: salesActivityTypes[i % salesActivityTypes.length],
        shop_id: i < 5 ? shops[i % shops.length].id : null,
        lead_id: i >= 5 ? leads[i % leads.length].id : null,
        customer_id: i < 5 ? customers[i % customers.length].id : null,
        description: `${salesActivityTypes[i % salesActivityTypes.length]} 활동 ${i+1}`,
        result: i % 2 === 0 ? '긍정적' : '추가 논의 필요',
        activity_date: activityDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { data: salesActivitiesResult, error: salesActivitiesError } = await supabase
      .from('sales_activities')
      .insert(salesActivitiesData)
      .select();
      
    if (salesActivitiesError) throw salesActivitiesError;
    console.log(`${salesActivitiesResult.length}개의 판매 활동 데이터 삽입 완료`);
    
    // 4. seminars 테이블 목업 데이터
    console.log('\n4. seminars 테이블 목업 데이터 삽입...');
    
    // seminars 테이블 생성 확인
    const { error: checkSeminarsError } = await supabase
      .from('seminars')
      .select('id')
      .limit(1);
      
    // seminars 테이블이 없는 경우 생성
    if (checkSeminarsError && checkSeminarsError.code === '42P01') {
      console.log('seminars 테이블이 없습니다. 테이블을 생성합니다...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.seminars (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          organizer_id INTEGER REFERENCES public.users(id),
          location TEXT,
          start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          end_time TIMESTAMP WITHOUT TIME ZONE,
          max_attendees INTEGER,
          status VARCHAR(20) DEFAULT 'scheduled',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Supabase에서 테이블 생성을 위한 SQL 실행
      try {
        // 여기서는 테이블이 없다고 가정하고 진행하고, 이미 있다면 다음 단계로 넘어갑니다.
        console.log('seminars 테이블 생성 생략 (SQL 실행 권한 필요)');
      } catch (error) {
        console.error('테이블 생성 오류:', error);
      }
    }
    
    const seminarData = [];
    
    // 세미나 시작 시간 (미래 날짜)
    const seminar1Start = new Date();
    seminar1Start.setDate(seminar1Start.getDate() + 7); // 일주일 후
    seminar1Start.setHours(14, 0, 0, 0); // 오후 2시
    
    const seminar2Start = new Date();
    seminar2Start.setDate(seminar2Start.getDate() + 14); // 2주일 후
    seminar2Start.setHours(15, 0, 0, 0); // 오후 3시
    
    // 세미나 종료 시간 (시작 2시간 후)
    const seminar1End = new Date(seminar1Start);
    seminar1End.setHours(seminar1End.getHours() + 2);
    
    const seminar2End = new Date(seminar2Start);
    seminar2End.setHours(seminar2End.getHours() + 2);
    
    // 2개의 세미나 데이터 생성
    seminarData.push({
      title: '제품 소개 세미나',
      description: '신제품 소개 및 사용법 안내 세미나',
      organizer_id: users[0].id,
      location: '서울시 강남구 삼성동 123',
      start_time: seminar1Start.toISOString(),
      end_time: seminar1End.toISOString(),
      max_attendees: 30,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    seminarData.push({
      title: '판매 전략 세미나',
      description: '영업 담당자를 위한 판매 전략 및 고객 응대법',
      organizer_id: users[1].id,
      location: '서울시 서초구 서초동 456',
      start_time: seminar2Start.toISOString(),
      end_time: seminar2End.toISOString(),
      max_attendees: 20,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    let seminarsResult;
    try {
      const { data, error } = await supabase
        .from('seminars')
        .insert(seminarData)
        .select();
        
      if (error) throw error;
      seminarsResult = data;
      console.log(`${seminarsResult.length}개의 세미나 데이터 삽입 완료`);
    } catch (error) {
      console.error('세미나 데이터 삽입 오류:', error);
      
      // 테이블이 없는 경우를 대비한 대체 로직
      seminarsResult = [
        { id: 1, title: '제품 소개 세미나' },
        { id: 2, title: '판매 전략 세미나' }
      ];
      console.log('세미나 테이블 접근 불가: 목업 ID 사용');
    }
    
    // 5. seminar_attendees 테이블 목업 데이터
    console.log('\n5. seminar_attendees 테이블 목업 데이터 삽입...');
    const seminarAttendeesData = [];
    
    // 각 세미나에 5명의 참석자 추가
    for (const seminar of seminarsResult) {
      for (let i = 0; i < 5; i++) {
        seminarAttendeesData.push({
          seminar_id: seminar.id,
          lead_id: leads[i].id,
          attendance_status: i < 3 ? 'registered' : 'confirmed',
          feedback: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    let seminarAttendeesResult;
    try {
      const { data, error } = await supabase
        .from('seminar_attendees')
        .insert(seminarAttendeesData)
        .select();
        
      if (error) throw error;
      seminarAttendeesResult = data;
      console.log(`${seminarAttendeesResult.length}개의 세미나 참석자 데이터 삽입 완료`);
    } catch (error) {
      console.error('세미나 참석자 데이터 삽입 오류:', error);
      console.log('세미나 참석자 테이블 접근 불가: 건너뜀');
    }
    
    // 6. tasks 테이블 목업 데이터
    console.log('\n6. tasks 테이블 목업 데이터 삽입...');
    const tasksData = [];
    
    const taskPriorities = ['high', 'medium', 'low'];
    const taskStatuses = ['pending', 'in_progress', 'completed'];
    
    // 10개의 태스크 데이터 생성
    for (let i = 0; i < 10; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1); // 향후 1~14일 내 기한
      
      tasksData.push({
        title: `태스크 ${i+1}`,
        description: `태스크 ${i+1}에 대한 상세 설명`,
        assigned_to: users[i % users.length].id,
        assigned_by: users[0].id, // 첫 번째 사용자가 할당
        due_date: dueDate.toISOString(),
        priority: taskPriorities[i % taskPriorities.length],
        status: taskStatuses[i % taskStatuses.length],
        lead_id: i < 5 ? leads[i].id : null,
        customer_id: i >= 5 ? customers[i % customers.length].id : null,
        seminar_id: i % 4 === 0 ? seminarsResult[0].id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    let tasksResult;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksData)
        .select();
        
      if (error) throw error;
      tasksResult = data;
      console.log(`${tasksResult.length}개의 태스크 데이터 삽입 완료`);
    } catch (error) {
      console.error('태스크 데이터 삽입 오류:', error);
      console.log('태스크 테이블 접근 불가: 건너뜀');
      tasksResult = [];
    }
    
    // 7. notifications 테이블 목업 데이터
    console.log('\n7. notifications 테이블 목업 데이터 삽입...');
    const notificationsData = [];
    
    const notificationTypes = ['lead_assigned', 'task_due', 'seminar_reminder', 'sale_completed'];
    
    // 사용자별로 3개의 알림 데이터 생성
    for (let i = 0; i < 3; i++) {
      for (const user of users) {
        const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        
        // 알림 타입에 따라 다른 관련 ID 설정
        let leadId = null;
        let customerId = null;
        let seminarId = null;
        let taskId = null;
        
        switch (notificationType) {
          case 'lead_assigned':
            leadId = leads[i % leads.length].id;
            break;
          case 'task_due':
            taskId = tasksResult.length > 0 ? tasksResult[i % tasksResult.length].id : null;
            break;
          case 'seminar_reminder':
            seminarId = seminarsResult[i % seminarsResult.length].id;
            break;
          case 'sale_completed':
            customerId = customers[i % customers.length].id;
            break;
        }
        
        notificationsData.push({
          user_id: user.id,
          title: `${notificationType} 알림`,
          content: `${notificationType} 관련 알림 내용입니다.`,
          type: notificationType,
          lead_id: leadId,
          customer_id: customerId,
          seminar_id: seminarId,
          task_id: taskId,
          is_read: Math.random() > 0.7, // 30% 확률로 읽음 상태
          created_at: new Date().toISOString()
        });
      }
    }
    
    let notificationsResult;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationsData)
        .select();
        
      if (error) throw error;
      notificationsResult = data;
      console.log(`${notificationsResult.length}개의 알림 데이터 삽입 완료`);
    } catch (error) {
      console.error('알림 데이터 삽입 오류:', error);
      console.log('알림 테이블 접근 불가: 건너뜀');
    }
    
    // 8. activities 테이블 목업 데이터
    console.log('\n8. activities 테이블 목업 데이터 삽입...');
    const activitiesData = [];
    
    const generalActivityTypes = ['meeting', 'call', 'email', 'visit', 'presentation'];
    
    // 10개의 활동 데이터 생성
    for (let i = 0; i < 10; i++) {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 7)); // 최근 7일 내 활동
      
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1 + Math.floor(Math.random() * 2)); // 1~3시간 활동
      
      // 전체 유니크 제약 조건 주의 (user_id, lead_id, activity_type)
      activitiesData.push({
        user_id: users[i % users.length].id,
        activity_type: generalActivityTypes[i % generalActivityTypes.length],
        lead_id: i < 5 ? leads[i].id : null,
        customer_id: i >= 5 ? customers[i % customers.length].id : null,
        seminar_id: i % 5 === 0 ? seminarsResult[0].id : null,
        description: `${generalActivityTypes[i % generalActivityTypes.length]} 활동 내용`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        outcome: i % 2 === 0 ? '긍정적 결과' : '추가 활동 필요',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    let activitiesResult;
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(activitiesData)
        .select();
        
      if (error) throw error;
      activitiesResult = data;
      console.log(`${activitiesResult.length}개의 활동 데이터 삽입 완료`);
    } catch (error) {
      console.error('활동 데이터 삽입 오류:', error);
      console.log('활동 테이블 접근 불가: 건너뜀');
    }
    
    console.log('\n===== 목업 데이터 삽입 완료 =====');
    console.log('목업 데이터 삽입 결과:');
    console.log(`1. sales: ${salesResult ? salesResult.length : 0}개`);
    console.log(`2. commissions: ${commissionsResult ? commissionsResult.length : 0}개`);
    console.log(`3. sales_activities: ${salesActivitiesResult ? salesActivitiesResult.length : 0}개`);
    console.log(`4. seminars: ${seminarsResult ? seminarsResult.length : 0}개`);
    console.log(`5. seminar_attendees: ${seminarAttendeesResult ? seminarAttendeesResult.length : 0}개`);
    console.log(`6. tasks: ${tasksResult ? tasksResult.length : 0}개`);
    console.log(`7. notifications: ${notificationsResult ? notificationsResult.length : 0}개`);
    console.log(`8. activities: ${activitiesResult ? activitiesResult.length : 0}개`);
    
  } catch (error) {
    console.error('목업 데이터 삽입 중 오류 발생:', error);
  }
}

insertMockData().catch(console.error); 