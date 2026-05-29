-- Script tạo bảng Khách hàng tiềm năng (vnpt_potential_customers)
-- Chạy script này trong phần SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id text PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    coordinates jsonb,
    "previousBillingExpiration" text,
    "painPoints" text,
    "salesNotes" text,
    "staffId" text,
    status text NOT NULL DEFAULT 'NEW',
    "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "createdBy" text
);

-- Bật Row Level Security (RLS)
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép tất cả các thao tác (Tạm thời mở để app có thể đọc/ghi, bạn có thể siết lại sau nếu cần)
DROP POLICY IF EXISTS "Cho phép đọc, ghi KHTN" ON public.vnpt_potential_customers;

CREATE POLICY "Cho phép đọc, ghi KHTN" 
ON public.vnpt_potential_customers 
FOR ALL USING (true);
