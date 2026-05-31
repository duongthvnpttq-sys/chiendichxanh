-- Cập nhật cấu trúc bảng lưu trữ thông tin Địa bàn quản lý nếu đã tồn tại
CREATE TABLE IF NOT EXISTS public.vnpt_hr_territories (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    count VARCHAR(50)
);

-- Thêm các cột nếu chưa có (để tránh lỗi thiếu cột do bảng đã tồn tại từ trước)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN code VARCHAR(50) UNIQUE;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN "staffId" TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN type VARCHAR(50);
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN parent_id TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN location_lat DECIMAL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN location_lng DECIMAL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN notes TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.vnpt_hr_territories ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Bảng phân giao địa bàn cụ thể theo thời gian (nếu cần)
CREATE TABLE IF NOT EXISTS public.vnpt_hr_territory_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    territory_id TEXT REFERENCES public.vnpt_hr_territories(id) ON DELETE CASCADE NOT NULL,
    staff_id TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'PRIMARY',
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_vnpt_hr_territories_assignee ON public.vnpt_hr_territories("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_hr_territories_parent ON public.vnpt_hr_territories(parent_id);

-- RLS (Row Level Security)
ALTER TABLE public.vnpt_hr_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vnpt_hr_territory_assignments ENABLE ROW LEVEL SECURITY;

-- Policy (ví dụ: cho phép tất cả read/write nếu đang test, bạn có thể chỉnh lại sau)
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.vnpt_hr_territories;
CREATE POLICY "Enable all operations for all users" ON public.vnpt_hr_territories FOR ALL USING (true) WITH CHECK (true);

-- Hàm tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vnpt_hr_territories_modtime ON public.vnpt_hr_territories;
CREATE TRIGGER update_vnpt_hr_territories_modtime 
BEFORE UPDATE ON public.vnpt_hr_territories 
FOR EACH ROW 
EXECUTE FUNCTION update_modified_column();
