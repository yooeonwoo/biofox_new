const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField, convertDate } = require('../utils/helpers');

/**
 * leads 테이블에 데이터 삽입
 */
async function insertLeads() {
  console.log('Inserting leads...');
  const leadsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - leads.csv')
      .pipe(csv())
      .on('data', (row) => {
        const lead = {
          name: row.name,
          email: handleEmptyField(row.email),
          phone: handleEmptyField(row.phone),
          status_id: handleEmptyField(row.status_id) ? parseInt(row.status_id) : 1, // 기본값: 신규(1)
          source_id: handleEmptyField(row.source_id) ? parseInt(row.source_id) : 1, // 기본값: 메타 광고(1)
          assigned_to: handleEmptyField(row.assigned_to) ? parseInt(row.assigned_to) : null,
          notes: handleEmptyField(row.notes),
          created_at: handleEmptyField(row.created_at) ? convertDate(row.created_at) : new Date().toISOString(),
          updated_at: handleEmptyField(row.updated_at) ? convertDate(row.updated_at) : new Date().toISOString(),
          seminar_reservation_date: handleEmptyField(row.seminar_reservation_date) ? convertDate(row.seminar_reservation_date) : null,
          cafe_id: handleEmptyField(row.cafe_id)
        };
        leadsData.push(lead);
      })
      .on('end', async () => {
        try {
          if (leadsData.length === 0) {
            console.log('No leads data found in CSV');
            return resolve([]);
          }
          
          // 대량의 데이터를 여러 번에 나눠서 삽입
          const batchSize = 100;
          const insertedLeads = [];
          let successCount = 0;
          let errorCount = 0;
          
          console.log(`Processing ${leadsData.length} leads in batches of ${batchSize}...`);
          
          for (let i = 0; i < leadsData.length; i += batchSize) {
            const batch = leadsData.slice(i, i + batchSize);
            try {
              const { data, error } = await supabase
                .from('leads')
                .insert(batch)
                .select();
                
              if (error) {
                console.error(`Error inserting leads batch ${Math.floor(i/batchSize) + 1}:`, error);
                errorCount += batch.length;
              } else {
                console.log(`Successfully inserted leads batch ${Math.floor(i/batchSize) + 1} (${data.length} records)`);
                insertedLeads.push(...data);
                successCount += data.length;
              }
            } catch (error) {
              console.error(`Error processing leads batch ${Math.floor(i/batchSize) + 1}:`, error);
              errorCount += batch.length;
            }
          }
          
          console.log(`Leads insertion completed: ${successCount} successful, ${errorCount} failed`);
          resolve(insertedLeads);
        } catch (error) {
          console.error('Error processing leads data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading leads CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertLeads; 