// init-rpc.js: Supabase에 RPC 함수를 생성하는 스크립트
const supabase = require('./utils/supabase');

async function createRpcFunctions() {
  try {
    console.log('Creating RPC functions...');
    
    // ID 직접 삽입 함수 생성
    const insertWithIdQuery = `
      CREATE OR REPLACE FUNCTION insert_with_id(
        table_name text,
        record jsonb,
        id_value integer
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        EXECUTE format(
          'INSERT INTO %I SELECT * FROM json_populate_record(null::%I, $1) WHERE id = $2',
          table_name,
          table_name
        ) USING record, id_value;
      END;
      $$;
    `;
    
    // 시퀀스 재설정 함수 생성
    const restartSequenceQuery = `
      CREATE OR REPLACE FUNCTION restart_sequence(
        table_name text,
        seq_value integer
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      DECLARE
        seq_name text;
      BEGIN
        -- 테이블의 시퀀스 이름 가져오기
        SELECT pg_get_serial_sequence(table_name, 'id') INTO seq_name;
        
        -- 시퀀스 재설정
        IF seq_name IS NOT NULL THEN
          EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', seq_name, seq_value);
        END IF;
      END;
      $$;
    `;
    
    // 함수 생성 실행 (RPC를 직접 호출할 수 없어 SQL 실행)
    console.log('Attempting to create insert_with_id function...');
    const { error: insertWithIdError } = await supabase.rpc('exec_sql', { sql: insertWithIdQuery });
    
    if (insertWithIdError) {
      console.error('Error creating insert_with_id function:', insertWithIdError);
      
      // 대안: SQL 에디터에서 직접 실행하기 위한 안내
      console.log('\nPlease execute the following SQL in the Supabase SQL Editor:');
      console.log(insertWithIdQuery);
    } else {
      console.log('Successfully created insert_with_id function.');
    }
    
    console.log('Attempting to create restart_sequence function...');
    const { error: restartSequenceError } = await supabase.rpc('exec_sql', { sql: restartSequenceQuery });
    
    if (restartSequenceError) {
      console.error('Error creating restart_sequence function:', restartSequenceError);
      
      // 대안: SQL 에디터에서 직접 실행하기 위한 안내
      console.log('\nPlease execute the following SQL in the Supabase SQL Editor:');
      console.log(restartSequenceQuery);
    } else {
      console.log('Successfully created restart_sequence function.');
    }
    
    console.log('RPC function creation process completed.');
  } catch (error) {
    console.error('Error in RPC function creation process:', error);
    console.log('\nAlternative: Please use the Supabase SQL Editor to create these functions manually using the SQL queries below:');
    console.log('\n--- insert_with_id function ---');
    console.log(insertWithIdQuery);
    console.log('\n--- restart_sequence function ---');
    console.log(restartSequenceQuery);
  }
}

// 실행
createRpcFunctions().catch(console.error); 