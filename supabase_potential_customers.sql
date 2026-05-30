-- SQL Script to create the vnpt_potential_customers table in Supabase

CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    coordinates JSONB, -- Stores { "lat": number, "lng": number }
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

-- Bật RLS (Row Level Security) (Tuỳ chọn: Nếu bạn muốn bảo mật)
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Các Policy mẫu (có thể thay đổi tùy thuộc vào cách bạn thiết lập Auth)
-- Cho phép đọc với tất cả người dùng đã đăng nhập (Authenticated)
CREATE POLICY "Allow select for authenticated users" 
ON public.vnpt_potential_customers 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Cho phép người dùng (nhân viên) có quyền thêm mới khách hàng tiềm năng
CREATE POLICY "Allow insert for authenticated users" 
ON public.vnpt_potential_customers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Cho phép người tạo hoặc quản lý cập nhật khách hàng tiềm năng
CREATE POLICY "Allow update for authenticated users" 
ON public.vnpt_potential_customers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Cho phép người quản trị xóa (Cần thay đổi tùy theo logic phân quyền)
CREATE POLICY "Allow delete for authenticated users" 
ON public.vnpt_potential_customers 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create an index to quickly filter by staff / status
CREATE INDEX IF NOT EXISTS idx_potential_customers_staffId ON public.vnpt_potential_customers("staffId");
CREATE INDEX IF NOT EXISTS idx_potential_customers_status ON public.vnpt_potential_customers(status);
