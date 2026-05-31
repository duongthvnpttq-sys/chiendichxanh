-- Bảng lưu trữ thông tin Địa bàn quản lý
CREATE TABLE public.territories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã địa bàn (VD: DB-001)
    name VARCHAR(255) NOT NULL,       -- Tên địa bàn (VD: Phường Nguyễn Du, Tòa nhà A)
    type VARCHAR(50),                 -- Loại địa bàn (VD: Quan, Phuong, Xa, ToaNha, KhuDanCu)
    
    -- Thống kê quy mô
    household_count INTEGER DEFAULT 0, -- Số hộ dân / quy mô (tương đương với trường count trong frontend)
    population_count INTEGER DEFAULT 0, -- Dân số dự kiến
    
    -- Phân công - Phụ trách
    assignee_id UUID,                 -- Liên kết tới bảng staff/user (ID nhân viên kinh doanh phụ trách)
    
    -- Vị trí & Phân cấp
    parent_id UUID REFERENCES public.territories(id) ON DELETE CASCADE, -- Địa bàn cha (VD: Quận -> Phường)
    location_lat DECIMAL,             -- Vĩ độ (nếu quản lý bản đồ)
    location_lng DECIMAL,             -- Kinh độ (nếu quản lý bản đồ)
    
    -- Trạng thái & Metadata
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bảng phân giao địa bàn cụ thể theo thời gian (Nhiều nhân viên có thể phụ trách các thời điểm khác nhau, hoặc chia sẻ địa bàn)
CREATE TABLE public.territory_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID NOT NULL, -- ID Nhân viên
    role VARCHAR(50) DEFAULT 'PRIMARY', -- Vai trò: Nhấn chính (PRIMARY), Hỗ trợ (SUPPORT)
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE, -- Ngày kết thúc phụ trách (nếu có)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index để tối ưu truy vấn
CREATE INDEX idx_territories_assignee ON public.territories(assignee_id);
CREATE INDEX idx_territories_parent ON public.territories(parent_id);
CREATE INDEX idx_territories_status ON public.territories(status);

-- RLS (Row Level Security) cho territories
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_assignments ENABLE ROW LEVEL SECURITY;

-- Hàm tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_territories_modtime 
BEFORE UPDATE ON public.territories 
FOR EACH ROW 
EXECUTE FUNCTION update_modified_column();
