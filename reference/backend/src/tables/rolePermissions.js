const supabase = require('../utils/supabase');

/**
 * role_permissions 테이블에 데이터 삽입 (목업 데이터)
 * Admin 역할에 모든 권한 부여
 * 중복 처리 기능 추가
 */
async function insertRolePermissions() {
  console.log('Inserting role permissions...');
  
  try {
    // 먼저 역할과 권한 데이터 가져오기
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name');
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      throw rolesError;
    }
    
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('id');
      
    if (permissionsError) {
      console.error('Error fetching permissions:', permissionsError);
      throw permissionsError;
    }
    
    // Admin 역할 찾기
    const adminRole = roles.find(role => role.name === 'Admin');
    if (!adminRole) {
      console.log('Admin role not found, skipping role permissions assignment');
      return [];
    }
    
    // 이미 존재하는 role_permissions 가져오기
    const { data: existingRolePermissions, error: existingError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .eq('role_id', adminRole.id);
      
    if (existingError) {
      console.error('Error fetching existing role permissions:', existingError);
      throw existingError;
    }
    
    // 모든 권한에 대해 role_permissions 생성 (중복 제외)
    const rolePermissionsData = [];
    const skippedRolePermissions = [];
    
    permissions.forEach(permission => {
      // 이미 존재하는 role-permission 조합인지 확인
      const isDuplicate = existingRolePermissions.some(
        rp => rp.role_id === adminRole.id && rp.permission_id === permission.id
      );
      
      if (isDuplicate) {
        skippedRolePermissions.push({
          role_id: adminRole.id,
          permission_id: permission.id
        });
      } else {
        rolePermissionsData.push({
          role_id: adminRole.id,
          permission_id: permission.id,
          created_at: new Date().toISOString()
        });
      }
    });
    
    console.log(`Found ${existingRolePermissions.length} existing role permissions for Admin`);
    console.log(`Skipping ${skippedRolePermissions.length} duplicate role permissions`);
    
    if (rolePermissionsData.length === 0) {
      console.log('No new role permissions to insert');
      return existingRolePermissions;
    }
    
    const { data, error } = await supabase
      .from('role_permissions')
      .insert(rolePermissionsData)
      .select();
      
    if (error) {
      console.error('Error inserting role permissions:', error);
      throw error;
    }
    
    console.log(`Successfully inserted ${rolePermissionsData.length} new role permissions for Admin`);
    return [...data, ...existingRolePermissions];
  } catch (error) {
    console.error('Error in role permissions insertion process:', error);
    throw error;
  }
}

module.exports = insertRolePermissions; 