-- Script tạo mới bảng vnpt_potential_customers đồng bộ thông tin khách hàng tiềm năng lên Supabase

-- Xóa bảng cũ nếu cần thiết (Cảnh báo: Sẽ xóa toàn bộ dữ liệu hiện tại trong bảng này)
-- Hãy bỏ comment dòng DROP TABLE dưới đây nếu bạn muốn tạo lại từ đầu
-- DROP TABLE IF EXISTS public.vnpt_potential_customers;

CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id TEXT PRIMARY KEY,
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

-- Bắt buộc sửa lại kiểu dữ liệu của id thành TEXT phòng trường hợp bảng cũ đã được tạo bằng UUID
ALTER TABLE public.vnpt_potential_customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.vnpt_potential_customers ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Bắt buộc thêm các cột mới vào phòng trường hợp bảng cũ thiếu
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vnpt_potential_customers' AND column_name = 'currentProvider') THEN
        ALTER TABLE public.vnpt_potential_customers ADD COLUMN "currentProvider" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vnpt_potential_customers' AND column_name = 'paymentMethod') THEN
        ALTER TABLE public.vnpt_potential_customers ADD COLUMN "paymentMethod" TEXT;
    END IF;
END $$;

-- Bật RLS
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ để tránh lỗi "already exists" (nếu có)
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép xem với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép thêm với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép sửa với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép cập nhật với người dùng đã đăng nhập" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Cho phép xóa với người dùng đã đăng nhập" ON public.vnpt_potential_customers;

-- Tạo policies
CREATE POLICY "Allow select for authenticated users" 
ON public.vnpt_potential_customers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.vnpt_potential_customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
ON public.vnpt_potential_customers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
ON public.vnpt_potential_customers FOR DELETE USING (auth.role() = 'authenticated');

--Tạo indexes để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_potential_customers_staffId ON public.vnpt_potential_customers("staffId");
CREATE INDEX IF NOT EXISTS idx_potential_customers_status ON public.vnpt_potential_customers(status);
