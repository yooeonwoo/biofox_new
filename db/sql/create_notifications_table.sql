CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_modtime') THEN
    CREATE TRIGGER update_notifications_modtime
      BEFORE UPDATE ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 