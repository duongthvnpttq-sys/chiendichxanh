-- Script tạo bảng giao việc (Assignments) cho hệ thống VNPT HR
-- Bảng này lưu trữ thông tin phân giao khách hàng cho nhân viên

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

-- Bảng dự phòng nếu ứng dụng gọi tên bảng cũ
CREATE TABLE IF NOT EXISTS public.assignments (
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

-- Tạo Index để tối ưu việc truy vấn theo nhân viên và khách hàng
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_staffId ON public.vnpt_assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_vnpt_assignments_customerId ON public.vnpt_assignments("customerId");
CREATE INDEX IF NOT EXISTS idx_assignments_staffId ON public.assignments("staffId");
CREATE INDEX IF NOT EXISTS idx_assignments_customerId ON public.assignments("customerId");

-- Xóa rào cản truy cập nếu RLS đang được bật (Tùy chọn)
-- ALTER TABLE public.vnpt_assignments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
