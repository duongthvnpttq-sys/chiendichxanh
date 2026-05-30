-- Script cấp quyền truy cập mở rộng cho bảng vnpt_potential_customers
-- Hỗ trợ tất cả người dùng (kể cả admin/nhân viên đăng nhập offline không qua Supabase Auth)

DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.vnpt_potential_customers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.vnpt_potential_customers;

CREATE POLICY "Allow public select" ON public.vnpt_potential_customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.vnpt_potential_customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.vnpt_potential_customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.vnpt_potential_customers FOR DELETE USING (true);
