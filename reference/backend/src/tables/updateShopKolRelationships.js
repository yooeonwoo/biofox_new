const supabase = require('../utils/supabase');

/**
 * Shop-KOL 관계 업데이트
 * 양방향 참조 관계 설정 및 KOL 계층 구조 설정
 */
async function updateShopKolRelationships() {
  console.log('Updating Shop-KOL relationships...');
  
  try {
    // 1. 먼저 KOL 데이터와 Shop 데이터 가져오기
    const { data: kols, error: kolsError } = await supabase
      .from('kols')
      .select('id, user_id');
    
    if (kolsError) {
      console.error('Error fetching kols:', kolsError);
      throw kolsError;
    }
    
    if (!kols || kols.length === 0) {
      console.log('No kols found, skipping relationship updates');
      return [];
    }
    
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, owner_name');
    
    if (shopsError) {
      console.error('Error fetching shops:', shopsError);
      throw shopsError;
    }
    
    if (!shops || shops.length === 0) {
      console.log('No shops found, skipping relationship updates');
      return [];
    }
    
    // 2. users 테이블에서 KOL 관련 사용자 정보 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('role', 'KOL');
    
    if (usersError) {
      console.error('Error fetching user data:', usersError);
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No KOL users found, skipping relationship updates');
      return [];
    }
    
    // 3. Shop과 KOL 매핑
    // 이 예제에서는 랜덤 매핑을 사용합니다.
    // 실제 구현에서는 이름 매칭이나 다른 비즈니스 로직을 사용할 수 있습니다.
    console.log('Setting up Shop-KOL relationships...');
    const updates = [];
    
    // 각 KOL에 대해 랜덤 Shop 할당 (중복 없이)
    const assignedShopIds = new Set();
    const shopKolMapping = {};
    
    // 먼저 실제 user.full_name과 shop.owner_name이 일치하는 경우 매핑
    for (const kol of kols) {
      const user = users.find(u => u.id === kol.user_id);
      if (!user) continue;
      
      // 사용자 이름으로 매칭되는 shop 찾기
      const matchingShop = shops.find(shop => 
        user.full_name === shop.owner_name || 
        (shop.owner_name && shop.owner_name.includes(user.full_name))
      );
      
      if (matchingShop && !assignedShopIds.has(matchingShop.id)) {
        shopKolMapping[kol.id] = matchingShop.id;
        assignedShopIds.add(matchingShop.id);
        
        // 양방향 관계 업데이트
        await updateRelationship(kol.id, matchingShop.id);
        updates.push({ kol_id: kol.id, shop_id: matchingShop.id, method: 'name_match' });
      }
    }
    
    // 매핑되지 않은 KOL에 대해 랜덤 할당
    for (const kol of kols) {
      if (shopKolMapping[kol.id]) continue; // 이미 매핑됨
      
      // 할당되지 않은 shop 중에서 랜덤 선택
      const availableShops = shops.filter(shop => !assignedShopIds.has(shop.id));
      
      if (availableShops.length > 0) {
        const randomShop = availableShops[Math.floor(Math.random() * availableShops.length)];
        shopKolMapping[kol.id] = randomShop.id;
        assignedShopIds.add(randomShop.id);
        
        // 양방향 관계 업데이트
        await updateRelationship(kol.id, randomShop.id);
        updates.push({ kol_id: kol.id, shop_id: randomShop.id, method: 'random_assign' });
      }
    }
    
    console.log(`Successfully updated ${updates.length} Shop-KOL relationships`);
    
    // 4. KOL 계층 구조 설정 - 부모/자식 관계
    // 상위 20%의 KOL을 부모로 설정
    if (kols.length > 1) {
      console.log('Setting up KOL hierarchical relationships...');
      const parentCount = Math.max(1, Math.floor(kols.length * 0.2)); // 상위 20%를 부모로
      
      // device_sales_count로 정렬하여 상위 KOL 찾기
      const { data: sortedKols, error: sortError } = await supabase
        .from('kols')
        .select('id, device_sales_count')
        .order('device_sales_count', { ascending: false });
        
      if (sortError) {
        console.error('Error sorting kols:', sortError);
      } else {
        const parentKols = sortedKols.slice(0, parentCount);
        const childKols = sortedKols.slice(parentCount);
        
        console.log(`Setting ${parentCount} parent KOLs and ${childKols.length} child KOLs`);
        
        let hierarchyUpdateCount = 0;
        
        for (let i = 0; i < childKols.length; i++) {
          const parentIndex = i % parentCount;
          const parentKol = parentKols[parentIndex];
          
          // 부모 KOL 설정
          const { error: parentUpdateError } = await supabase
            .from('kols')
            .update({ parent_kol_id: parentKol.id })
            .eq('id', childKols[i].id);
          
          if (parentUpdateError) {
            console.error(`Error setting parent KOL for KOL ${childKols[i].id}:`, parentUpdateError);
          } else {
            hierarchyUpdateCount++;
          }
        }
        
        console.log(`Successfully set up hierarchical relationships for ${hierarchyUpdateCount} KOLs`);
      }
    }
    
    return updates;
  } catch (error) {
    console.error('Error updating Shop-KOL relationships:', error);
    throw error;
  }
}

/**
 * KOL과 Shop 간의 양방향 관계 업데이트
 */
async function updateRelationship(kolId, shopId) {
  // 1. kol.affiliated_shop_id 업데이트
  const { error: kolUpdateError } = await supabase
    .from('kols')
    .update({ affiliated_shop_id: shopId })
    .eq('id', kolId);
  
  if (kolUpdateError) {
    console.error(`Error updating KOL ${kolId} with shop ${shopId}:`, kolUpdateError);
    return false;
  }
  
  // 2. shop.kol_id 업데이트
  const { error: shopUpdateError } = await supabase
    .from('shops')
    .update({ kol_id: kolId })
    .eq('id', shopId);
  
  if (shopUpdateError) {
    console.error(`Error updating Shop ${shopId} with KOL ${kolId}:`, shopUpdateError);
    
    // 오류 발생 시 kol 업데이트 롤백
    const { error: rollbackError } = await supabase
      .from('kols')
      .update({ affiliated_shop_id: null })
      .eq('id', kolId);
      
    if (rollbackError) {
      console.error(`Error rolling back KOL ${kolId}:`, rollbackError);
    }
    
    return false;
  }
  
  return true;
}

module.exports = updateShopKolRelationships; 