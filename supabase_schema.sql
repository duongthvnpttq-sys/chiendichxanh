-- SQL Script để tạo toàn bộ bảng dữ liệu trên Supabase cho dự án VNPT HR

-- 1. Bảng vnpt_hr_users (Người dùng)
CREATE TABLE IF NOT EXISTS public.vnpt_hr_users (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    username TEXT,
    role TEXT,
    unit TEXT,
    status TEXT,
    phone TEXT,
    email TEXT,
    "lastLogin" TEXT,
    progress NUMERIC DEFAULT 0
);

-- Nếu bảng đã tồn tại từ trước và thiếu các cột này, chúng ta cần bổ sung thêm:
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS "lastLogin" TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.vnpt_hr_users ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Bảng vnpt_hr_territories (Địa bàn)
CREATE TABLE IF NOT EXISTS public.vnpt_hr_territories (
    id TEXT PRIMARY KEY,
    name TEXT,
    count TEXT,
    "staffId" TEXT
);

-- 3. Bảng vnpt_unit_settings (Cài đặt đơn vị)
CREATE TABLE IF NOT EXISTS public.vnpt_unit_settings (
    id TEXT PRIMARY KEY,
    "fullName" TEXT,
    "shortName" TEXT,
    leader TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    "logoUrl" TEXT
);

-- 4. Bảng vnpt_passwords (Mật khẩu cục bộ)
CREATE TABLE IF NOT EXISTS public.vnpt_passwords (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT
);

-- 5. Bảng vnpt_categories (Danh mục / Chương trình)
CREATE TABLE IF NOT EXISTS public.vnpt_categories (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    services JSONB,
    "createdAt" TEXT,
    "createdBy" TEXT
);

-- 6. Bảng vnpt_batches (Đợt triển khai / Chiến dịch)
CREATE TABLE IF NOT EXISTS public.vnpt_batches (
    id TEXT PRIMARY KEY,
    "programId" TEXT,
    name TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    status TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);

-- 7. Bảng vnpt_customers (Khách hàng)
CREATE TABLE IF NOT EXISTS public.vnpt_customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    address TEXT,
    revenue NUMERIC,
    services JSONB,
    region TEXT,
    "categoryId" TEXT,
    "campaignId" TEXT,
    territory TEXT,
    "salesManager" TEXT,
    "technicalManager" TEXT,
    "subscriptionId" TEXT,
    "addressDetail" TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);

-- 8. Bảng vnpt_assignments (Giao việc)
CREATE TABLE IF NOT EXISTS public.vnpt_assignments (
    id TEXT PRIMARY KEY,
    "customerId" TEXT,
    "staffId" TEXT,
    "campaignId" TEXT,
    status TEXT,
    "assignedDate" TEXT,
    deadline TEXT,
    outcome TEXT,
    notes TEXT,
    "checkInLocation" JSONB,
    images JSONB,
    "managerNotes" TEXT,
    priority TEXT,
    "taskType" TEXT,
    "assignedBy" TEXT
);

-- 9. Bảng vnpt_potential_customers (Khách hàng tiềm năng)
CREATE TABLE IF NOT EXISTS public.vnpt_potential_customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    address TEXT,
    coordinates JSONB,
    "previousBillingExpiration" TEXT,
    "painPoints" TEXT,
    "salesNotes" TEXT,
    "staffId" TEXT,
    status TEXT,
    "createdAt" TEXT,
    "createdBy" TEXT
);

-- Tạo Index để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_vnpt_users_email ON public.vnpt_hr_users(email);
CREATE INDEX IF NOT EXISTS idx_vnpt_users_username ON public.vnpt_hr_users(username);
CREATE INDEX IF NOT EXISTS idx_vnpt_customers_territory ON public.vnpt_customers(territory);
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_customerId ON public.vnpt_assignments("customerId");
CREATE INDEX IF NOT EXISTS idx_vnpt_potentials_staffId ON public.vnpt_potential_customers("staffId");

-- Bật Row Level Security (tùy chọn)
-- ALTER TABLE public.vnpt_hr_users ENABLE ROW LEVEL SECURITY;
-- v.v..

-- 10. Tạo tài khoản Admin mặc định (duongth.tqg / Vnpt@123)
-- Sử dụng DO block và EXECUTE để tránh lỗi parse khi các cột vừa mới được thêm
DO $$
BEGIN
    EXECUTE 'INSERT INTO public.vnpt_hr_users (id, code, name, username, role, unit, status, phone, email, "lastLogin", progress)
    VALUES (
        ''00000000-0000-0000-0000-000000000001'', 
        ''ADMIN01'', 
        ''Quản trị Hệ thống'', 
        ''duongth.tqg'', 
        ''ADMIN'', 
        ''VNPT Tuyên Quang'', 
        ''ACTIVE'', 
        ''0900000000'', 
        ''duongth.tqg@vnpt.vn'', 
        '''', 
        0
    ) ON CONFLICT (id) DO NOTHING;';
END $$;

-- Chú ý: Mã băm SHA-256 của chuỗi "Vnpt@123" là "f5e7360410bee0181ab94f44ad49760470666acd0c61a5f2c3f23b3b55a735b2"
INSERT INTO public.vnpt_passwords (user_id, password_hash)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'f5e7360410bee0181ab94f44ad49760470666acd0c61a5f2c3f23b3b55a735b2'
) ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
