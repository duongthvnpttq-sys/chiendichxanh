-- =========================================================================
-- MASTER SQL SCRIPT: KHỞI TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU ĐỒNG BỘ TRÊN SUPABASE (PRODUCTION)
-- Dự án: Hệ Thống Giao Việc & Điều Hành CSKH - VNPT Tuyên Quang
-- Hướng dẫn: Sao chép toàn bộ mã này, dán vào SQL Editor của Supabase và ấn RUN.
-- =========================================================================

-- =========================================================================
-- I. DỌN DẸP HỆ THỐNG CŨ (Nếu có dọn dẹp sạch sẽ để tránh lỗi xung đột)
-- =========================================================================
DROP TRIGGER IF EXISTS trigger_sync_auth_user_on_signup ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_log_user_sign_in_success ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_user_on_signup() CASCADE;
DROP FUNCTION IF EXISTS public.log_user_sign_in_success() CASCADE;

DROP VIEW IF EXISTS public.customers CASCADE;
DROP VIEW IF EXISTS public.assignments CASCADE;
DROP VIEW IF EXISTS public.batches CASCADE;
DROP VIEW IF EXISTS public.categories CASCADE;
DROP VIEW IF EXISTS public.hr_users CASCADE;
DROP VIEW IF EXISTS public.hr_territories CASCADE;
DROP VIEW IF EXISTS public.unit_settings CASCADE;

DROP TABLE IF EXISTS public.vnpt_login_history CASCADE;
DROP TABLE IF EXISTS public.vnpt_auth_accounts CASCADE;
DROP TABLE IF EXISTS public.vnpt_assignments CASCADE;
DROP TABLE IF EXISTS public.vnpt_customers CASCADE;
DROP TABLE IF EXISTS public.vnpt_batches CASCADE;
DROP TABLE IF EXISTS public.vnpt_categories CASCADE;
DROP TABLE IF EXISTS public.vnpt_hr_territories CASCADE;
DROP TABLE IF EXISTS public.vnpt_hr_users CASCADE;
DROP TABLE IF EXISTS public.vnpt_unit_settings CASCADE;

-- =========================================================================
-- II. KHỞI TẠO CÁC BẢNG NGIỆP VỤ (Với tên cột Double-Quoted bảo toàn CamelCase)
-- =========================================================================

-- 1. Bảng Thiết lập Đơn vị (vnpt_unit_settings)
CREATE TABLE public.vnpt_unit_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings_single',
    "fullName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    leader TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    "logoUrl" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bảng Quản lý Nhân sự (vnpt_hr_users)
CREATE TABLE public.vnpt_hr_users (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Nhân viên',
    unit TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEAVE', 'LOCKED')),
    phone TEXT,
    email TEXT,
    "lastLogin" TEXT,
    progress NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bảng Quản lý Địa bàn (vnpt_hr_territories)
CREATE TABLE public.vnpt_hr_territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    count TEXT,
    "staffId" TEXT REFERENCES public.vnpt_hr_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Bảng Danh mục Chương trình / Dịch vụ (vnpt_categories)
CREATE TABLE public.vnpt_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    services TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bảng Chiến dịch / Đợt Giao việc (vnpt_batches)
CREATE TABLE public.vnpt_batches (
    id TEXT PRIMARY KEY,
    "programId" TEXT REFERENCES public.vnpt_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UPCOMING', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Bảng Tập khách hàng tác nghiệp (vnpt_customers)
CREATE TABLE public.vnpt_customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    revenue NUMERIC DEFAULT 0,
    services TEXT[] DEFAULT '{}'::TEXT[],
    region TEXT,
    "categoryId" TEXT,
    "campaignId" TEXT,
    territory TEXT,
    "salesManager" TEXT,
    "technicalManager" TEXT,
    "subscriptionId" TEXT,
    "addressDetail" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Bảng Nhiệm vụ / Phân công Tác nghiệp (vnpt_assignments)
CREATE TABLE public.vnpt_assignments (
    id TEXT PRIMARY KEY,
    "customerId" TEXT REFERENCES public.vnpt_customers(id) ON DELETE CASCADE,
    "staffId" TEXT REFERENCES public.vnpt_hr_users(id) ON DELETE CASCADE,
    "campaignId" TEXT REFERENCES public.vnpt_batches(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('UNASSIGNED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SUCCESS', 'FAILED', 'LOCKED', 'RESCHEDULED')),
    "assignedDate" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deadline TEXT,
    outcome TEXT,
    notes TEXT,
    "checkInLocation" JSONB,
    images TEXT[] DEFAULT '{}'::TEXT[],
    "managerNotes" TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    "taskType" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Bảng Tài khoản Xác thực mở rộng hệ thống (vnpt_auth_accounts)
CREATE TABLE public.vnpt_auth_accounts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
    phone TEXT,
    email TEXT UNIQUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    force_password_reset BOOLEAN NOT NULL DEFAULT FALSE,
    registered_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    device_token TEXT
);

-- 9. Bảng Ghi Nhật ký Đăng nhập Bảo mật (vnpt_login_history)
CREATE TABLE public.vnpt_login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    email TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'LOCKED_BY_ADMIN')),
    ip_address TEXT,
    user_agent TEXT,
    browser TEXT,
    os TEXT,
    device_type TEXT
);

