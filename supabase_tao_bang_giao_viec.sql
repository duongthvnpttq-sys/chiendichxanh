-- Script tạo bảng vnpt_assignments (Lưu thông tin giao nhiệm vụ cho nhân viên)
-- Bạn hãy copy toàn bộ script này và chạy trong phần SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS public.vnpt_assignments (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
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

-- Tắt RLS (Row Level Security) để cho phép thêm/sửa/xóa trực tiếp từ App mà không bị lỗi phân quyền
ALTER TABLE public.vnpt_assignments DISABLE ROW LEVEL SECURITY;

-- Tạo các index để tăng tốc độ truy vấn khi tải danh sách nhiệm vụ của một nhân viên hay chiến dịch
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_campaignId ON public.vnpt_assignments("campaignId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_customerId ON public.vnpt_assignments("customerId");

-- Làm mới bộ nhớ cache của Supabase (Schema Cache) để nhận diện bảng này ngay lập tức
NOTIFY pgrst, 'reload schema';
