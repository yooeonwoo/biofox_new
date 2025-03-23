const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField, convertDate, convertCommissionRate } = require('../utils/helpers');

/**
 * products 테이블에 데이터 삽입
 */
async function insertProducts() {
  console.log('Inserting products...');
  const productsData = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./csv/migration - products.csv')
      .pipe(csv())
      .on('data', (row) => {
        const product = {
          name: row.name,
          code: handleEmptyField(row.code),
          category_id: handleEmptyField(row.category_id) ? parseInt(row.category_id) : null,
          description: handleEmptyField(row.description),
          price: handleEmptyField(row.price) ? parseFloat(row.price) : null,
          commission_rate: handleEmptyField(row.commission_rate) ? convertCommissionRate(row.commission_rate) : null,
          created_at: handleEmptyField(row.created_at) ? convertDate(row.created_at) : new Date().toISOString(),
          updated_at: handleEmptyField(row.updated_at) ? convertDate(row.updated_at) : new Date().toISOString()
        };
        productsData.push(product);
      })
      .on('end', async () => {
        try {
          if (productsData.length === 0) {
            console.log('No products data found in CSV');
            return resolve([]);
          }
          
          const { data, error } = await supabase
            .from('products')
            .insert(productsData)
            .select();
            
          if (error) {
            console.error('Error inserting products:', error);
            return reject(error);
          }
          
          console.log(`Successfully inserted ${data.length} products`);
          resolve(data);
        } catch (error) {
          console.error('Error processing products data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading products CSV:', error);
        reject(error);
      });
  });
}

module.exports = insertProducts; 