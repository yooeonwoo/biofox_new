CREATE TABLE IF NOT EXISTS public.commissions (
  id SERIAL PRIMARY KEY,
  kol_id INTEGER REFERENCES public.kols(id) NOT NULL,
  order_id INTEGER REFERENCES public.orders(id) NOT NULL,
  amount INTEGER NOT NULL,
  settled BOOLEAN DEFAULT FALSE NOT NULL,
  settled_date TIMESTAMP WITH TIME ZONE,
  settled_note VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 업데이트 트리거
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_commissions_modtime') THEN
    CREATE TRIGGER update_commissions_modtime
      BEFORE UPDATE ON public.commissions
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$; 