create table public.kol_monthly_summary (
  id serial not null,
  kol_id integer null,
  year_month character varying(7) not null,
  monthly_sales integer not null default 0,
  monthly_commission integer not null default 0,
  avg_monthly_sales double precision not null default 0,
  cumulative_commission integer not null default 0,
  previous_month_sales integer not null default 0,
  previous_month_commission integer not null default 0,
  active_shops_count integer not null default 0,
  total_shops_count integer not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint kol_monthly_summary_pkey primary key (id),
  constraint kol_monthly_summary_kol_id_year_month_key unique (kol_id, year_month),
  constraint kol_monthly_summary_kol_id_fkey foreign KEY (kol_id) references kols (id)
) TABLESPACE pg_default;

create index IF not exists idx_kol_monthly_summary_kol_id on public.kol_monthly_summary using btree (kol_id) TABLESPACE pg_default;

create index IF not exists idx_kol_monthly_summary_year_month on public.kol_monthly_summary using btree (year_month) TABLESPACE pg_default;

create trigger set_updated_at_kol_monthly_summary BEFORE
update on kol_monthly_summary for EACH row
execute FUNCTION update_updated_at_column ();