-- Xóa toàn bộ bảng cũ để dọn dẹp các lỗi cấu trúc (UUID vs TEXT, thiếu cột, v.v.)
DROP TABLE IF EXISTS public.vnpt_potential_customers CASCADE;

-- Tạo mới hoàn toàn bảng
CREATE TABLE public.vnpt_potential_customers (
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

-- Bật RLS
ALTER TABLE public.vnpt_potential_customers ENABLE ROW LEVEL SECURITY;

-- Tạo policies chuẩn
CREATE POLICY "Allow select for authenticated users" 
ON public.vnpt_potential_customers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
ON public.vnpt_potential_customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
ON public.vnpt_potential_customers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
ON public.vnpt_potential_customers FOR DELETE USING (auth.role() = 'authenticated');

-- Tạo indexes
CREATE INDEX idx_potential_customers_staffId ON public.vnpt_potential_customers("staffId");
CREATE INDEX idx_potential_customers_status ON public.vnpt_potential_customers(status);
