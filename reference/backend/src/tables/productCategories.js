const fs = require('fs');
const csv = require('csv-parser');
const supabase = require('../utils/supabase');
const { handleEmptyField } = require('../utils/helpers');

/**
 * product_categories 테이블에 데이터 삽입
 * 먼저 루트 카테고리를 생성하고 그 다음 하위 카테고리 추가
 * 중복 처리 기능 추가
 */
async function insertProductCategories() {
  console.log('Inserting product categories...');
  
  try {
    // 먼저 루트 카테고리가 이미 존재하는지 확인
    const { data: existingRoot, error: checkError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking root category:', checkError);
      throw checkError;
    }
    
    // 루트 카테고리가 없는 경우에만 생성
    if (!existingRoot) {
      // 루트 카테고리 생성
      const rootCategory = {
        id: 1,
        name: 'ROOT',
        code: 'root',
        parent_id: null,
        description: '최상위 카테고리',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // id=1로 직접 삽입하기 위해 identity를 무시하는 RPC 호출
      console.log('Inserting root product category with ID=1...');
      const { error: rootError } = await supabase.rpc('insert_with_id', { 
        table_name: 'product_categories',
        record: rootCategory,
        id_value: 1
      });
      
      if (rootError) {
        console.error('Error inserting root category using RPC:', rootError);
        
        // RPC 함수가 없거나 오류가 발생한 경우 일반 삽입 시도
        console.log('Attempting regular insert for root category...');
        const { error: fallbackError } = await supabase
          .from('product_categories')
          .insert(rootCategory);
        
        if (fallbackError) {
          console.error('Error with fallback insert of root category:', fallbackError);
          throw fallbackError;
        }
      }
      
      console.log('Successfully inserted root product category');
    } else {
      console.log('Root category already exists, skipping creation');
    }
    
    // 다음으로 CSV에서 하위 카테고리 추가
    return new Promise((resolve, reject) => {
      const categoriesData = [];
      
      fs.createReadStream('./csv/migration - product_categories.csv')
        .pipe(csv())
        .on('data', (row) => {
          // id=1을 부모로 하는 하위 카테고리
          const category = {
            name: row.name,
            code: handleEmptyField(row.code),
            parent_id: parseInt(handleEmptyField(row.parent_id, 1)),
            description: handleEmptyField(row.description),
            created_at: handleEmptyField(row.created_at, new Date().toISOString()),
            updated_at: handleEmptyField(row.updated_at, new Date().toISOString())
          };
          categoriesData.push(category);
        })
        .on('end', async () => {
          try {
            if (categoriesData.length === 0) {
              console.log('No product categories data found in CSV');
              return resolve([]);
            }
            
            // 기존 카테고리 조회 (루트 외)
            const { data: existingCategories, error: fetchError } = await supabase
              .from('product_categories')
              .select('name')
              .neq('id', 1);
              
            if (fetchError) {
              console.error('Error fetching existing categories:', fetchError);
              return reject(fetchError);
            }
            
            // 중복되지 않은 카테고리만 필터링
            const existingCategoryNames = existingCategories.map(cat => cat.name);
            const newCategories = categoriesData.filter(cat => !existingCategoryNames.includes(cat.name));
            const skippedCategories = categoriesData.filter(cat => existingCategoryNames.includes(cat.name));
            
            console.log(`Found ${existingCategories.length} existing categories (excluding root)`);
            console.log(`Skipping ${skippedCategories.length} duplicate categories`);
            
            if (newCategories.length === 0) {
              console.log('No new categories to insert');
              
              // 모든 카테고리 정보 가져오기
              const { data: allCategories, error: allError } = await supabase
                .from('product_categories')
                .select('*');
                
              if (allError) {
                console.error('Error fetching all categories:', allError);
                return resolve([]);
              }
              
              return resolve(allCategories);
            }
            
            // 새 카테고리 삽입
            const { data, error } = await supabase
              .from('product_categories')
              .insert(newCategories)
              .select();
              
            if (error) {
              console.error('Error inserting product categories:', error);
              return reject(error);
            }
            
            console.log(`Successfully inserted ${data.length} new product categories`);
            
            // 모든 카테고리 정보 가져오기
            const { data: allCategories, error: allError } = await supabase
              .from('product_categories')
              .select('*');
              
            if (allError) {
              console.error('Error fetching all categories:', allError);
              return resolve(data);
            }
            
            resolve(allCategories);
          } catch (error) {
            console.error('Error processing product categories data:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading product categories CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error in product categories insertion process:', error);
    throw error;
  }
}

module.exports = insertProductCategories; 