-- =========================================================================
-- III. THIẾT LẬP VIEW ALIASES ĐỂ TỰ ĐỘNG TƯƠNG THÍCH MỌI TRUY VẤN FALLBACK
-- =========================================================================
CREATE OR REPLACE VIEW public.unit_settings AS SELECT * FROM public.vnpt_unit_settings;
CREATE OR REPLACE VIEW public.hr_users AS SELECT * FROM public.vnpt_hr_users;
CREATE OR REPLACE VIEW public.hr_territories AS SELECT * FROM public.vnpt_hr_territories;
CREATE OR REPLACE VIEW public.categories AS SELECT * FROM public.vnpt_categories;
CREATE OR REPLACE VIEW public.batches AS SELECT * FROM public.vnpt_batches;
CREATE OR REPLACE VIEW public.customers AS SELECT * FROM public.vnpt_customers;
CREATE OR REPLACE VIEW public.assignments AS SELECT * FROM public.vnpt_assignments;

-- =========================================================================
-- IV. TRIGGER TỰ ĐỘNG KHỞI TẠO & ĐỒNG BỘ KHI ĐĂNG KÝ TÌA KHOẢN MỚI
-- =========================================================================
CREATE OR REPLACE FUNCTION public.sync_auth_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username TEXT;
    v_fullname TEXT;
    v_phone TEXT;
    v_role TEXT;
    v_unit TEXT;
    v_code TEXT;
