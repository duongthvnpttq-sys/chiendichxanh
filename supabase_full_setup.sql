-- TỔNG HỢP CÁC SCRIPT TẠO BẢNG CHO CHO DỰ ÁN QUẢN LÝ LỊCH CÔNG TÁC VNPT

-- 1. BẢNG KHÁCH HÀNG (vnpt_customers)
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
ALTER TABLE public.vnpt_customers DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_campaignId ON public.vnpt_customers("campaignId");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_categoryId ON public.vnpt_customers("categoryId");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_region ON public.vnpt_customers("region");
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_territory ON public.vnpt_customers("territory");

-- 2. BẢNG GIAO NHIỆM VỤ (vnpt_assignments)
CREATE TABLE IF NOT EXISTS public.vnpt_assignments (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "assignedDate" TEXT,
    "deadline" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "checkInLocation" JSONB,
    "images" JSONB,
    "managerNotes" TEXT,
    "priority" TEXT,
    "taskType" TEXT,
    "assignedBy" TEXT
);
ALTER TABLE public.vnpt_assignments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_campaignId ON public.vnpt_assignments("campaignId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_customerId ON public.vnpt_assignments("customerId");

-- 3. BẢNG ĐỢT TRIỂN KHAI / CHIẾN DỊCH (vnpt_batches)
CREATE TABLE IF NOT EXISTS public.vnpt_batches (
    "id" TEXT PRIMARY KEY,
    "programId" TEXT,
    "name" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);
ALTER TABLE public.vnpt_batches DISABLE ROW LEVEL SECURITY;

-- 4. BẢNG DANH MỤC DỊCH VỤ (vnpt_categories)
CREATE TABLE IF NOT EXISTS public.vnpt_categories (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "services" JSONB,
    "createdAt" TEXT,
    "createdBy" TEXT
);
ALTER TABLE public.vnpt_categories DISABLE ROW LEVEL SECURITY;

-- 5. BẢNG KHÁCH HÀNG TIỀM NĂNG (vnpt_potential_customers)
CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "coordinates" JSONB,
    "currentProvider" TEXT,
    "paymentMethod" TEXT,
    "previousBillingExpiration" TEXT,
    "painPoints" TEXT,
    "salesNotes" TEXT,
    "staffId" TEXT,
    "status" TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);
ALTER TABLE public.vnpt_potential_customers DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vnpt_potentials_staffId ON public.vnpt_potential_customers("staffId");

-- 6. BẢNG THÔNG BÁO (vnpt_notifications)
CREATE TABLE IF NOT EXISTS public.vnpt_notifications (
    "id" TEXT PRIMARY KEY,
    "title" TEXT,
    "message" TEXT,
    "type" TEXT,
    "timestamp" TEXT,
    "read" BOOLEAN DEFAULT FALSE,
    "actionUrl" TEXT,
    "userId" TEXT
);
ALTER TABLE public.vnpt_notifications DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vnpt_notifications_userId ON public.vnpt_notifications("userId");

-- 7. BẢNG NHÂN SỰ & NGƯỜI DÙNG (vnpt_hr_users)
CREATE TABLE IF NOT EXISTS public.vnpt_hr_users (
    "id" TEXT PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "role" TEXT,
    "unit" TEXT,
    "status" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "lastLogin" TEXT,
    "progress" NUMERIC
);
ALTER TABLE public.vnpt_hr_users DISABLE ROW LEVEL SECURITY;

-- 8. BẢNG MẬT KHẨU OFFLINE/HASH (vnpt_passwords)
CREATE TABLE IF NOT EXISTS public.vnpt_passwords (
    "user_id" TEXT PRIMARY KEY,
    "password_hash" TEXT
);
ALTER TABLE public.vnpt_passwords DISABLE ROW LEVEL SECURITY;

-- 9. BẢNG ĐỊA BÀN PHỤ TRÁCH (vnpt_hr_territories)
CREATE TABLE IF NOT EXISTS public.vnpt_hr_territories (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "count" TEXT,
    "staffId" TEXT
);
ALTER TABLE public.vnpt_hr_territories DISABLE ROW LEVEL SECURITY;

-- 10. BẢNG CẤU HÌNH ĐƠN VỊ (vnpt_unit_settings)
CREATE TABLE IF NOT EXISTS public.vnpt_unit_settings (
    "id" TEXT PRIMARY KEY,
    "fullName" TEXT,
    "shortName" TEXT,
    "leader" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT
);
ALTER TABLE public.vnpt_unit_settings DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- XOÁ BỘ NHỚ CACHE CỦA SUPABASE POSTGREST ĐỂ CẬP NHẬT CẤU TRÚC MỚI NHẤT
NOTIFY pgrst, 'reload schema';
