
export interface ProgramCategory {
  id: string;
  name: string;
  description: string;
  services: string[];
}

export interface ImplementationBatch {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
}

export const PROGRAM_CATEGORIES: ProgramCategory[] = [
  { id: 'cat1', name: 'Nâng gói cước', description: 'Tập khách hàng tiềm năng nâng băng thông/gói cước', services: ['Fiber', 'MyTV'] },
  { id: 'cat2', name: 'Bán chéo dịch vụ', description: 'Khách hàng hiện hữu chưa sử dụng đủ bộ dịch vụ', services: ['Mesh', 'Camera', 'VinaPhone'] },
  { id: 'cat3', name: 'B2A / Chăm sóc', description: 'Khách hàng tổ chức, doanh nghiệp cần chăm sóc định kỳ', services: ['SmartCA', 'eInvoice', 'Fiber'] },
  { id: 'cat4', name: 'Rời mạng nguy cơ cao', description: 'Khách hàng có dấu hiệu muốn hủy dịch vụ', services: ['Fiber', 'MyTV'] },
  { id: 'cat5', name: 'Thanh toán số', description: 'Khuyển đổi sang thanh toán không dùng tiền mặt', services: ['VNPT Money'] },
];

export const BATCHES: ImplementationBatch[] = [
  { id: 'b1', programId: 'cat1', name: 'Đợt 1 - Hè 2026', startDate: '2026-06-01', endDate: '2026-06-30', status: 'ACTIVE' },
  { id: 'b2', programId: 'cat1', name: 'Đợt 2 - Thu 2026', startDate: '2026-09-01', endDate: '2026-09-30', status: 'UPCOMING' },
  { id: 'b3', programId: 'cat2', name: 'Chiến dịch Mesh 2.0', startDate: '2026-05-15', endDate: '2026-07-15', status: 'ACTIVE' },
];