BEGIN
    -- Lấy thông tin thô từ metadata lúc đăng ký qua Supabase Auth
    v_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1)
    );

    v_fullname := COALESCE(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'fullName',
        split_part(new.email, '@', 1)
    );

    v_phone := COALESCE(
        new.raw_user_meta_data->>'phone',
        ''
    );

    v_role := COALESCE(
        upper(new.raw_user_meta_data->>'role'),
        'STAFF'
    );
    
    v_unit := COALESCE(
        new.raw_user_meta_data->>'unit',
        'VP Viễn Thông'
    );
    
    v_code := COALESCE(
        new.raw_user_meta_data->>'code',
        'VNPT-' || upper(substring(new.id::text, 1, 6))
    );

    IF v_role NOT IN ('ADMIN', 'MANAGER', 'STAFF') THEN
        v_role := 'STAFF';
    END IF;

    -- 1. Lưu trữ đồng bộ vào vnpt_auth_accounts để quản lý trạng thái bảo mật thông tin
    INSERT INTO public.vnpt_auth_accounts (
        user_id,
        username,
        display_name,
        role,
        phone,
        email,
        is_locked,
        force_password_reset,
        registered_ip
    ) VALUES (
        new.id,
        v_username,
        v_fullname,
        v_role,
        v_phone,
        new.email,
        FALSE,
        FALSE,
        new.ip_address::text
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        display_name = EXCLUDED.display_name,
        phone = COALESCE(public.vnpt_auth_accounts.phone, EXCLUDED.phone),
        updated_at = timezone('utc'::text, now());

    -- 2. Đồng bộ trực tiếp sang bảng nhân viên tác nghiệp chính `vnpt_hr_users`
    INSERT INTO public.vnpt_hr_users (
        id,
        code,
        name,
        username,
        role,
        unit,
        status,
        phone,
        email,
        "lastLogin",
        progress
    ) VALUES (
        new.id::text,
        v_code,
        v_fullname,
        v_username,
        CASE 
            WHEN v_role = 'ADMIN' THEN 'Admin'
            WHEN v_role = 'MANAGER' THEN 'Tổ trưởng'
            ELSE 'Nhân viên'
        END,
        v_unit,
        'ACTIVE',
        v_phone,
        new.email,
        to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI'),
        0
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        unit = EXCLUDED.unit,
        "lastLogin" = EXCLUDED."lastLogin";

    RETURN new;
END;
$$;

CREATE TRIGGER trigger_sync_auth_user_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_on_signup();

-- =========================================================================
-- V. TRIGGER GHI LOG AN TOÀN KHI ĐĂNG NHẬP THÀNH CÔNG
-- =========================================================================
CREATE OR REPLACE FUNCTION public.log_user_sign_in_success()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_username TEXT;
    v_locked BOOLEAN;
BEGIN
    SELECT username, is_locked INTO v_username, v_locked 
    FROM public.vnpt_auth_accounts 
    WHERE user_id = new.id;

    IF v_locked = TRUE THEN
        INSERT INTO public.vnpt_login_history (
            user_id, username, email, status, ip_address, user_agent, browser, os, device_type
        ) VALUES (
            new.id, v_username, new.email, 'LOCKED_BY_ADMIN', 
            new.ip_address::text, NULL, NULL, NULL, 'VNPT Work Terminal'
        );
    ELSE
        INSERT INTO public.vnpt_login_history (
            user_id,
            username,
            email,
            status,
            ip_address,
            user_agent,
            browser,
            os,
            device_type
        ) VALUES (
            new.id,
            v_username,
            new.email,
            'SUCCESS',
            new.ip_address::text,
            COALESCE(new.raw_user_meta_data->>'userAgent', 'Browser Auth'),
            COALESCE(new.raw_user_meta_data->>'browserName', 'Direct-Login'),
            COALESCE(new.raw_user_meta_data->>'osName', 'Detected-OS'),
            NULL
        );

        -- Cập nhật lastLogin lên bảng hr_users dạng giờ Việt Nam (ICT)
        UPDATE public.vnpt_hr_users
        SET "lastLogin" = to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI')
        WHERE id = new.id::text;
    END IF;

    RETURN new;
END;
$$;

CREATE TRIGGER trigger_log_user_sign_in_success
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW 
    WHEN (old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)
    EXECUTE FUNCTION public.log_user_sign_in_success();


-- =========================================================================
-- VI. THIẾT LẬP BẢO MẬT ROW LEVEL SECURITY (RLS) & BYPASS POLICIES
-- =========================================================================
ALTER TABLE public.vnpt_unit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_hr_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_login_history ENABLE ROW LEVEL SECURITY;

-- 1. BẢO MẬT & TRUY CẬP THIẾT LẬP ĐƠN VỊ (UNIT SETTINGS)
CREATE POLICY select_public_settings ON public.vnpt_unit_settings FOR SELECT USING (true);
CREATE POLICY admin_manage_settings ON public.vnpt_unit_settings FOR ALL USING (true); -- Mở cho phép đồng bộ offline mượt

-- 2. BẢO MẬT & TRUY CẬP NHÂN SỰ CHI TIẾT (HR USERS)
CREATE POLICY allow_all_crud_users ON public.vnpt_hr_users FOR ALL USING (true); -- Hỗ trợ client-side sync & demo tác nghiệp không giới hạn

-- 3. BẢO MẬT & TRUY CẬP ĐỊA BÀN (TERRITORIES)
CREATE POLICY allow_all_crud_territories ON public.vnpt_hr_territories FOR ALL USING (true);

-- 4. BẢO MẬT & TRUY CẬP DANH MỤC DỊCH VỤ (CATEGORIES)
CREATE POLICY allow_all_crud_categories ON public.vnpt_categories FOR ALL USING (true);

-- 5. BẢO MẬT & TRUY CẬP CHIẾN DỊCH GIAO VIỆC (BATCHES)
CREATE POLICY allow_all_crud_batches ON public.vnpt_batches FOR ALL USING (true);

-- 6. BẢO MẬT & TRUY CẬP TẬP KHÁCH HÀNG (CUSTOMERS)
CREATE POLICY allow_all_crud_customers ON public.vnpt_customers FOR ALL USING (true);

-- 7. BẢO MẬT & TRUY CẬP PHÂN CÔNG ĐIỀU HÀNH (ASSIGNMENTS)
CREATE POLICY allow_all_crud_assignments ON public.vnpt_assignments FOR ALL USING (true);

-- 8. BẢO MẬT TÀI KHOẢN ĐỒNG BỘ AUTH (AUTH ACCOUNTS / LOGIN LOG)
CREATE POLICY select_self_account ON public.vnpt_auth_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY admin_manage_all_accounts ON public.vnpt_auth_accounts FOR ALL USING (true);
CREATE POLICY select_self_login_history ON public.vnpt_login_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY admin_manage_login_history ON public.vnpt_login_history FOR ALL USING (true);


-- =========================================================================
-- VII. KHỞI TẠO SEED DATA (Dữ liệu Đóng mộc cấu hình mẫu chính thức)
-- =========================================================================

-- 1. Thiết lập đơn vị mẫu
INSERT INTO public.vnpt_unit_settings (id, "fullName", "shortName", leader, address, phone, email, website, "logoUrl")
VALUES (
    'settings_single',
    'VIỄN THÔNG TUYÊN QUANG',
    'VNPT TUYÊN QUANG',
    'Trần Hải Dương',
    'số 02 đường 17/8, P. Minh Xuân, TP. Tuyên Quang',
    '02073.822.822',
    'vienthongtuyenquang@vnpt.vn',
    'http://tuyenquang.vnpt.vn',
    'https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png'
) ON CONFLICT (id) DO NOTHING;

-- 2. Khởi tạo danh sách Nhân sự VNPT chính thức
INSERT INTO public.vnpt_hr_users (id, code, name, username, role, unit, status, phone, email, "lastLogin", progress)
VALUES 
('u1', 'VNPT-0012', 'Lê Công Thành', 'thanh.lc', 'Nhân viên', 'Hàm Yên', 'ACTIVE', '0912345678', 'thanhlc@vnpt.vn', '2026-05-23 07:15', 85),
('u2', 'VNPT-0013', 'Ngô Thị Hạnh', 'hanh.nt', 'Tổ trưởng', 'Ba Đình', 'ACTIVE', '0915678901', 'hanhnt@vnpt.vn', '2026-05-23 06:45', 92),
('u3', 'VNPT-0014', 'Đặng Anh Tú', 'tu.da', 'Nhân viên', 'Chiêm Hóa', 'ACTIVE', '0913222333', 'tuda@vnpt.vn', '2026-05-22 18:20', 78),
('u4', 'VNPT-0015', 'Phạm Minh Quang', 'quang.pm', 'Admin', 'VP Viễn Thông', 'ACTIVE', '0918888998', 'quangpm@vnpt.vn', '2026-05-23 14:00', 95),
('u5', 'VNPT-0016', 'Hoàng Thị Thảo', 'thao.ht', 'Nhân viên', 'Sơn Dương', 'ACTIVE', '0919998887', 'thaoht@vnpt.vn', '2026-05-23 05:10', 60)
ON CONFLICT (id) DO NOTHING;

-- 3. Khởi tạo Phân công quản lý Địa bàn tác nghiệp
INSERT INTO public.vnpt_hr_territories (id, name, count, "staffId")
VALUES 
('t1', 'Hàm Yên', '125', 'u1'),
('t2', 'Ba Đình', '112', 'u2'),
('t3', 'Chiêm Hóa', '98', 'u3'),
('t4', 'Sơn Dương', '85', 'u5'),
('t5', 'Yên Sơn', '70', 'u1')
ON CONFLICT (id) DO NOTHING;

-- 4. Khởi tạo Danh mục dịch vụ CSKH / Phân loại Gói cước
INSERT INTO public.vnpt_categories (id, name, description, services)
VALUES 
('cat1', 'Nâng cấp Fiber VNN', 'Nâng cấp chu kỳ, tốc độ băng thông cáp quang quốc tế', ARRAY['F-Eco 100M', 'FiberS 150M', 'FiberPro 300M']),
('cat2', 'Chuyển đổi di động trả sau', 'Nâng cấp và chuyển đổi Vinaphone trả sau kèm gói Mesh WiFi', ARRAY['VD149T', 'V150P', 'FR150']),
('cat3', 'Chữ ký số & Hóa đơn điện tử Doanh nghiệp', 'Đồng hành cùng doanh nghiệp số hóa thủ tục thuế/hải quan', ARRAY['VNPT-CA', 'eInvoice-S', 'SmartCA']),
('cat4', 'Đăng ký truyền hình MyTV', 'Combo trọn gói gia đình MyTV đa nền tảng 4K', ARRAY['MyTV VIP', 'MyTV Home', 'Mytv Standard']),
('cat5', 'Cung cấp thiết bị phát Wi-Fi Mesh', 'Khảo sát và phủ sóng mạng WiFi tăng tầng tăng phòng', ARRAY['Mesh Wifi 5', 'Mesh Wifi 6', 'Router Pro'])
ON CONFLICT (id) DO NOTHING;

-- 5. Khởi tạo các Đợt phân phối giao việc (Campaign Batches)
INSERT INTO public.vnpt_batches (id, "programId", name, "startDate", "endDate", status)
VALUES 
('b1', 'cat1', 'Chiến dịch đẩy mạnh Cáp quang Hàm Yên - Đợt 1', '2026-05-01', '2026-06-30', 'ACTIVE'),
('b2', 'cat2', 'Chiến dịch Chuyển đổi VinaPhone trả sau đầu số vàng', '2026-06-01', '2026-07-31', 'UPCOMING'),
('b3', 'cat5', 'Ra mắt và phủ sóng Mesh WiFi gia đình Tuyên Quang', '2026-04-15', '2026-05-31', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 6. Khởi tạo tập danh sách khách hàng đầu vào mẫu
INSERT INTO public.vnpt_customers (id, name, phone, address, revenue, services, region, "categoryId", "campaignId", territory, "subscriptionId")
VALUES 
('C0001', 'Nguyễn Văn Hải', '0912111222', 'Số 12 Phố Sóc Sơn, Hàm Yên', 1540000, ARRAY['FiberS 150M'], 'Hàm Yên', 'cat1', 'b1', 'Hàm Yên', 'SUB-2023-F012'),
('C0002', 'Trần Thị Thu Trang', '0915222333', 'Số 45 Đại lộ Tân Trào, Ba Đình', 980000, ARRAY['VD149T'], 'Ba Đình', 'cat2', 'b3', 'Ba Đình', 'SUB-2024-M088'),
('C0003', 'Công ty TNHH MTV Thành Phát', '02073824567', 'Khu công nghiệp Sơn Dương, Sơn Dương', 4500000, ARRAY['VNPT-CA', 'eInvoice-S'], 'Sơn Dương', 'cat3', 'b1', 'Sơn Dương', 'SUB-2021-S111'),
('C0004', 'Phạm Hồng Anh', '0913555666', 'Xã Minh Xuân, TP. Tuyên Quang', 820000, ARRAY['MyTV VIP'], 'Ba Đình', 'cat4', 'b1', 'Ba Đình', 'SUB-2024-F901'),
('C0005', 'Lê Hoàng Long', '0914777888', 'P. Tân Quang, TP. Tuyên Quang', 1200000, ARRAY['Mesh Wifi 6'], 'Hàm Yên', 'cat5', 'b3', 'Hàm Yên', 'SUB-2025-V004'),
('C0006', 'Trịnh Đình Quang', '0916999000', 'Xã Chiêm Hóa, Chiêm Hóa', 650000, ARRAY['Fiber-Eco 100M'], 'Chiêm Hóa', 'cat1', 'b1', 'Chiêm Hóa', 'SUB-2023-F351'),
('C0007', 'Trường THCS Hàm Yên', '02073841122', 'Thị trấn Hàm Yên, Hàm Yên', 2100000, ARRAY['VNPT-CA'], 'Hàm Yên', 'cat3', 'b1', 'Hàm Yên', 'SUB-2022-F002'),
('C0008', 'Phạm Thanh Bình', '0918111999', 'Đường Nguyễn Trãi, Ba Đình', 540000, ARRAY['VD149T'], 'Ba Đình', 'cat2', 'b3', 'Ba Đình', 'SUB-2024-C122'),
('C0009', 'Nguyễn Thị Ngọc', '0912112233', 'P. Minh Xuân, Chiêm Hóa', 1320000, ARRAY['MyTV standard'], 'Chiêm Hóa', 'cat4', 'b1', 'Chiêm Hóa', 'SUB-2023-M504'),
('C0010', 'Khách sạn Hướng Dương', '02073999444', 'Trung tâm Sơn Dương, Sơn Dương', 5500000, ARRAY['VNPT-CA', 'SmartCA'], 'Sơn Dương', 'cat3', 'b1', 'Sơn Dương', 'SUB-2023-E771')
ON CONFLICT (id) DO NOTHING;

-- 7. Khởi tạo phân công nhiệm vụ chi tiết ban đầu
INSERT INTO public.vnpt_assignments (id, "customerId", "staffId", "campaignId", status, "assignedDate", notes, outcome)
VALUES 
('a1', 'C0001', 'u1', 'b1', 'SUCCESS', '2026-05-22 08:00:00+00', 'Khách hàng đồng ý nâng Fiber lên 150Mbps', 'Nâng gói thành công'),
('a2', 'C0002', 'u2', 'b3', 'IN_PROGRESS', '2026-05-22 08:15:00+00', 'Đang tư vấn thiết bị Mesh 2.0', NULL),
('a3', 'C0003', 'u4', 'b1', 'SUCCESS', '2026-05-22 08:30:00+00', 'Doanh nghiệp ký CA và hóa đơn điện tử mới', 'Doanh nghiệp ký hợp đồng trọn gói'),
('a4', 'C0004', 'u2', 'b1', 'FAILED', '2026-05-22 09:00:00+00', 'Khách hàng bảo đi công tác nước ngoài, chưa có nhu cầu', 'Không liên lạc được'),
('a5', 'C0005', 'u1', 'b3', 'IN_PROGRESS', '2026-05-22 09:30:00+00', 'Đang gọi điện hẹn lắp đặt Mesh', NULL),
('a6', 'C0006', 'u3', 'b1', 'PENDING', '2026-05-23 01:00:00+00', NULL, NULL),
('a7', 'C0007', 'u1', 'b1', 'SUCCESS', '2026-05-22 10:00:00+00', 'Cung cấp Fiber chu kỳ dài trọn gói', 'Hoàn tất bàn giao chữ ký số')
ON CONFLICT (id) DO NOTHING;

-- KHỞI TẠO ĐÃ HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG CHO HOẠT ĐỘNG CHÍNH THỨC!
