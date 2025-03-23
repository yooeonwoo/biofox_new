/**
 * 모든 목업 데이터 삽입을 위한 통합 스크립트
 * 수정1.md에 따라 테이블 간 FK 관계를 고려해 올바른 순서로 데이터 삽입
 */
require('dotenv').config();
const supabase = require('./utils/supabase');

// 모듈 가져오기
const createAndInsertSeminars = require('./tables/seminars');
const insertSeminarAttendees = require('./tables/seminar-attendees');
const insertTasks = require('./tables/tasks');

// 자체 구현: notifications 목업 데이터 생성
async function insertNotifications() {
  console.log('Inserting notifications...');
  
  try {
    // 1. 사용자 데이터 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found for notifications');
      return null;
    }
    
    // 2. 관련 테이블 데이터 조회
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .limit(3);
      
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(3);
      
    const { data: seminars } = await supabase
      .from('seminars')
      .select('id')
      .limit(2);
      
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .limit(3);
    
    // 3. 알림 타입 및 템플릿 설정
    const notificationTypes = [
      {
        type: 'lead_assigned',
        title: '새 리드 할당',
        content: '새로운 리드가 할당되었습니다. 확인해 주세요.',
        relatedField: 'lead_id'
      },
      {
        type: 'task_due',
        title: '태스크 마감 임박',
        content: '해당 태스크의 마감일이 다가오고 있습니다.',
        relatedField: 'task_id'
      },
      {
        type: 'sale_completed',
        title: '판매 완료',
        content: '고객 판매가 완료되었습니다. 축하합니다!',
        relatedField: 'customer_id'
      },
      {
        type: 'seminar_reminder',
        title: '세미나 알림',
        content: '다가오는 세미나가 있습니다. 참석 여부를 확인해 주세요.',
        relatedField: 'seminar_id'
      }
    ];
    
    // 4. 알림 데이터 준비
    const notificationsData = [];
    
    // 사용자별로 4개의 알림 생성
    for (const user of users) {
      for (let i = 0; i < notificationTypes.length; i++) {
        const notificationType = notificationTypes[i];
        let relatedData = null;
        
        // 관련 데이터 설정
        switch (notificationType.relatedField) {
          case 'lead_id':
            relatedData = leads && leads.length > 0 ? leads[i % leads.length] : null;
            break;
          case 'customer_id':
            relatedData = customers && customers.length > 0 ? customers[i % customers.length] : null;
            break;
          case 'seminar_id':
            relatedData = seminars && seminars.length > 0 ? seminars[i % seminars.length] : null;
            break;
          case 'task_id':
            relatedData = tasks && tasks.length > 0 ? tasks[i % tasks.length] : null;
            break;
        }
        
        // 관련 데이터가 없으면 이 알림 타입은 건너뜀
        if (!relatedData && notificationType.relatedField !== 'none') {
          continue;
        }
        
        const notification = {
          user_id: user.id,
          title: notificationType.title,
          content: notificationType.content,
          type: notificationType.type,
          is_read: Math.random() > 0.7, // 30% 확률로 읽음 상태
          created_at: new Date().toISOString()
        };
        
        // 관련 필드 추가 (lead_id, customer_id 등)
        if (relatedData) {
          notification[notificationType.relatedField] = relatedData.id;
        }
        
        notificationsData.push(notification);
      }
    }
    
    if (notificationsData.length === 0) {
      console.log('No notifications data to insert');
      return null;
    }
    
    // 5. 알림 데이터 삽입
    console.log(`Inserting ${notificationsData.length} notifications...`);
    const { data: result, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select();
      
    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${result.length} notifications`);
    return result;
    
  } catch (error) {
    console.error('Error in notifications operation:', error);
    return null; // 오류 발생 시에도 진행
  }
}

// 자체 구현: activities 목업 데이터 생성
async function insertActivities() {
  console.log('Inserting activities...');
  
  try {
    // 1. 사용자 데이터 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found for activities');
      return null;
    }
    
    // 2. 관련 테이블 데이터 조회
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .limit(5);
      
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(5);
      
    const { data: seminars } = await supabase
      .from('seminars')
      .select('id')
      .limit(2);
    
    // 3. 활동 데이터 준비
    const activityTypes = ['meeting', 'call', 'email', 'presentation', 'visit'];
    const activitiesData = [];
    
    // 각 유저별로 활동 생성
    for (let i = 0; i < users.length; i++) {
      // 다양한 활동 타입 생성
      for (let j = 0; j < activityTypes.length; j++) {
        // 리드, 고객, 세미나 관련 활동 분산
        let leadId = null;
        let customerId = null;
        let seminarId = null;
        
        // 활동은 하나의 관련 항목만 가짐
        if (j % 3 === 0 && leads && leads.length > 0) {
          leadId = leads[j % leads.length].id;
        } else if (j % 3 === 1 && customers && customers.length > 0) {
          customerId = customers[j % customers.length].id;
        } else if (j % 3 === 2 && seminars && seminars.length > 0) {
          seminarId = seminars[j % seminars.length].id;
        }
        
        // 유니크 제약 조건 주의 (user_id, lead_id, activity_type)
        // 각 사용자-리드-활동 타입 조합은 한번만
        if (leadId && activitiesData.some(a => 
          a.user_id === users[i].id && 
          a.lead_id === leadId && 
          a.activity_type === activityTypes[j]
        )) {
          leadId = null; // 중복이면 lead_id 제거
        }
        
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 7)); // 최근 7일 내 활동
        
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1); // 1시간 활동
        
        activitiesData.push({
          user_id: users[i].id,
          activity_type: activityTypes[j],
          lead_id: leadId,
          customer_id: customerId,
          seminar_id: seminarId,
          description: `${activityTypes[j]} 활동 상세 내용 ${i}${j}`,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          outcome: j % 2 === 0 ? '긍정적 결과' : '추가 활동 필요',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    if (activitiesData.length === 0) {
      console.log('No activities data to insert');
      return null;
    }
    
    // 4. 활동 데이터 삽입
    console.log(`Inserting ${activitiesData.length} activities...`);
    const { data: result, error: insertError } = await supabase
      .from('activities')
      .insert(activitiesData)
      .select();
      
    if (insertError) {
      console.error('Error inserting activities:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${result.length} activities`);
    return result;
    
  } catch (error) {
    console.error('Error in activities operation:', error);
    return null; // 오류 발생 시에도 진행
  }
}

