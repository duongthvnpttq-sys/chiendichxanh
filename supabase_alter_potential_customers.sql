-- Script cập nhật bảng Khách hàng tiềm năng (vnpt_potential_customers)
-- Chạy script này trong phần SQL Editor của Supabase để thêm các cột còn thiếu do bảng đã tồn tại từ trước

ALTER TABLE IF EXISTS public.vnpt_potential_customers 
ADD COLUMN IF NOT EXISTS coordinates jsonb,
ADD COLUMN IF NOT EXISTS "previousBillingExpiration" text,
ADD COLUMN IF NOT EXISTS "painPoints" text,
ADD COLUMN IF NOT EXISTS "salesNotes" text,
ADD COLUMN IF NOT EXISTS "staffId" text,
ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS "createdBy" text;

-- Bật Row Level Security (RLS)
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép tất cả các thao tác (nếu chưa có)
DROP POLICY IF EXISTS "Cho phép đọc, ghi KHTN" ON public.vnpt_potential_customers;
CREATE POLICY "Cho phép đọc, ghi KHTN" 
ON public.vnpt_potential_customers 
FOR ALL USING (true);
