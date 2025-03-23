const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField, convertDate } = require('../utils/helpers');

/**
 * shops 테이블에 데이터 삽입
 */
async function insertShops() {
  console.log('Inserting shops...');
  const shopsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - shops.csv')
      .pipe(csv())
      .on('data', (row) => {
        const shop = {
          name: row.name,
          owner_name: handleEmptyField(row.owner_name),
          address: handleEmptyField(row.address),
          phone: handleEmptyField(row.phone),
          email: handleEmptyField(row.email),
          business_number: handleEmptyField(row.business_number),
          status: handleEmptyField(row.status, 'active'),
          manager_id: handleEmptyField(row.manager_id) ? parseInt(row.manager_id) : null,
          region_id: handleEmptyField(row.region_id) ? parseInt(row.region_id) : null,
          created_at: handleEmptyField(row.created_at) ? convertDate(row.created_at) : new Date().toISOString(),
          updated_at: handleEmptyField(row.updated_at) ? convertDate(row.updated_at) : new Date().toISOString(),
          converted_from_lead_id: handleEmptyField(row.converted_from_lead_id) ? parseInt(row.converted_from_lead_id) : null,
          kol_id: null // 나중에 updateShopKolRelationships 함수에서 업데이트
        };
        shopsData.push(shop);
      })
      .on('end', async () => {
        try {
          if (shopsData.length === 0) {
            console.log('No shops data found in CSV');
            return resolve([]);
          }
          
          // 대량의 데이터를 여러 번에 나눠서 삽입
          const batchSize = 100;
          const insertedShops = [];
          let successCount = 0;
          let errorCount = 0;
          
          console.log(`Processing ${shopsData.length} shops in batches of ${batchSize}...`);
          
          for (let i = 0; i < shopsData.length; i += batchSize) {
            const batch = shopsData.slice(i, Math.min(i + batchSize, shopsData.length));
            try {
              const { data, error } = await supabase
                .from('shops')
                .insert(batch)
                .select();
                
              if (error) {
                console.error(`Error inserting shops batch ${Math.floor(i/batchSize) + 1}:`, error);
                errorCount += batch.length;
              } else {
                console.log(`Successfully inserted shops batch ${Math.floor(i/batchSize) + 1} (${data.length} records)`);
                insertedShops.push(...data);
                successCount += data.length;
              }
            } catch (error) {
              console.error(`Error processing shops batch ${Math.floor(i/batchSize) + 1}:`, error);
              errorCount += batch.length;
            }
          }
          
          console.log(`Shops insertion completed: ${successCount} successful, ${errorCount} failed`);
          resolve(insertedShops);
        } catch (error) {
          console.error('Error processing shops data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading shops CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertShops; 