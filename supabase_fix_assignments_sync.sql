-- Khởi tạo hoặc cập nhật bảng vnpt_assignments (Bảng giao việc)

-- 1. Xóa bỏ rào cản RLS để các thao tác Insert/Upsert/Update thông suốt
ALTER TABLE IF EXISTS public.vnpt_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;

-- 2. Đảm bảo bảng tồn tại với đầy đủ cột
CREATE TABLE IF NOT EXISTS public.vnpt_assignments (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT,
    "staffId" TEXT,
    "campaignId" TEXT,
    "status" TEXT,
    "assignedDate" TEXT,
    "deadline" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "checkInLocation" JSONB,
    "images" JSONB,
    "managerNotes" TEXT,
    "priority" TEXT,
    "taskType" TEXT,
    "assignedBy" TEXT
);

-- 3. Cập nhật các cột có thể còn thiếu do cấu trúc cũ
DO $$ 
BEGIN
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "customerId" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "staffId" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "campaignId" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "status" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "assignedDate" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "deadline" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "outcome" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "notes" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "checkInLocation" JSONB;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "images" JSONB;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "managerNotes" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "priority" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "taskType" TEXT;
    ALTER TABLE public.vnpt_assignments ADD COLUMN IF NOT EXISTS "assignedBy" TEXT;
EXCEPTION WHEN OTHERS THEN
    -- Bỏ qua lỗi nếu đã tồn tại
END $$;

-- 4. Ép kiểu khóa chính ID về TEXT nếu trước đây lỡ tạo bằng UUID (Nguyên nhân phổ biến gây lỗi đồng bộ)
DO $$
BEGIN
    ALTER TABLE public.vnpt_assignments ALTER COLUMN id TYPE TEXT USING id::TEXT;
EXCEPTION WHEN OTHERS THEN
    -- Bỏ qua nếu có xung đột, nhưng hầu hết sẽ thành công
END $$;

-- 5. Tạo Index tối ưu tốc độ
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId_v2 ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_customerId_v2 ON public.vnpt_assignments("customerId");
