CREATE TABLE IF NOT EXISTS public.kols (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  address VARCHAR(500),
  profile_image VARCHAR(500),
  description TEXT,
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  account_holder VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  -- 트리거가 없으면 생성
  DROP TRIGGER IF EXISTS update_kols_modtime ON public.kols;
  CREATE TRIGGER update_kols_modtime
    BEFORE UPDATE ON public.kols
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
END $$; 