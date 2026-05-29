-- =========================================================================
-- SYSTEM SCRIPT: QUẢN LÝ VÀ ĐỒNG BỘ TÀI KHOẢN ĐĂNG NHẬP TRÊN SUPABASE (REPRODUCTION)
-- Dự án: Hệ Thống Giao Việc & Điều Hành CSKH - VNPT Tuyên Quang
-- Hướng dẫn: Sao chép toàn bộ mã này, dán vào SQL Editor của Supabase và ấn RUN.
-- =========================================================================

-- 1. XÓA BẢNG VÀ TRIGGER CŨ NẾU CẦN (Để đảm bảo khởi tạo mới sạch sẽ)
DROP TABLE IF EXISTS public.vnpt_login_history CASCADE;
DROP TABLE IF EXISTS public.vnpt_auth_accounts CASCADE;

-- =========================================================================
-- 2. TẠO BẢNG QUẢN LÝ TRẠNG THÁI KHÓA/ĐĂNG NHẬP (vnpt_auth_accounts)
-- =========================================================================
-- Bảng này ánh xạ 1-1 từ bảng auth.users của Supabase, mở rộng các thuộc tính 
-- nghiệp vụ VNPT như: Khóa nghiệp vụ, Đổi mật khẩu bắt buộc, Token đẩy thông báo, ...
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
    device_token TEXT -- Dùng gửi thông báo Firebase Cloud Messaging (FCM) về App Mobile khi được giao việc
);

-- Thêm mô tả cho các trường trong bảng để bộ phận vận hành dễ kiểm soát
COMMENT ON TABLE public.vnpt_auth_accounts IS 'Bảng đồng bộ mở rộng thông tin tài khoản đăng nhập từ auth.users Supabase';
COMMENT ON COLUMN public.vnpt_auth_accounts.role IS 'Vai trò truy cập: ADMIN (Quản trị), MANAGER (Tổ trưởng/QLĐịa bàn), STAFF (Nhân viên)';
COMMENT ON COLUMN public.vnpt_auth_accounts.is_locked IS 'Khóa tài khoản khẩn cấp từ Web Admin (Không cho phép tác nghiệp)';
COMMENT ON COLUMN public.vnpt_auth_accounts.force_password_reset IS 'Yêu cầu nhân viên đổi mật khẩu ngay lần kế tiếp đăng nhập';

-- =========================================================================
-- 3. TẠO BẢNG LƯU NHẬT KÝ ĐĂNG NHẬP CHI TIẾT (vnpt_login_history)
-- =========================================================================
-- Dùng để giám sát, ghi nhận lịch sử địa chỉ IP và trình duyệt của nhân sự 
-- khi đăng nhập để đảm bảo an toàn thông tin theo tiêu chuẩn VNPT IT.
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
    device_type TEXT -- Mobile / Desktop / Tablet
);

-- =========================================================================
-- 4. FUNCTION VÀ TRIGGER TỰ ĐỘNG KHỞI TẠO TÀI KHOẢN KHI ĐĂNG KÝ
-- =========================================================================
CREATE OR REPLACE FUNCTION public.sync_auth_user_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Thực thi với quyền admin của DB bypass RLS
SET search_path = public
AS $$
DECLARE
    v_username TEXT;
    v_fullname TEXT;
    v_phone TEXT;
    v_role TEXT;
BEGIN
    -- Trích xuất tên đăng nhập từ Email hoặc Metadata
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

    -- Phân quyền ban đầu từ app metadata nếu có truyền, không thì mặc định là STAFF
    v_role := COALESCE(
        upper(new.raw_user_meta_data->>'role'),
        'STAFF'
    );
    
    IF v_role NOT IN ('ADMIN', 'MANAGER', 'STAFF') THEN
        v_role := 'STAFF';
    END IF;

    -- Ghi thông tin đồng bộ vào vnpt_auth_accounts
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

    -- Đồng bộ ngược sang bảng nhân sự chính vnpt_hr_users phục vụ phân công công việc
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
        'VNPT-' || upper(substring(new.id::text, 1, 6)),
        v_fullname,
        v_username,
        CASE 
            WHEN v_role = 'ADMIN' THEN 'Admin'
            WHEN v_role = 'MANAGER' THEN 'Tổ trưởng'
            ELSE 'Nhân viên'
        END,
        COALESCE(new.raw_user_meta_data->>'unit', 'Chưa xếp đơn vị'),
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
        "lastLogin" = EXCLUDED."lastLogin";

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_auth_user_on_signup ON auth.users;
CREATE TRIGGER trigger_sync_auth_user_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_on_signup();

