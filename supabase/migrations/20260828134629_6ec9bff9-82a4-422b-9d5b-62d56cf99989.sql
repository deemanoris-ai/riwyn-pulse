
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  selling_price numeric NOT NULL DEFAULT 0,
  product_cost numeric NOT NULL DEFAULT 0,
  printing_cost numeric NOT NULL DEFAULT 0,
  packaging_cost numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products open" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.business_cost_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  prepaid_shipping_cost numeric NOT NULL DEFAULT 0,
  cod_shipping_cost numeric NOT NULL DEFAULT 0,
  rto_shipping_cost numeric NOT NULL DEFAULT 0,
  return_shipping_cost numeric NOT NULL DEFAULT 0,
  payment_gateway_percent numeric NOT NULL DEFAULT 0,
  payment_fixed_fee numeric NOT NULL DEFAULT 0,
  cod_fee_per_order numeric NOT NULL DEFAULT 0,
  packaging_mode text NOT NULL DEFAULT 'product',
  packaging_cost_per_order numeric NOT NULL DEFAULT 0,
  other_variable_cost_per_order numeric NOT NULL DEFAULT 0,
  include_fixed_costs_in_daily boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_cost_settings TO anon, authenticated;
GRANT ALL ON public.business_cost_settings TO service_role;
ALTER TABLE public.business_cost_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings open" ON public.business_cost_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.business_cost_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_amount numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_costs TO anon, authenticated;
GRANT ALL ON public.fixed_costs TO service_role;
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixed open" ON public.fixed_costs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER fixed_updated BEFORE UPDATE ON public.fixed_costs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.daily_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  gross_sales numeric NOT NULL DEFAULT 0,
  discounts numeric NOT NULL DEFAULT 0,
  refunds numeric NOT NULL DEFAULT 0,
  shipping_charged numeric NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  delivered_orders integer NOT NULL DEFAULT 0,
  cancelled_orders integer NOT NULL DEFAULT 0,
  rto_orders integer NOT NULL DEFAULT 0,
  cod_orders integer NOT NULL DEFAULT 0,
  meta_spend numeric NOT NULL DEFAULT 0,
  agency_spend numeric NOT NULL DEFAULT 0,
  influencer_spend numeric NOT NULL DEFAULT 0,
  other_marketing_spend numeric NOT NULL DEFAULT 0,
  notes text,
  is_demo boolean NOT NULL DEFAULT false,
  cost_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_records TO anon, authenticated;
GRANT ALL ON public.daily_records TO service_role;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily open" ON public.daily_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER daily_updated BEFORE UPDATE ON public.daily_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.daily_product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id uuid NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  selling_price_snapshot numeric NOT NULL DEFAULT 0,
  product_cost_snapshot numeric NOT NULL DEFAULT 0,
  printing_cost_snapshot numeric NOT NULL DEFAULT 0,
  packaging_cost_snapshot numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX daily_product_sales_record_idx ON public.daily_product_sales(daily_record_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_product_sales TO anon, authenticated;
GRANT ALL ON public.daily_product_sales TO service_role;
ALTER TABLE public.daily_product_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dps open" ON public.daily_product_sales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.business_cost_settings (singleton, prepaid_shipping_cost, cod_shipping_cost, rto_shipping_cost, return_shipping_cost, payment_gateway_percent, payment_fixed_fee, cod_fee_per_order, packaging_mode, packaging_cost_per_order, other_variable_cost_per_order)
VALUES (true, 70, 90, 150, 80, 2.36, 0, 40, 'product', 25, 10);

INSERT INTO public.products (id, name, sku, selling_price, product_cost, printing_cost, packaging_cost, active, is_demo) VALUES
 ('11111111-1111-1111-1111-111111111111','RǏWYÑ Jeans','RW-JEAN-01', 2499, 950, 0, 35, true, true),
 ('22222222-2222-2222-2222-222222222222','RǏWYÑ Tee','RW-TEE-01', 1199, 320, 90, 20, true, true),
 ('33333333-3333-3333-3333-333333333333','RǏWYÑ Hoodie','RW-HOOD-01', 2199, 780, 120, 30, true, true);

INSERT INTO public.fixed_costs (name, monthly_amount, is_demo) VALUES
 ('Shopify Plan', 2400, true), ('Apps & Software', 1800, true), ('Salaries', 25000, true);

INSERT INTO public.daily_records (date, gross_sales, discounts, refunds, shipping_charged, sessions, orders, delivered_orders, cancelled_orders, rto_orders, cod_orders, meta_spend, agency_spend, influencer_spend, other_marketing_spend, notes, is_demo, cost_snapshot)
SELECT
  d::date,
  gs, round(gs*0.06), CASE WHEN (n % 7) = 0 THEN round(gs*0.04) ELSE 0 END,
  ord*49, sess, ord,
  greatest(ord - (n % 3) - (n % 2), 0), (n % 3), (n % 2), round(ord*0.6),
  1200 + (n % 5)*300, 0, CASE WHEN (n % 10)=0 THEN 2000 ELSE 0 END, 150,
  'Demo data', true,
  jsonb_build_object('prepaid_shipping_cost',70,'cod_shipping_cost',90,'rto_shipping_cost',150,'return_shipping_cost',80,'payment_gateway_percent',2.36,'payment_fixed_fee',0,'cod_fee_per_order',40,'packaging_mode','product','packaging_cost_per_order',25,'other_variable_cost_per_order',10)
FROM (
  SELECT d, row_number() OVER (ORDER BY d) AS n,
    (600 + (extract(day from d)::int % 9))::int AS sess,
    (4 + (extract(day from d)::int % 6))::int AS ord,
    ((4 + (extract(day from d)::int % 6)) * 1900)::numeric AS gs
  FROM generate_series(current_date - interval '44 day', current_date, interval '1 day') AS d
) s;

INSERT INTO public.daily_product_sales (daily_record_id, product_id, product_name, quantity, selling_price_snapshot, product_cost_snapshot, printing_cost_snapshot, packaging_cost_snapshot)
SELECT r.id, p.id, p.name,
  GREATEST(1, (r.orders / 3) + (CASE WHEN p.sku='RW-JEAN-01' THEN 1 ELSE 0 END)),
  p.selling_price, p.product_cost, p.printing_cost, p.packaging_cost
FROM public.daily_records r CROSS JOIN public.products p;
