-- Kịch bản KHẮC PHỤC TRIỆT ĐỂ lỗi không thể xóa dữ liệu trên trang quản trị Supabase.
-- Lỗi "delete from ... where id in ()" xảy ra do bảng vnpt_assignments đang bị mất Khóa chính (Primary Key).

-- 1. Xóa các bản ghi bị lỗi (id là null hoặc rỗng)
DELETE FROM public.vnpt_assignments WHERE id IS NULL OR id = '';

-- 2. Xóa các bản ghi trùng lặp id (chỉ giữ lại 1 bản ghi mới nhất cho mỗi id)
DELETE FROM public.vnpt_assignments a USING (
    SELECT id, ctid, row_number() OVER (PARTITION BY id ORDER BY ctid DESC) as rn
    FROM public.vnpt_assignments
) b
WHERE a.ctid = b.ctid AND b.rn > 1;

-- 3. Xóa Primary Key cũ nếu có (bị sai)
ALTER TABLE IF EXISTS public.vnpt_assignments DROP CONSTRAINT IF EXISTS vnpt_assignments_pkey;
ALTER TABLE IF EXISTS public.assignments DROP CONSTRAINT IF EXISTS assignments_pkey;

-- 4. Bắt buộc tạo lại Primary Key chuẩn cho cột id
ALTER TABLE public.vnpt_assignments ADD PRIMARY KEY (id);

-- Lưu ý: Sau khi chạy thành công câu lệnh này, hãy tải lại (Refresh/F5) 
-- trang web Supabase Table Editor là bạn sẽ xóa được dữ liệu bình thường.
