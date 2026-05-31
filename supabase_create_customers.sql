-- Script tạo bảng vnpt_customers để lưu trữ thông tin khách hàng trên Supabase
-- Chạy script này trong SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS public.vnpt_customers (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "revenue" NUMERIC,
    "services" JSONB,
    "region" TEXT,
    "categoryId" TEXT,
    "campaignId" TEXT,
    "territory" TEXT,
    "salesManager" TEXT,
    "technicalManager" TEXT,
    "subscriptionId" TEXT,
    "addressDetail" TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);

-- Tắt Row Level Security (RLS) để cho phép app có thể CRUD mà không bị chặn phân quyền
ALTER TABLE public.vnpt_customers DISABLE ROW LEVEL SECURITY;

-- Tạo các index để tối ưu tốc độ tìm kiếm và độ phản hồi
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_campaignId ON public.vnpt_customers("campaignId");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_categoryId ON public.vnpt_customers("categoryId");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_region ON public.vnpt_customers("region");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_territory ON public.vnpt_customers("territory");

-- Có thể bạn sẽ dùng tìm kiếm bằng tên hoặc số điện thoại nên thêm index
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_phone ON public.vnpt_customers("phone");

-- Lệnh này thông báo cho Supabase (PostgREST) làm mới bộ nhớ Cache để nhận cấu trúc bảng mới ngay
NOTIFY pgrst, 'reload schema';
