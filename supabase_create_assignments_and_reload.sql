-- Script tạo bảng giao việc mới và làm mới bộ nhớ cache của Supabase (Schema Cache)
-- Chạy script này trong SQL Editor của Supabase để khắc phục lỗi không tìm thấy bảng.

-- 1. Tạo bảng vnpt_assignments nếu chưa có
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

-- 2. Tắt RLS để tránh lỗi truy cập do phân quyền (bạn có thể bật lại sau nếu cần bảo mật nghiêm ngặt)
ALTER TABLE public.vnpt_assignments DISABLE ROW LEVEL SECURITY;

-- 3. Tạo các index giúp tải nhanh
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId_2 ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_campaignId_2 ON public.vnpt_assignments("campaignId");

-- 4. Báo cho PostgREST (cổng API của Supabase) làm mới lại bộ nhớ đệm (Schema Cache) để nhận diện bảng mới ngay lập tức
NOTIFY pgrst, 'reload schema';
