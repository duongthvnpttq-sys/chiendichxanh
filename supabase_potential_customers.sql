-- Script cập nhật bảng vnpt_potential_customers

-- 1. Đảm bảo bảng tồn tại (nếu chưa có thì tạo)
CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    coordinates JSONB,
    "currentProvider" TEXT,
    "paymentMethod" TEXT,
    "previousBillingExpiration" TEXT,
    "painPoints" TEXT,
    "salesNotes" TEXT,
    "staffId" TEXT,
    status TEXT DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "createdBy" TEXT
);

-- 2. Thêm các cột mới nếu bảng đã có từ trước nhưng thiếu cột
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vnpt_potential_customers' AND column_name = 'currentProvider') THEN
        ALTER TABLE public.vnpt_potential_customers ADD COLUMN "currentProvider" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vnpt_potential_customers' AND column_name = 'paymentMethod') THEN
        ALTER TABLE public.vnpt_potential_customers ADD COLUMN "paymentMethod" TEXT;
    END IF;
END $$;

-- 3. Xóa các policy cũ để tránh lỗi "already exists"
DROP POLICY IF EXISTS "Cho phép xem với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép thêm với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép sửa với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép xóa với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.vnpt_potential_customers;

-- 4. Bật RLS
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- 5. Tạo lại policies
CREATE POLICY "Allow select for authenticated users" 
ON public.vnpt_potential_customers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.vnpt_potential_customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
ON public.vnpt_potential_customers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
ON public.vnpt_potential_customers FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_potential_customers_staffId ON public.vnpt_potential_customers("staffId");
CREATE INDEX IF NOT EXISTS idx_potential_customers_status ON public.vnpt_potential_customers(status);
