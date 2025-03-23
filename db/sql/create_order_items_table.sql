CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_order_items_modtime') THEN
    CREATE TRIGGER update_order_items_modtime
      BEFORE UPDATE ON public.order_items
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 