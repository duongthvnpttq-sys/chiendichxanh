-- Script khởi tạo bảng: vnpt_potential_customers
CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id text PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    coordinates jsonb,
    "previousBillingExpiration" text,
    "painPoints" text,
    status text DEFAULT 'NEW',
    "createdAt" text
);

-- Kích hoạt Row Level Security
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép thao tác (nếu không có auth cho admin)
CREATE POLICY "Allow all operations for potential customers" ON public.vnpt_potential_customers
    FOR ALL USING (true) WITH CHECK (true);
