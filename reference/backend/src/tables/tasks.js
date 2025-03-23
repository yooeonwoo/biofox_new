// tasks 테이블 목업 데이터 삽입
const supabase = require('../utils/supabase');

/**
 * tasks 테이블 목업 데이터 삽입
 */
async function insertTasks() {
  console.log('Inserting tasks...');
  
  try {
    // 1. 사용자 데이터 조회 (할당자/담당자)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found for task assignment');
      return null;
    }
    
    // 2. 리드 데이터 조회
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name')
      .limit(5);
      
    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }
    
    // 3. 고객 데이터 조회
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);
      
    if (customersError) {
      console.error('Error fetching customers:', customersError);
      throw customersError;
    }
    
    // 4. 세미나 데이터 조회
    const { data: seminars, error: seminarsError } = await supabase
      .from('seminars')
      .select('id, title')
      .limit(2);
    
    // 세미나 데이터가 없으면 무시하고 진행
    const hasSeminars = !(seminarsError || !seminars || seminars.length === 0);
    
    // 5. 태스크 데이터 준비
    const taskPriorities = ['high', 'medium', 'low'];
    const taskStatuses = ['pending', 'in_progress', 'completed'];
    const taskTypes = [
      '고객 연락', '미팅 준비', '계약서 검토', '제안서 작성', 
      '견적서 발송', '팔로우업 이메일', '데모 준비', '교육 자료 준비'
    ];
    
    // 총 20개의 태스크 생성
    const tasksData = [];
    
    // 태스크 유형 1: 리드 관련 태스크 (5개)
    if (leads && leads.length > 0) {
      for (let i = 0; i < Math.min(leads.length, 5); i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7일 후
        
        tasksData.push({
          title: `${leads[i].name} 리드 ${taskTypes[i % taskTypes.length]}`,
          description: `리드 관련 태스크 상세 설명 - ${taskTypes[i % taskTypes.length]}`,
          assigned_to: users[i % users.length].id,
          assigned_by: users[0].id, // 첫 번째 사용자가 할당 (관리자 역할 가정)
          due_date: dueDate.toISOString(),
          priority: taskPriorities[i % taskPriorities.length],
          status: taskStatuses[i % taskStatuses.length],
          lead_id: leads[i].id,
          customer_id: null,
          seminar_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // 태스크 유형 2: 고객 관련 태스크 (5개)
    if (customers && customers.length > 0) {
      for (let i = 0; i < Math.min(customers.length, 5); i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 10) + 3); // 3-12일 후
        
        tasksData.push({
          title: `${customers[i].name} 고객 ${taskTypes[(i + 2) % taskTypes.length]}`,
          description: `고객 관련 태스크 상세 설명 - ${taskTypes[(i + 2) % taskTypes.length]}`,
          assigned_to: users[i % users.length].id,
          assigned_by: users[0].id,
          due_date: dueDate.toISOString(),
          priority: taskPriorities[i % taskPriorities.length],
          status: taskStatuses[i % taskStatuses.length],
          lead_id: null,
          customer_id: customers[i].id,
          seminar_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // 태스크 유형 3: 세미나 관련 태스크 (세미나 데이터가 있는 경우)
    if (hasSeminars) {
      for (let i = 0; i < seminars.length; i++) {
        for (let j = 0; j < 2; j++) { // 각 세미나당 2개의 태스크
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5일 후
          
          const taskName = j === 0 ? '준비' : '참석자 관리';
          
          tasksData.push({
            title: `${seminars[i].title} 세미나 ${taskName}`,
            description: `세미나 관련 태스크 상세 설명 - ${taskName}`,
            assigned_to: users[(i + j) % users.length].id,
            assigned_by: users[0].id,
            due_date: dueDate.toISOString(),
            priority: j === 0 ? 'high' : 'medium', // 준비는 높은 우선순위
            status: 'pending',
            lead_id: null,
            customer_id: null,
            seminar_id: seminars[i].id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }
    
    // 태스크 유형 4: 일반 업무 태스크 (나머지)
    const remainingTasks = 20 - tasksData.length;
    
    for (let i = 0; i < remainingTasks; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14일 후
      
      tasksData.push({
        title: `일반 업무 태스크 ${i + 1}`,
        description: `일반 업무 관련 태스크 상세 설명 ${i + 1}`,
        assigned_to: users[i % users.length].id,
        assigned_by: users[0].id,
        due_date: dueDate.toISOString(),
        priority: taskPriorities[i % taskPriorities.length],
        status: taskStatuses[i % taskStatuses.length],
        lead_id: null,
        customer_id: null,
        seminar_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 6. 태스크 데이터 삽입
    if (tasksData.length === 0) {
      console.log('No tasks data to insert');
      return null;
    }
    
    console.log(`Inserting ${tasksData.length} tasks...`);
    const { data: result, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksData)
      .select();
      
    if (insertError) {
      console.error('Error inserting tasks:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${result.length} tasks`);
    return result;
    
  } catch (error) {
    console.error('Error in tasks operation:', error);
    throw error;
  }
}

module.exports = insertTasks; 