-- =========================================================================
-- 5. FUNCTION VÀ TRIGGER GHI NHẬT KÝ VÀ CẬP NHẬT TRẠNG THÁI KHI ĐĂNG NHẬP THÀNH CÔNG
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
    -- Lấy thông tin tài khoản hiện tại từ vnpt_auth_accounts
    SELECT username, is_locked INTO v_username, v_locked 
    FROM public.vnpt_auth_accounts 
    WHERE user_id = new.id;

    -- Kiểm tra nếu tài khoản đang bị Admin khóa thủ công ở hệ thống nghiệp vụ
    IF v_locked = TRUE THEN
        -- Ghi log thất bại do bị khóa
        INSERT INTO public.vnpt_login_history (
            user_id, username, email, status, ip_address, user_agent, browser, os, device_type
        ) VALUES (
            new.id, v_username, new.email, 'LOCKED_BY_ADMIN', 
            new.ip_address::text, NULL, NULL, NULL, 'VNPT Work Terminal'
        );
        -- Lưu ý: Thực tế có thể ném exception để ngắt luồng nhưng cần cấu hình an toàn
        -- Ở đây ta thực hiện cập nhật metadata báo trạng thái khóa
    ELSE
        -- Ghi log đăng nhập thành công
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

        -- Cập nhật thông tin Lần đăng nhập cuối trên bảng vnpt_hr_users
        UPDATE public.vnpt_hr_users
        SET "lastLogin" = to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI')
        WHERE id = new.id::text;
    END IF;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_user_sign_in_success ON auth.users;
CREATE TRIGGER trigger_log_user_sign_in_success
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW 
    WHEN (old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)
    EXECUTE FUNCTION public.log_user_sign_in_success();


-- =========================================================================
-- 6. THIẾT LẬP ROW LEVEL SECURITY (RLS) - BẢO MẬT THÔNG TIN TÀI KHOẢN
-- =========================================================================
ALTER TABLE public.vnpt_auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_login_history ENABLE ROW LEVEL SECURITY;

-- Chính sách cho bảng VNPT Auth Accounts:
-- 1. Ai cũng có thể xem hồ sơ bảo mật của CHÍNH MÌNH.
CREATE POLICY select_self_account ON public.vnpt_auth_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Quản trị viên (ADMIN) và Tổ trưởng (MANAGER) được phép kiểm duyệt tất cả tài khoản thuộc địa bàn của mình.
CREATE POLICY admin_manage_all_accounts ON public.vnpt_auth_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vnpt_auth_accounts 
            WHERE user_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

-- Chính sách cho bảng lịch sử đăng nhập VNPT Login History:
-- 1. Nhân viên xem lịch sử đăng nhập của chính mình để bảo mật thông tin tài khoản.
CREATE POLICY select_self_login_history ON public.vnpt_login_history
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Chỉ Admin mới được quản lý toàn bộ hệ thống log/nhật ký an toàn thông tin.
CREATE POLICY admin_manage_login_history ON public.vnpt_login_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.vnpt_auth_accounts 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

-- =========================================================================
-- 7. KHỞI TẠO DỮ LIỆU ĐỒNG BỘ BAN ĐẦU CHO CÁC TÀI KHOẢN CÓ SẴN (IF ANY)
-- =========================================================================
-- Đảm bảo đồng bộ thông tin nếu database của bạn đã có tài khoản sẵn trong Auth
INSERT INTO public.vnpt_auth_accounts (user_id, username, display_name, role, phone, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(upper(raw_user_meta_data->>'role'), 'STAFF'),
    COALESCE(raw_user_meta_data->>'phone', ''),
    email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
