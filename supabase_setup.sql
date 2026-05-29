-- ==========================================
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU VNPT TRÊN SUPABASE
-- Sử dụng: Copy toàn bộ script này và dán vào phần SQL Editor của Supabase, sau đó nhấn RUN.
-- ==========================================

-- 1. XÓA BẢNG NẾU ĐÃ TỒN TẠI (Để chạy lại sạch nếu cần)
DROP TABLE IF EXISTS public.vnpt_assignments CASCADE;
DROP TABLE IF EXISTS public.vnpt_customers CASCADE;
DROP TABLE IF EXISTS public.vnpt_batches CASCADE;
DROP TABLE IF EXISTS public.vnpt_categories CASCADE;
DROP TABLE IF EXISTS public.vnpt_hr_territories CASCADE;
DROP TABLE IF EXISTS public.vnpt_hr_users CASCADE;
DROP TABLE IF EXISTS public.vnpt_unit_settings CASCADE;

-- ==========================================
-- 2. TẠO CÁC BẢNG HỆ THỐNG
-- ==========================================

-- Bảng Cấu hình đơn vị (Unit Settings)
CREATE TABLE public.vnpt_unit_settings (
    id TEXT PRIMARY KEY DEFAULT 'settings_single',
    "fullName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    leader TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    "logoUrl" TEXT,
    CONSTRAINT check_single_row CHECK (id = 'settings_single')
);

-- Bảng Danh mục Người dùng (Users / Nhân sự)
CREATE TABLE public.vnpt_hr_users (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'LEAVE', 'LOCKED')),
    phone TEXT NOT NULL,
    email TEXT,
    "lastLogin" TEXT,
    progress INTEGER DEFAULT 0
);

-- Bảng Địa bàn phụ trách (Territories)
CREATE TABLE public.vnpt_hr_territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    count TEXT NOT NULL,
    "staffId" TEXT REFERENCES public.vnpt_hr_users(id) ON DELETE SET NULL
);

-- Bảng Danh mục Gói cước / Chương trình (Categories)
CREATE TABLE public.vnpt_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    services TEXT[]
);

-- Bảng Đợt triển khai (Batches)
CREATE TABLE public.vnpt_batches (
    id TEXT PRIMARY KEY,
    "programId" TEXT,
    name TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'UPCOMING', 'COMPLETED'))
);

-- Bảng Danh sách Khách hàng (Customers)
CREATE TABLE public.vnpt_customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    revenue NUMERIC,
    services TEXT[],
    region TEXT,
    "categoryId" TEXT REFERENCES public.vnpt_categories(id) ON DELETE SET NULL,
    "campaignId" TEXT REFERENCES public.vnpt_batches(id) ON DELETE SET NULL,
    territory TEXT,
    "salesManager" TEXT,
    "technicalManager" TEXT,
    "subscriptionId" TEXT,
    "addressDetail" TEXT
);

-- Bảng Giao nhiệm vụ / CSKH (Assignments)
CREATE TABLE public.vnpt_assignments (
    id TEXT PRIMARY KEY,
    "customerId" TEXT REFERENCES public.vnpt_customers(id) ON DELETE CASCADE,
    "staffId" TEXT REFERENCES public.vnpt_hr_users(id) ON DELETE SET NULL,
    "campaignId" TEXT REFERENCES public.vnpt_batches(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('UNASSIGNED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SUCCESS', 'FAILED', 'LOCKED', 'RESCHEDULED')),
    "assignedDate" TEXT NOT NULL,
    deadline TEXT,
    outcome TEXT,
    notes TEXT,
    "checkInLocation" JSONB,
    images TEXT[],
    "managerNotes" TEXT,
    priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    "taskType" TEXT
);

-- ==========================================
-- 3. CHÈN DỮ LIỆU BAN ĐẦU SẴN SÀNG (SEEDING DATA)
-- ==========================================

-- Chèn cài đặt cấu hình đơn vị VNPT Tuyên Quang
INSERT INTO public.vnpt_unit_settings (id, "fullName", "shortName", leader, address, phone, email, website, "logoUrl")
VALUES (
    'settings_single',
    'VIỄN THÔNG TUYÊN QUANG',
    'VNPT TUYÊN QUANG',
    'Trần Hải Dương',
    'số 02 đường 17/8, P. Minh Xuân, TP. Tuyên Quang',
    '02073.822.822',
    'vienthongtuyenquang@vnpt.vn',
    'http://tuyenquang.vnpt.vn',
    'https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png'
) ON CONFLICT (id) DO NOTHING;

