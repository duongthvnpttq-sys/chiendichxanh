-- Script sửa kiểu dữ liệu cột id để tương thích với mã ID (pot_xxx) do ứng dụng tạo ra.
ALTER TABLE public.vnpt_potential_customers DROP DEFAULT;
ALTER TABLE public.vnpt_potential_customers ALTER COLUMN id TYPE TEXT USING id::TEXT;
