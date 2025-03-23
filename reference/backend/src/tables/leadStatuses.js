const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * lead_statuses 테이블에 데이터 삽입
 */
async function insertLeadStatuses() {
  console.log('Inserting lead statuses...');
  const leadStatusesData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - lead_statuses.csv')
      .pipe(csv())
      .on('data', (row) => {
        const leadStatus = {
          name: row.name,
          description: handleEmptyField(row.description),
          order: parseInt(handleEmptyField(row.order, 0)),
          color: handleEmptyField(row.color),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        leadStatusesData.push(leadStatus);
      })
      .on('end', async () => {
        try {
          if (leadStatusesData.length === 0) {
            console.log('No lead statuses data found in CSV');
            return resolve([]);
          }
          
          const { data, error } = await supabase
            .from('lead_statuses')
            .insert(leadStatusesData)
            .select();
            
          if (error) {
            console.error('Error inserting lead statuses:', error);
            return reject(error);
          }
          
          console.log(`Successfully inserted ${data.length} lead statuses`);
          resolve(data);
        } catch (error) {
          console.error('Error processing lead statuses data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading lead statuses CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertLeadStatuses; 