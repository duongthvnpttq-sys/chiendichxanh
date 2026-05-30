-- Kịch bản xóa toàn bộ dữ liệu giao việc (assignments) để fix lỗi không xóa được
-- Nếu bạn muốn chạy trên SQL Editor của Supabase

-- 1. Tắt RLS tạm thời để không bị vướng quyền
ALTER TABLE IF EXISTS public.vnpt_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;

-- 2. Xóa toàn bộ dữ liệu trong bảng giao việc
TRUNCATE TABLE public.vnpt_assignments CASCADE;

-- (Tùy chọn) Bật lại RLS nếu cần thiết
-- ALTER TABLE public.vnpt_assignments ENABLE ROW LEVEL SECURITY;
