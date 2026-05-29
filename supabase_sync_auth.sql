-- =========================================================================
-- SCRIPT ĐỒNG BỘ TÀI KHOẢN SUPABASE AUTH VỚI BẢNG NHÂN SỰ (vnpt_hr_users)
-- =========================================================================
-- Hướng dẫn: Copy toàn bộ script này chạy trong SQL Editor của Supabase.
-- Script này giúp tự động tạo tài khoản nhân sự trong public.vnpt_hr_users 
-- khi có người đăng ký tài khoản qua Supabase Auth (Email/Mật khẩu),
-- đồng thời liên kết tài khoản Auth mới với hồ sơ nhân sự có sẵn (qua Email).
-- =========================================================================

-- 1. BẬT TIỆN ÍCH MỞ RỘNG (Nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ĐẢM BẢO CẤU TRÚC BẢNG TRÙNG KHỚP CÁC PHƯỜNG THỨC XÁC THỰC
-- UUID từ auth.users sẽ được đồng bộ trực tiếp vào trường public.vnpt_hr_users.id (nếu đăng ký mới)
-- Hoặc cập nhật ID của hồ sơ sẵn có bằng UUID mới để liên kết phân quyền.

-- 3. TẠO FUNCTION ĐỒNG BỘ KHI CÓ USER SIGN-UP
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền tối cao (bypass RLS để ghi vào public)
SET search_path = public
AS $$
DECLARE
    existing_user_id TEXT;
    user_email TEXT;
    user_fullname TEXT;
    user_phone TEXT;
    user_username TEXT;
    cleaned_code TEXT;
BEGIN
    user_email := new.email;
    
    -- Lấy thông tin bổ sung từ metadata đăng ký (nếu có truyền từ ví dụ signUp({options: {data: ...}}))
    user_fullname := COALESCE(
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'fullName',
        split_part(user_email, '@', 1) -- default lấy phần trước @
    );
    
    user_phone := COALESCE(
        new.raw_user_meta_data->>'phone',
        '0910000000' -- Giá trị mặc định nếu ko truyền điện thoại
    );
    
    user_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(user_email, '@', 1)
    );

    cleaned_code := COALESCE(
        new.raw_user_meta_data->>'code',
        'VNPT-' || upper(substring(new.id::text, 1, 6)) -- tạo mã VNPT tự động ngẫu nhiên
    );

    -- TRƯỜNG HỢP 1: Đã tồn tại hồ sơ trong hệ thống vnpt_hr_users có cùng Email
    SELECT id INTO existing_user_id 
    FROM public.vnpt_hr_users 
    WHERE lower(email) = lower(user_email)
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        -- Cập nhật ID của hồ sơ nhân sự có sẵn thành ID của auth.users
        -- (Cần cập nhật cả các bảng liên quan đang có khóa ngoại tham chiếu id này như vnpt_hr_territories, vnpt_assignments)
        
        -- Bypass khóa ngoại tạm thời hoặc cập nhật theo trình tự:
        -- Vì các khóa ngoại ON DELETE SET NULL hoặc CASCADE, ta cập nhật trực tiếp bảng vnpt_hr_users:
        -- Để tránh lỗi ràng buộc, ta insert/update logic thông minh
        
        -- Nếu ID sẵn có khác ID mới (UUID), ta cập nhật lại id của hồ sơ cũ về UUID mới
        IF existing_user_id <> new.id::text THEN
            -- Tạo bản ghi tạm, chuyển đổi các tham chiếu khóa ngoại trước
            UPDATE public.vnpt_hr_territories SET "staffId" = new.id::text WHERE "staffId" = existing_user_id;
            UPDATE public.vnpt_assignments SET "staffId" = new.id::text WHERE "staffId" = existing_user_id;
            
            -- Sửa ID trong bảng nhân sự chính
            UPDATE public.vnpt_hr_users 
            SET id = new.id::text,
                "lastLogin" = to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI'),
                status = 'ACTIVE'
            WHERE id = existing_user_id;
        END IF;

    -- TRƯỜNG HỢP 2: Là người dùng hoàn toàn mới (Đăng ký trực tiếp tự do)
    ELSE
        -- Khởi tạo hồ sơ nhân sự tự động liên kết với tài khoản Auth
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
            new.id::text,            -- ID khớp 100% với UUID của Supabase Auth
            cleaned_code,            -- Mã nhân viên
            user_fullname,           -- Họ và tên
            user_username,           -- Tên đăng nhập (username)
            'Nhân viên',             -- Vai trò mặc định cho tài khoản tự đăng ký
            'Tự do / Chưa gán',      -- Đơn vị mặc định
            'ACTIVE',                -- Trạng thái hoạt động
            user_phone,              -- Số điện thoại
            user_email,              -- Email từ Supabase Auth
            to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI'), -- Lần đăng nhập cuối
            0                        -- Tiến độ gán việc
        )
        ON CONFLICT (username) DO UPDATE 
        SET id = EXCLUDED.id,
            email = EXCLUDED.email,
            "lastLogin" = EXCLUDED."lastLogin";
    END IF;

    RETURN new;
END;
$$;

-- 4. TẠO TRIGGER TỰ ĐỘNG CHẠY FUNCTION KHI THÊM USER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =========================================================================
-- 5. FUNCTION & TRIGGER CẬP NHẬT TRẠNG THÁI LAST LOGIN KHI ĐĂNG NHẬP THÀNH CÔNG
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_auth_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.vnpt_hr_users
    SET "lastLogin" = to_char(now() AT TIME ZONE 'ICT', 'YYYY-MM-DD HH24:MI')
    WHERE id = new.id::text;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Supabase cập nhật cột last_sign_in_at khi đăng nhập, ta bắt sự kiện UPDATE
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW 
  WHEN (old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)
  EXECUTE FUNCTION public.handle_auth_user_login();

-- =========================================================================
-- THÔNG TIN DIỄN GIẢI QUY TRÌNH ĐỒNG BỘ:
-- 1. Khi Gọi Supabase Auth Sign Up:
--    supabase.auth.signUp({
--       email: 'nhanvien@vnpt.vn',
--       password: 'matkhaubaomat',
--       options: {
--          data: {
--             name: 'Nguyễn Văn A',
--             phone: '0912345678',
--             username: 'anv.tq',
--             code: 'VNPT-9999'
--          }
--       }
--    })
-- 2. Trigger `on_auth_user_created` trên bảng `auth.users` sẽ tự động chạy.
-- 3. Hồ sơ nhân sự có email 'nhanvien@vnpt.vn' sẽ được cập nhật ID thành 
--    UUID định danh hoặc tạo mới hoàn toàn mà không cần code frontend can thiệp thêm.
-- =========================================================================
