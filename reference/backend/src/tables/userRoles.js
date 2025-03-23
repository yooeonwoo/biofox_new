const supabase = require('../utils/supabase');

/**
 * user_roles 테이블에 데이터 삽입
 * 사용자의 role 문자열을 기반으로 role_id 매핑
 * 중복 처리 기능 추가
 */
async function insertUserRoles() {
  console.log('Inserting user roles...');
  
  try {
    // 사용자와 역할 데이터 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      throw rolesError;
    }
    
    // 이미 존재하는 user_roles 데이터 가져오기
    const { data: existingUserRoles, error: existingError } = await supabase
      .from('user_roles')
      .select('user_id, role_id');
      
    if (existingError) {
      console.error('Error fetching existing user roles:', existingError);
      throw existingError;
    }
    
    // 각 사용자의 role 문자열을 기반으로 role_id 매핑
    const userRolesData = [];
    const skippedUserRoles = [];
    
    users.forEach(user => {
      if (!user.role) {
        console.log(`User ${user.id} has no role defined, skipping`);
        return;
      }
      
      const matchingRole = roles.find(role => role.name === user.role);
      if (matchingRole) {
        // 이미 존재하는 user_role 조합인지 확인
        const isDuplicate = existingUserRoles.some(
          ur => ur.user_id === user.id && ur.role_id === matchingRole.id
        );
        
        if (isDuplicate) {
          console.log(`User role already exists for user ${user.id} and role ${matchingRole.name}, skipping`);
          skippedUserRoles.push({
            user_id: user.id,
            role_id: matchingRole.id
          });
        } else {
          userRolesData.push({
            user_id: user.id,
            role_id: matchingRole.id,
            created_at: new Date().toISOString()
          });
        }
      } else {
        console.log(`No matching role found for user ${user.id} with role '${user.role}'`);
      }
    });
    
    if (userRolesData.length === 0) {
      console.log('No new user roles data to insert');
      return [];
    }
    
    // 새로운 user_roles 데이터 삽입
    const { data, error } = await supabase
      .from('user_roles')
      .insert(userRolesData)
      .select();
      
    if (error) {
      console.error('Error inserting user roles:', error);
      throw error;
    }
    
    console.log(`Successfully inserted ${userRolesData.length} new user roles`);
    console.log(`Skipped ${skippedUserRoles.length} existing user roles`);
    return data;
  } catch (error) {
    console.error('Error in user roles insertion process:', error);
    throw error;
  }
}

module.exports = insertUserRoles; 