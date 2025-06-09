const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lgzzqoaiukuywmenxzay.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA'
);

(async () => {
  const { data: users } = await supabase
    .from('users')
    .select('email, clerk_id, role')
    .order('email');
  
  console.log('=== 현재 사용자 상태 ===');
  users.forEach(user => {
    const status = user.clerk_id.startsWith('pending_') ? 'PENDING' : 'ACTIVE';
    console.log(`${user.email}: ${status} (${user.role})`);
  });
  
  const pendingCount = users.filter(u => u.clerk_id.startsWith('pending_')).length;
  const activeCount = users.filter(u => !u.clerk_id.startsWith('pending_')).length;
  
  console.log(`\n총 ${users.length}명: PENDING ${pendingCount}명, ACTIVE ${activeCount}명`);
})();