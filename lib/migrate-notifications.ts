import { db } from '@/lib/db';

/**
 * 알림 테이블이 존재하는지 확인하고 없으면 생성하는 함수
 */
export async function ensureNotificationsTable() {
  try {
    console.log('알림 테이블 확인 중...');
    
    // 테이블 존재 여부 확인
    const tableCheck = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );`
    );
    
    const tableExists = tableCheck.rows[0]?.exists;
    console.log('notifications 테이블 존재 여부:', tableExists);
    
    if (!tableExists) {
      console.log('notifications 테이블이 존재하지 않음, 생성 시도...');
      
      // 테이블 생성 (SQL 파일의 내용을 직접 사용)
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES public.users(id) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content VARCHAR(1000) NOT NULL,
          read BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
      
      // updated_at 칼럼을 자동으로 업데이트하는 트리거 함수 존재 여부 확인
      const triggerFunctionCheck = await db.query(
        `SELECT EXISTS (
          SELECT FROM pg_proc 
          WHERE proname = 'update_modified_column'
        );`
      );
      
      const triggerFunctionExists = triggerFunctionCheck.rows[0]?.exists;
      
      if (!triggerFunctionExists) {
        console.log('update_modified_column 함수가 존재하지 않음, 생성...');
        
        // 트리거 함수 생성
        await db.query(`
          CREATE OR REPLACE FUNCTION update_modified_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);
      }
      
      // 트리거 생성
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_modtime') THEN
            CREATE TRIGGER update_notifications_modtime
              BEFORE UPDATE ON public.notifications
              FOR EACH ROW EXECUTE FUNCTION update_modified_column();
          END IF;
        END $$;
      `);
      
      console.log('notifications 테이블이 성공적으로 생성되었습니다.');
      return true;
    } else {
      console.log('notifications 테이블이 이미 존재합니다.');
      return true;
    }
  } catch (error) {
    console.error('알림 테이블 확인/생성 중 오류 발생:', error);
    return false;
  }
} 