// seminar_attendees 테이블 목업 데이터 삽입
const supabase = require('../utils/supabase');

/**
 * seminar_attendees 테이블 목업 데이터 삽입
 */
async function insertSeminarAttendees() {
  console.log('Inserting seminar attendees...');
  
  try {
    // 1. 세미나 데이터 조회
    const { data: seminars, error: seminarsError } = await supabase
      .from('seminars')
      .select('id')
      .order('id', { ascending: true });
      
    if (seminarsError) {
      console.error('Error fetching seminars:', seminarsError);
      throw seminarsError;
    }
    
    if (!seminars || seminars.length === 0) {
      console.log('No seminars found. Please create seminars first.');
      return null;
    }
    
    // 2. 리드 데이터 조회 (참석자로 사용)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name')
      .limit(10);
      
    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }
    
    if (!leads || leads.length === 0) {
      console.log('No leads found to assign as attendees');
      return null;
    }
    
    // 3. 참석자 데이터 준비
    console.log('Preparing attendees data...');
    const attendeesData = [];
    
    // 각 세미나에 최대 5명의 참석자 추가
    for (const seminar of seminars) {
      const attendeeCount = Math.min(leads.length, 5);
      
      for (let i = 0; i < attendeeCount; i++) {
        const statusOptions = ['registered', 'confirmed', 'attended', 'cancelled'];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        attendeesData.push({
          seminar_id: seminar.id,
          lead_id: leads[i].id,
          attendance_status: status,
          feedback: status === 'attended' ? '세미나가 매우 유익했습니다.' : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    if (attendeesData.length === 0) {
      console.log('No attendees data to insert');
      return null;
    }
    
    // 4. 참석자 데이터 삽입
    console.log(`Inserting ${attendeesData.length} seminar attendees...`);
    const { data: result, error: insertError } = await supabase
      .from('seminar_attendees')
      .insert(attendeesData)
      .select();
      
    if (insertError) {
      console.error('Error inserting seminar attendees:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully inserted ${result.length} seminar attendees`);
    return result;
    
  } catch (error) {
    console.error('Error in seminar attendees operation:', error);
    throw error;
  }
}

module.exports = insertSeminarAttendees; 