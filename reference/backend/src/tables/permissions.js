const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * permissions 테이블에 데이터 삽입 (중복 처리 추가)
 */
async function insertPermissions() {
  console.log('Inserting permissions...');
  const permissionsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - permissions.csv')
      .pipe(csv())
      .on('data', (row) => {
        const permission = {
          name: row.name,
          description: handleEmptyField(row.description),
          resource: row.resource,
          action: row.action,
          created_at: handleEmptyField(row.created_at, new Date().toISOString()),
          updated_at: handleEmptyField(row.updated_at, new Date().toISOString())
        };
        permissionsData.push(permission);
      })
      .on('end', async () => {
        try {
          if (permissionsData.length === 0) {
            console.log('No permissions data found in CSV');
            return resolve([]);
          }
          
          // 기존 권한 가져오기
          const { data: existingPermissions, error: fetchError } = await supabase
            .from('permissions')
            .select('name');
            
          if (fetchError) {
            console.error('Error fetching existing permissions:', fetchError);
            return reject(fetchError);
          }
          
          // 중복되지 않은 권한만 필터링
          const existingPermissionNames = existingPermissions.map(perm => perm.name);
          const newPermissions = permissionsData.filter(perm => !existingPermissionNames.includes(perm.name));
          const skippedPermissions = permissionsData.filter(perm => existingPermissionNames.includes(perm.name));
          
          console.log(`Found ${existingPermissions.length} existing permissions`);
          console.log(`Skipping ${skippedPermissions.length} duplicate permissions`);
          
          if (newPermissions.length === 0) {
            console.log('No new permissions to insert');
            return resolve(existingPermissions);
          }
          
          // 새 권한 삽입
          const { data, error } = await supabase
            .from('permissions')
            .insert(newPermissions)
            .select();
            
          if (error) {
            console.error('Error inserting permissions:', error);
            return reject(error);
          }
          
          console.log(`Successfully inserted ${data.length} new permissions`);
          
          // 모든 권한 목록 반환 (새로 삽입된 것 + 기존 것)
          const { data: allPermissions, error: allError } = await supabase
            .from('permissions')
            .select('*');
            
          if (allError) {
            console.error('Error fetching all permissions:', allError);
            return resolve([...data, ...existingPermissions]);
          }
          
          resolve(allPermissions);
        } catch (error) {
          console.error('Error processing permissions data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading permissions CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertPermissions; 