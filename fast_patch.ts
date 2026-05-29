import * as fs from 'fs';
const text = fs.readFileSync('src/components/layout/VNPTLayout.tsx', 'utf8');
const newText = text.replace(
  `const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'] },
    { id: 'users', label: 'Quản lý nhân sự', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'assignments', label: 'Phân giao', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
    { id: 'archive', label: 'Lưu trữ & Lịch sử', icon: Clock, roles: ['ADMIN', 'MANAGER'] },
    { id: 'tasks', label: 'Nhiệm vụ', icon: MapPin, roles: ['STAFF', 'COLLABORATOR', 'ADMIN'] },
    { id: 'customers', label: 'Tập khách hàng', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { id: 'potential', label: 'Theo dõi tiềm năng', icon: TrendingUp, roles: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'] },
    { id: 'settings', label: 'Cài đặt đơn vị', icon: Settings, roles: ['ADMIN'] },
  ];`,
  `const currentPermissions = getRoutePermissions();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: currentPermissions.dashboard },
    { id: 'users', label: 'Quản lý nhân sự', icon: Users, roles: currentPermissions.users },
    { id: 'assignments', label: 'Phân giao', icon: ClipboardList, roles: currentPermissions.assignments },
    { id: 'archive', label: 'Lưu trữ & Lịch sử', icon: Clock, roles: currentPermissions.archive },
    { id: 'tasks', label: 'Nhiệm vụ', icon: MapPin, roles: currentPermissions.tasks },
    { id: 'customers', label: 'Tập khách hàng', icon: Users, roles: currentPermissions.customers },
    { id: 'potential', label: 'Theo dõi tiềm năng', icon: TrendingUp, roles: currentPermissions.potential },
    { id: 'settings', label: 'Cài đặt đơn vị', icon: Settings, roles: currentPermissions.settings },
  ];`
);
fs.writeFileSync('src/components/layout/VNPTLayout.tsx', `import { getRoutePermissions } from "@/src/services/permissionService";\n` + newText);
