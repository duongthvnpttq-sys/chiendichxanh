-- Bảng lưu trữ mã băm (hash) mật khẩu của người dùng chưa có tài khoản trên Supabase Auth
CREATE TABLE IF NOT EXISTS public.vnpt_passwords (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bật tính năng Bảo mật cấp độ hàng (Row Level Security)
ALTER TABLE public.vnpt_passwords ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép tất cả mọi người có thể đọc và ghi mật khẩu (vì hệ thống dùng local hash fallback)
-- Lưu ý: Cơ chế này giả định mã băm SHA-256 an toàn và chỉ là bảng map ID -> hash
CREATE POLICY "Cho phép đọc mật khẩu" ON public.vnpt_passwords FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm/sửa mật khẩu" ON public.vnpt_passwords FOR ALL USING (true) WITH CHECK (true);

-- Hàm tự động cập nhật thời gian (updated_at) mỗi khi có thay đổi
CREATE OR REPLACE FUNCTION update_vnpt_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = EXCLUDED.updated_at;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động chạy hàm cập nhật tgian
DROP TRIGGER IF EXISTS update_vnpt_passwords_timestamp ON public.vnpt_passwords;
CREATE TRIGGER update_vnpt_passwords_timestamp
BEFORE UPDATE ON public.vnpt_passwords
FOR EACH ROW EXECUTE PROCEDURE update_vnpt_passwords_updated_at();
