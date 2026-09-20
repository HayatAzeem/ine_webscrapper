-- Run this SQL in the Supabase SQL Editor to create the tables

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price TEXT,
  stock_status TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('success', 'retried', 'failed')),
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Optional, can be customized later)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (since we use backend keys we don't strictly need these, but good for anon keys)
CREATE POLICY "Enable all operations for all users" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON scrape_logs FOR ALL USING (true) WITH CHECK (true);
