const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * regions 테이블에 데이터 삽입
 * CSV에 id가 이미 지정되어 있기 때문에 identity를 무시하고 직접 삽입
 */
async function insertRegions() {
  console.log('Inserting regions...');
  const regionsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - regions.csv')
      .pipe(csv())
      .on('data', (row) => {
        // CSV에 id가 이미 지정되어 있음
        const region = {
          id: parseInt(row.id),
          name: row.name,
          code: handleEmptyField(row.code),
          parent_id: handleEmptyField(row.parent_id) ? parseInt(row.parent_id) : null,
          level: parseInt(handleEmptyField(row.level, 0)),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        regionsData.push(region);
      })
      .on('end', async () => {
        try {
          if (regionsData.length === 0) {
            console.log('No regions data found in CSV');
            return resolve([]);
          }
          
          console.log(`Processing ${regionsData.length} regions with direct ID insertion...`);
          
          // identity를 무시하고 id 컬럼을 직접 사용
          const insertedRegions = [];
          let successCount = 0;
          let errorCount = 0;
          
          for (const region of regionsData) {
            try {
              // RPC를 사용하여 ID 직접 삽입
              const { error } = await supabase.rpc('insert_with_id', { 
                table_name: 'regions',
                record: region,
                id_value: region.id
              });
              
              if (error) {
                console.error(`Error inserting region ID=${region.id} using RPC:`, error);
                
                // RPC 함수가 실패하면 일반 삽입 시도 (ID는 무시될 수 있음)
                const { data: fallbackData, error: fallbackError } = await supabase
                  .from('regions')
                  .insert(region)
                  .select();
                
                if (fallbackError) {
                  console.error(`Error with fallback insert for region ID=${region.id}:`, fallbackError);
                  errorCount++;
                } else {
                  console.log(`Successfully inserted region ID=${region.id} using fallback method`);
                  insertedRegions.push(fallbackData[0]);
                  successCount++;
                }
              } else {
                console.log(`Successfully inserted region ID=${region.id} using RPC`);
                insertedRegions.push(region);
                successCount++;
              }
            } catch (error) {
              console.error(`Error processing region ID=${region.id}:`, error);
              errorCount++;
            }
          }
          
          console.log(`Regions insertion completed: ${successCount} successful, ${errorCount} failed`);
          
          // 시퀀스 재설정
          if (successCount > 0) {
            const maxId = Math.max(...regionsData.map(r => r.id)) + 1;
            console.log(`Resetting sequence to ${maxId}...`);
            
            const { error: seqError } = await supabase.rpc('restart_sequence', {
              table_name: 'regions',
              seq_value: maxId
            });
            
            if (seqError) {
              console.error('Error resetting sequence:', seqError);
              console.log('Continuing despite sequence reset error');
            } else {
              console.log(`Successfully reset sequence to ${maxId}`);
            }
          }
          
          resolve(insertedRegions);
        } catch (error) {
          console.error('Error processing regions data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading regions CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertRegions; 