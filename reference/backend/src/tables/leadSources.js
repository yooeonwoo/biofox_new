const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * lead_sources 테이블에 데이터 삽입
 */
async function insertLeadSources() {
  console.log('Inserting lead sources...');
  const leadSourcesData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - lead_sources.csv')
      .pipe(csv())
      .on('data', (row) => {
        const leadSource = {
          name: row.name,
          description: handleEmptyField(row.description),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        leadSourcesData.push(leadSource);
      })
      .on('end', async () => {
        try {
          if (leadSourcesData.length === 0) {
            console.log('No lead sources data found in CSV');
            return resolve([]);
          }
          
          const { data, error } = await supabase
            .from('lead_sources')
            .insert(leadSourcesData)
            .select();
            
          if (error) {
            console.error('Error inserting lead sources:', error);
            return reject(error);
          }
          
          console.log(`Successfully inserted ${data.length} lead sources`);
          resolve(data);
        } catch (error) {
          console.error('Error processing lead sources data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading lead sources CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertLeadSources; 