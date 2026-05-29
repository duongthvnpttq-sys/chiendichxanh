-- Sửa lỗi thông báo chưa đồng bộ được lên Supabase (vi phạm Row Level Security)
-- 1. Bật RLS
ALTER TABLE public.vnpt_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Xóa các policy cũ (nếu có)
DROP POLICY IF EXISTS "Cho phép đọc thông báo" ON public.vnpt_notifications;
DROP POLICY IF EXISTS "Cho phép ghi thông báo" ON public.vnpt_notifications;
DROP POLICY IF EXISTS "Allow all for notifications" ON public.vnpt_notifications;

-- 3. Tạo policy mở (cho phép đọc, ghi, xóa tự do)
CREATE POLICY "Allow all for notifications" 
ON public.vnpt_notifications 
FOR ALL USING (true);
