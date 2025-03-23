const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * users 테이블에 데이터 삽입 (중복 처리 기능 추가)
 */
async function insertUsers() {
  console.log('Inserting users...');
  const usersData = [];
  let userCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - users.csv')
      .pipe(csv())
      .on('data', (row) => {
        // 이메일이 비어있는 SHOP 유저에 대한 처리
        const email = handleEmptyField(row.email, `placeholder${userCount}@shop.com`);
        
        const user = {
          email: email,
          password_hash: handleEmptyField(row.password_hash, 'TEMPORARY_HASH'), // NOT NULL 제약조건 대응
          full_name: row.full_name,
          role: row.role,
          profile_image: handleEmptyField(row.profile_image),
          phone: handleEmptyField(row.phone),
          created_at: handleEmptyField(row.created_at, new Date().toISOString()),
          updated_at: handleEmptyField(row.updated_at, new Date().toISOString())
        };
        usersData.push(user);
        userCount++;
      })
      .on('end', async () => {
        try {
          if (usersData.length === 0) {
            console.log('No users data found in CSV');
            return resolve([]);
          }
          
          // 중복 처리를 위한 전략: 각 사용자를 개별적으로 처리
          const insertedUsers = [];
          const existingUsers = [];
          
          console.log(`Processing ${usersData.length} users...`);
          
          for (const user of usersData) {
            // 먼저 사용자가 존재하는지 확인
            const { data: existingUser, error: checkError } = await supabase
              .from('users')
              .select('*')
              .eq('email', user.email)
              .maybeSingle();
            
            if (checkError) {
              console.error(`Error checking user ${user.email}:`, checkError);
              continue; // 오류 발생 시 다음 사용자로 진행
            }
            
            if (existingUser) {
              // 이미 존재하는 사용자는 건너뜀
              console.log(`User ${user.email} already exists. Skipping.`);
              existingUsers.push(existingUser);
            } else {
              // 새 사용자 추가
              const { data: insertedUser, error: insertError } = await supabase
                .from('users')
                .insert(user)
                .select()
                .maybeSingle();
              
              if (insertError) {
                console.error(`Error inserting user ${user.email}:`, insertError);
              } else if (insertedUser) {
                insertedUsers.push(insertedUser);
              }
            }
          }
          
          console.log(`Successfully inserted ${insertedUsers.length} new users`);
          console.log(`Skipped ${existingUsers.length} existing users`);
          
          resolve([...insertedUsers, ...existingUsers]);
        } catch (error) {
          console.error('Error processing users data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading users CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertUsers; 