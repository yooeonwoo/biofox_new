const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Checking KOL and Shop relationships...');
  
  // 1. Get all KOLs
  const { data: kols, error: kolError } = await supabase
    .from('kols')
    .select('id, name, shop_name');
  
  if (kolError) {
    console.error('Error fetching KOLs:', kolError);
    return;
  }
  
  console.log(`Found ${kols.length} KOLs`);
  
  // 2. For each KOL, check if shops exist
  for (const kol of kols) {
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('id, shop_name, owner_name')
      .eq('kol_id', kol.id);
    
    if (shopError) {
      console.error(`Error fetching shops for KOL ${kol.id}:`, shopError);
      continue;
    }
    
    console.log(`KOL ID ${kol.id} (${kol.name}) has ${shops.length} shops`);
    
    if (shops.length > 0) {
      console.log('  Shop names:', shops.map(s => s.shop_name).join(', '));
    }
  }
  
  // 3. Check shops without KOL association
  const { data: orphanedShops, error: orphanError } = await supabase
    .from('shops')
    .select('id, shop_name, kol_id')
    .is('kol_id', null);
  
  if (orphanError) {
    console.error('Error fetching orphaned shops:', orphanError);
  } else {
    console.log(`Found ${orphanedShops ? orphanedShops.length : 0} shops without KOL association`);
  }
  
  // 4. Check shops with KOL association
  const { data: validShops, error: validError } = await supabase
    .from('shops')
    .select('id, shop_name, kol_id')
    .not('kol_id', 'is', null);
  
  if (validError) {
    console.error('Error fetching shops with KOL association:', validError);
  } else {
    console.log(`Found ${validShops ? validShops.length : 0} shops with KOL association`);
    
    // Check if the KOL IDs exist
    if (validShops && validShops.length > 0) {
      const kolIds = [...new Set(validShops.map(shop => shop.kol_id))];
      
      const { data: existingKols, error: existingKolsError } = await supabase
        .from('kols')
        .select('id')
        .in('id', kolIds);
      
      if (existingKolsError) {
        console.error('Error checking KOL existence:', existingKolsError);
      } else {
        const existingKolIds = existingKols.map(k => k.id);
        const missingKolIds = kolIds.filter(id => !existingKolIds.includes(id));
        
        if (missingKolIds.length > 0) {
          console.log(`Found ${missingKolIds.length} shops with invalid KOL IDs:`, missingKolIds);
          
          // List shops with invalid KOL IDs
          const invalidKolShops = validShops.filter(shop => missingKolIds.includes(shop.kol_id));
          console.log('Invalid KOL shops:', invalidKolShops);
        } else {
          console.log('All shops reference valid KOL IDs');
        }
      }
    }
  }
}

checkData().catch(console.error); 