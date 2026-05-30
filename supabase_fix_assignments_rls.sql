-- Cấp quyền truy cập mở rộng cho bảng vnpt_assignments
-- Mục đích: Khắc phục lỗi "new row violates row-level security policy for table vnpt_assignments" khi tạo giao việc.

ALTER TABLE public.vnpt_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_crud_assignments" ON public.vnpt_assignments;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.vnpt_assignments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.vnpt_assignments;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.vnpt_assignments;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.vnpt_assignments;

CREATE POLICY "Allow public select" ON public.vnpt_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.vnpt_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.vnpt_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.vnpt_assignments FOR DELETE USING (true);