-- Chèn dữ liệu nhân sự (Bao gồm Admin: admin / admin123)
INSERT INTO public.vnpt_hr_users (id, code, name, username, role, unit, status, phone, email, "lastLogin", progress)
VALUES 
('u1', 'VNPT-0012', 'Lê Công Thành', 'thanh.lc', 'Nhân viên', 'Hàm Yên', 'ACTIVE', '0912345678', 'thanhlc@vnpt.vn', '2026-05-23 07:15', 85),
('u2', 'VNPT-0013', 'Ngô Thị Hạnh', 'hanh.nt', 'Tổ trưởng', 'Ba Đình', 'ACTIVE', '0915678901', 'hanhnt@vnpt.vn', '2026-05-23 06:45', 92),
('u3', 'VNPT-0014', 'Đặng Anh Tú', 'tu.da', 'Nhân viên', 'Chiêm Hóa', 'ACTIVE', '0913222333', 'tuda@vnpt.vn', '2026-05-22 18:20', 78),
('u4', 'VNPT-0015', 'Phạm Minh Quang', 'admin', 'Admin', 'VP Viễn Thông', 'ACTIVE', '0918888998', 'admin@vnpt.vn', 'Phút trước', 95),
('u5', 'VNPT-0016', 'Hoàng Thị Thảo', 'thao.ht', 'Nhân viên', 'Sơn Dương', 'ACTIVE', '0919998887', 'thaoht@vnpt.vn', '2026-05-23 05:10', 60)
ON CONFLICT (username) DO NOTHING;

-- Chèn địa bàn phụ trách
INSERT INTO public.vnpt_hr_territories (id, name, count, "staffId")
VALUES 
('t1', 'Hàm Yên', '125', 'u1'),
('t2', 'Ba Đình', '112', 'u2'),
('t3', 'Chiêm Hóa', '98', 'u3'),
('t4', 'Sơn Dương', '85', 'u5'),
('t5', 'Yên Sơn', '70', 'u1')
ON CONFLICT (id) DO NOTHING;

-- Chèn danh mục gói cước / chương trình
INSERT INTO public.vnpt_categories (id, name, description, services)
VALUES 
('cat1', 'Fiber & MyTV', 'Chương trình thúc đẩy số hóa hộ gia đình mạng VNPT', ARRAY['Fiber60', 'Fiber100', 'MyTV Silver', 'MyTV Gold']),
('cat2', 'Chuyển đổi Mesh', 'Nâng cấp trải nghiệm phủ sóng Wifi tốc độ cao cho hộ kinh doanh và gia đình rộng', ARRAY['Home Mesh 1', 'Home Mesh 2', 'Home Safe']),
('cat3', 'Chữ ký số & HĐĐT', 'Hỗ trợ doanh nghiệp SME và hộ kinh doanh ký số tiện lợi, tuân thủ pháp luật thuế', ARRAY['VNPT-CA', 'VNPT Invoice', 'Chữ ký số SmartCA']),
('cat4', 'Dịch vụ số cá nhân', 'Nâng cấp chữ ký điện tử, ví thanh toán số và chăm sóc cá nhân di động', ARRAY['SmartCA Cá Nhân', 'VNPT Money', 'Mobile Money']),
('cat5', 'Gói cước VinaPhone', 'Gói cước di động ưu đãi tích hợp dữ liệu data khủng và gọi thoại miễn phí', ARRAY['VD149', 'YOLO100', 'TG249'])
ON CONFLICT (id) DO NOTHING;

