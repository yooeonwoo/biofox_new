CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  is_device BOOLEAN DEFAULT FALSE NOT NULL,
  description TEXT,
  image VARCHAR(500),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_modtime') THEN
    CREATE TRIGGER update_products_modtime
      BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 