// 메인 함수
async function insertAllMockData() {
  console.log('===== 목업 데이터 삽입 시작 =====');
  console.log('수정1.md에 따라 테이블 간 FK 관계를 고려하여 데이터를 삽입합니다.');
  
  try {
    // 1. 세미나 테이블 생성 및 데이터 삽입
    console.log('\n===== 1. 세미나 테이블 생성 및 데이터 삽입 =====');
    const seminarsResult = await createAndInsertSeminars();
    
    // 2. 세미나 참석자 데이터 삽입
    console.log('\n===== 2. 세미나 참석자 데이터 삽입 =====');
    if (seminarsResult) {
      await insertSeminarAttendees();
    } else {
      console.log('세미나 데이터가 없어 참석자 데이터 삽입을 건너뜁니다.');
    }
    
    // 3. 태스크 데이터 삽입
    console.log('\n===== 3. 태스크 데이터 삽입 =====');
    await insertTasks();
    
    // 4. 알림 데이터 삽입
    console.log('\n===== 4. 알림 데이터 삽입 =====');
    await insertNotifications();
    
    // 5. 활동 데이터 삽입
    console.log('\n===== 5. 활동 데이터 삽입 =====');
    await insertActivities();
    
    console.log('\n===== 목업 데이터 삽입 완료 =====');
    console.log('모든 테이블에 목업 데이터 삽입이 완료되었습니다.');
    
  } catch (error) {
    console.error('목업 데이터 삽입 중 오류 발생:', error);
  }
}

// 실행
insertAllMockData().catch(console.error); 