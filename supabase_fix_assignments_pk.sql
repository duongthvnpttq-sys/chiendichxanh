-- Khắc phục lỗi không thể sửa/xóa dữ liệu trong màn hình Supabase Table Editor
-- Lỗi này xảy ra do bảng vnpt_assignments bị mất khóa chính (Primary Key). 
-- Khi không có khóa chính, Supabase không cho phép check chọn để xóa trực tiếp trên giao diện.

DO $$
BEGIN
    -- Kiểm tra và thêm Primary Key cho cột id nếu chưa có
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'vnpt_assignments'
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.vnpt_assignments ADD PRIMARY KEY (id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Nếu cột id có dữ liệu trùng lặp, việc thêm PK sẽ thất bại
    -- Trong trường hợp đó, bạn cần chạy lệnh sau để xóa dữ liệu trùng lặp trước:
    -- TRUNCATE TABLE public.vnpt_assignments CASCADE;
    RAISE NOTICE 'Không thể tự động thêm Primary Key, có thể do cột id bị trùng lặp hoặc đã tồn tại. %', SQLERRM;
END $$;
