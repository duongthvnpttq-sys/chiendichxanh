-- Script tạo tài khoản Admin mặc định cho ứng dụng
-- Chạy script này trong SQL Editor của Supabase

-- 1. Thêm tài khoản admin vào bảng vnpt_hr_users
-- LƯU Ý: Nếu đã có tài khoản ID 'admin_001' thì lệnh sẽ cập nhật (do xài ON CONFLICT nếu tạo constraint hoặc có thể xoá trước)
DELETE FROM public.vnpt_hr_users WHERE username = 'admin';

INSERT INTO public.vnpt_hr_users (
    "id", 
    "code", 
    "name", 
    "username", 
    "role", 
    "unit", 
    "status", 
    "phone", 
    "email", 
    "lastLogin", 
    "progress"
) VALUES (
    'admin_001',           -- id
    'ADMIN',               -- code
    'Quản trị Hệ thống',     -- name
    'admin',               -- username
    'ADMIN',               -- role
    'Ban Giám Đốc',        -- unit
    'ACTIVE',              -- status
    '0900000000',          -- phone
    'admin@vnpt.vn',       -- email
    'Chưa đăng nhập',      -- lastLogin
    0                      -- progress
);

-- 2. Thêm mật khẩu đã mã hóa (hash SHA-256 của chữ "admin123") vào bảng vnpt_passwords
DELETE FROM public.vnpt_passwords WHERE user_id = 'admin_001';

INSERT INTO public.vnpt_passwords (
    "user_id",
    "password_hash"
) VALUES (
    'admin_001',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' -- Mật khẩu "admin123"
);

-- Thông báo làm mới bộ nhớ cache của Supabase
NOTIFY pgrst, 'reload schema';
