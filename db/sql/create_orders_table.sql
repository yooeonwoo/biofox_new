CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL UNIQUE,
  shop_id INTEGER REFERENCES public.shops(id) NOT NULL,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  payment_method VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_modtime') THEN
    CREATE TRIGGER update_orders_modtime
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 