-- Chèn các đợt triển khai tích hợp
INSERT INTO public.vnpt_batches (id, "programId", name, "startDate", "endDate", status)
VALUES 
('b1', 'prog1', 'Đợt Chiến dịch Số hóa Hàm Yên - Quý 2/2026', '2026-04-01', '2026-06-30', 'ACTIVE'),
('b2', 'prog1', 'Đợt Phủ sóng Wifi Băng thông rộng Sơn Dương', '2026-05-15', '2026-07-15', 'ACTIVE'),
('b3', 'prog2', 'Chiến dịch Chuyển đổi Mesh - Ba Đình 2026', '2026-05-01', '2026-06-15', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Chèn danh sách khách hàng mẫu
INSERT INTO public.vnpt_customers (id, name, phone, address, revenue, services, region, "categoryId", "campaignId", territory, "subscriptionId")
VALUES 
('C0001', 'Nguyễn Văn Hải', '0912111222', 'Số 12 Phố Sóc Sơn, Hàm Yên', 1540000, ARRAY['Fiber60', 'MyTV Silver'], 'Chiêm Hóa', 'cat1', 'b1', 'Hàm Yên', 'SUB-2023-F012'),
('C0002', 'Trần Thị Thu Trang', '0915222333', 'Số 45 Đại lộ Tân Trào, Ba Đình', 980000, ARRAY['Home Mesh 1'], 'Ba Đình', 'cat2', 'b3', 'Ba Đình', 'SUB-2024-M088'),
('C0003', 'Công ty TNHH MTV Thành Phát', '02073824567', 'Khu công nghiệp Sơn Dương, Sơn Dương', 4500000, ARRAY['VNPT-CA', 'VNPT Invoice'], 'Sơn Dương', 'cat3', 'b1', 'Sơn Dương', 'SUB-2021-S111'),
('C0004', 'Phạm Hồng Anh', '0913555666', 'Xã Minh Xuân, TP. Tuyên Quang', 820000, ARRAY['SmartCA Cá Nhân'], 'Ba Đình', 'cat4', 'b1', 'Ba Đình', 'SUB-2024-F901'),
('C0005', 'Lê Hoàng Long', '0914777888', 'P. Tân Quang, TP. Tuyên Quang', 1200000, ARRAY['YOLO100'], 'Hàm Yên', 'cat5', 'b3', 'Hàm Yên', 'SUB-2025-V004'),
('C0006', 'Trịnh Đình Quang', '0916999000', 'Xã Chiêm Hóa, Chiêm Hóa', 650000, ARRAY['Fiber100'], 'Chiêm Hóa', 'cat1', 'b1', 'Chiêm Hóa', 'SUB-2023-F351'),
('C0007', 'Trường THCS Hàm Yên', '02073841122', 'Thị trấn Hàm Yên, Hàm Yên', 2100000, ARRAY['VNPT-CA'], 'Hàm Yên', 'cat3', 'b1', 'Hàm Yên', 'SUB-2022-F002'),
('C0008', 'Phạm Thanh Bình', '0918111999', 'Đường Nguyễn Trãi, Ba Đình', 540000, ARRAY['Home Mesh 1'], 'Ba Đình', 'cat2', 'b3', 'Ba Đình', 'SUB-2024-C122'),
('C0009', 'Nguyễn Thị Ngọc', '0912112233', 'P. Minh Xuân, Chiêm Hóa', 1320000, ARRAY['SmartCA Cá Nhân'], 'Chiêm Hóa', 'cat4', 'b1', 'Chiêm Hóa', 'SUB-2023-M504'),
('C0010', 'Khách sạn Hướng Dương', '02073999444', 'Trung tâm Sơn Dương, Sơn Dương', 5500000, ARRAY['VNPT Invoice'], 'Sơn Dương', 'cat3', 'b1', 'Sơn Dương', 'SUB-2023-E771')
ON CONFLICT (id) DO NOTHING;

-- Chèn giao việc / kết quả CSKH
INSERT INTO public.vnpt_assignments (id, "customerId", "staffId", "campaignId", status, "assignedDate", notes, outcome)
VALUES 
('a1', 'C0001', 'u1', 'b1', 'SUCCESS', '2026-05-22T08:00:00Z', 'Khách hàng đồng ý nâng Fiber lên 150Mbps', 'Nâng gói thành công'),
('a2', 'C0002', 'u2', 'b3', 'IN_PROGRESS', '2026-05-22T08:15:00Z', 'Đang tư vấn thiết bị Mesh 2.0', NULL),
('a3', 'C0003', 'u4', 'b1', 'SUCCESS', '2026-05-22T08:30:00Z', 'Doanh nghiệp ký CA và hóa đơn điện tử mới', 'Đã ký hợp đồng'),
('a4', 'C0004', 'u2', 'b1', 'FAILED', '2026-05-22T09:00:00Z', 'Khách hàng bảo đi công tác nước ngoài, chưa có nhu cầu', 'Không liên lạc được'),
('a5', 'C0005', 'u1', 'b3', 'IN_PROGRESS', '2026-05-22T09:30:00Z', 'Đang gọi điện hẹn lắp đặt Mesh', NULL),
('a6', 'C0006', 'u3', 'b1', 'PENDING', '2026-05-23T01:00:00Z', NULL, NULL),
('a7', 'C0007', 'u1', 'b1', 'SUCCESS', '2026-05-22T10:00:00Z', 'Cung cấp Fiber chu kỳ dài trọn gói', 'Đã nâng cấp')
ON CONFLICT (id) DO NOTHING;
