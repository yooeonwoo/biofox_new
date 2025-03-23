CREATE TABLE IF NOT EXISTS public.shops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  kol_id INTEGER REFERENCES public.kols(id) NOT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(100),
  business_number VARCHAR(100),
  description TEXT,
  image VARCHAR(500),
  operating_hours VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shops_modtime') THEN
    CREATE TRIGGER update_shops_modtime
      BEFORE UPDATE ON public.shops
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 