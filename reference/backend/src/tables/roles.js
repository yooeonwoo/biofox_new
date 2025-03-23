const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * roles 테이블에 데이터 삽입 (중복 처리 추가)
 */
async function insertRoles() {
  console.log('Inserting roles...');
  const rolesData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - roles.csv')
      .pipe(csv())
      .on('data', (row) => {
        // id 필드는 비어있으므로 auto-increment
        const role = {
          name: row.name,
          description: handleEmptyField(row.description),
          created_at: handleEmptyField(row.created_at, new Date().toISOString()),
          updated_at: handleEmptyField(row.updated_at, new Date().toISOString())
        };
        rolesData.push(role);
      })
      .on('end', async () => {
        try {
          if (rolesData.length === 0) {
            console.log('No roles data found in CSV');
            return resolve([]);
          }
          
          // 기존 역할 가져오기
          const { data: existingRoles, error: fetchError } = await supabase
            .from('roles')
            .select('name');
            
          if (fetchError) {
            console.error('Error fetching existing roles:', fetchError);
            return reject(fetchError);
          }
          
          // 중복되지 않은 역할만 필터링
          const existingRoleNames = existingRoles.map(role => role.name);
          const newRoles = rolesData.filter(role => !existingRoleNames.includes(role.name));
          const skippedRoles = rolesData.filter(role => existingRoleNames.includes(role.name));
          
          console.log(`Found ${existingRoles.length} existing roles`);
          console.log(`Skipping ${skippedRoles.length} duplicate roles`);
          
          if (newRoles.length === 0) {
            console.log('No new roles to insert');
            return resolve(existingRoles);
          }
          
          // 새 역할 삽입
          const { data, error } = await supabase
            .from('roles')
            .insert(newRoles)
            .select();
            
          if (error) {
            console.error('Error inserting roles:', error);
            return reject(error);
          }
          
          console.log(`Successfully inserted ${data.length} new roles`);
          resolve([...data, ...existingRoles]);
        } catch (error) {
          console.error('Error processing roles data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading roles CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertRoles; 