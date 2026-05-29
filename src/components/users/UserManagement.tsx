import React from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Map as MapIcon, 
  MapPin,
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Lock,
  Smartphone,
  ChevronRight,
  Database,
  Building,
  Activity,
  Bell,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { userService, UserDetail, Territory } from "@/src/services/userService";
import { notificationService } from "@/src/services/notificationService";
import { toast } from "sonner";
import InteractiveMap from './InteractiveMap';

const ROLES = [
  { id: 'admin', name: 'Admin cấp Cao nhất', permissions: ['ALL'] },
  { id: 'manager', name: 'Giám đốc quản trị điều hành', permissions: ['VIEW', 'ASSIGN', 'REPORT', 'UPDATE'] },
  { id: 'staff', name: 'Nhân viên kinh doanh', permissions: ['VIEW', 'UPDATE'] },
  { id: 'collaborator', name: 'Cộng tác viên liên kết', permissions: ['UPDATE', 'ADD'] },
];

export default function UserManagement() {
  const [activeTab, setActiveTab ] = React.useState('territory');
  const [selectedRole, setSelectedRole] = React.useState('admin');
  const [isLogEnabled, setIsLogEnabled] = React.useState(() => localStorage.getItem('vnpt_log_enabled') !== 'false');

  const [auditLogs, setAuditLogs] = React.useState<{ time: string; user: string; action: string; target: string; device: string; status: 'SUCCESS' | 'FAILED' }[]>(() => {
    const saved = localStorage.getItem('vnpt_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      { time: '10:15:32', user: 'Lê Công Thành (NVKD)', action: 'Cập nhật kết quả', target: 'KH: Nguyễn Văn A', device: 'iPhone 15 Pro / 192.168.1.1', status: 'SUCCESS' },
      { time: '09:45:10', user: 'Ngô Thị Hạnh (Team Lead)', action: 'Giao tập khách hàng', target: 'B2A - 2026 (500 KH)', device: 'Web / 112.45.1.25', status: 'SUCCESS' },
      { time: '09:30:00', user: 'Hệ thống AI', action: 'Tự động mở khóa', target: '45 Khách hàng quá hạn', device: 'Cloud Worker', status: 'SUCCESS' },
      { time: '08:15:22', user: 'Phạm Minh Quang (Admin)', action: 'Import Excel', target: 'Danh sách 120 Nhân sự', device: 'Web / 172.16.0.1', status: 'SUCCESS' },
      { time: '08:05:45', user: 'Unknown', action: 'Login Attempt', target: 'phuoc.ht (Locked Account)', device: 'Android / 23.45.2.1', status: 'FAILED' },
    ];
  });

  const addAuditLog = (action: string, target: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS', forcedEnabled?: boolean) => {
    const loggingEnabled = typeof forcedEnabled === 'boolean' ? forcedEnabled : isLogEnabled;
    if (!loggingEnabled) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newLog = {
      time: timeStr,
      user: 'Phạm Minh Quang (Admin)',
      action,
      target,
      device: 'Web / 192.168.23.44',
      status
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem('vnpt_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };
  const [searchTerm, setSearchTerm] = React.useState('');
  const [users, setUsers] = React.useState<UserDetail[]>([]);
  const [territories, setTerritories] = React.useState<Territory[]>([]);
  const [unitName, setUnitName] = React.useState(userService.getUnitName());

  const filteredUsers = React.useMemo(() => {
    const query = searchTerm.toLowerCase();
    if (!query) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.code.toLowerCase().includes(query) ||
      (u.username && u.username.toLowerCase().includes(query))
    );
  }, [users, searchTerm]);
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserDetail | null>(null);
  const [editedUserForm, setEditedUserForm] = React.useState<Partial<UserDetail>>({});
  const [isAddTerritoryOpen, setIsAddTerritoryOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<UserDetail | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [territoryToDelete, setTerritoryToDelete] = React.useState<Territory | null>(null);
  const [isDeleteTerritoryDialogOpen, setIsDeleteTerritoryDialogOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserDetail | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isAddRoleOpen, setIsAddRoleOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState({ name: '', description: '' });
  
  const [isReminderOpen, setIsReminderOpen] = React.useState(false);
  const [reminderMessage, setReminderMessage] = React.useState('');
  
  const [notifyLoginConfig, setNotifyLoginConfig] = React.useState(() => {
    const saved = localStorage.getItem('vnpt_notify_login_config');
    if (saved) return JSON.parse(saved);
    return {
      loginNewDevice: true,
      loginFailed: true,
      inactiveWarning: true,
      inactiveDays: 3,
      dailyReport: false,
      managerAlerts: true
    };
  });

  const handleSaveAuthConfig = () => {
    localStorage.setItem('vnpt_notify_login_config', JSON.stringify(notifyLoginConfig));
    toast.success("Đã cập nhật cấu hình thông báo tài khoản!");
    addAuditLog('Cập nhật cấu hình thông báo', 'Cấu hình đăng nhập & không đăng nhập');
  };
  
  // New User Form State
  const [newUser, setNewUser] = React.useState({
    code: '',
    name: '',
    username: '',
    phone: '',
    email: '',
    unit: 'PBH Hàm Yên',
    role: 'staff',
    status: 'ACTIVE' as const
  });

  // New Territory Form State
  const [newTerritory, setNewTerritory] = React.useState({
    name: '',
    count: ''
  });

  const [activeTerritoryId, setActiveTerritoryId] = React.useState<string | undefined>(undefined);

  const [matrix, setMatrix] = React.useState(() => {
    const saved = localStorage.getItem('vnpt_permission_matrix');
    return saved ? JSON.parse(saved) : [
      { name: 'Quản trị nhân sự', keys: ['admin', 'manager'] },
      { name: 'Cấu hình chương trình', keys: ['admin'] },
      { name: 'Giao khách hàng (Assign)', keys: ['admin', 'manager'] },
      { name: 'Xuất báo cáo Excel', keys: ['admin', 'manager'] },
      { name: 'Cập nhật kết quả CSKH', keys: ['admin', 'manager', 'staff', 'collaborator'] },
      { name: 'Upload hình ảnh/GPS', keys: ['admin', 'manager', 'staff', 'collaborator'] },
      { name: 'Xem khách hàng của tổ', keys: ['admin', 'manager'] },
      { name: 'Phê duyệt kết quả', keys: ['admin', 'manager'] },
    ];
  });

  const togglePermission = (rowIdx: number, roleKey: string) => {
    const newMatrix = [...matrix];
    const keys = newMatrix[rowIdx].keys;
    if (keys.includes(roleKey)) {
      newMatrix[rowIdx].keys = keys.filter(k => k !== roleKey);
    } else {
      newMatrix[rowIdx].keys = [...keys, roleKey];
    }
    setMatrix(newMatrix);
    localStorage.setItem('vnpt_permission_matrix', JSON.stringify(newMatrix));
    toast.info(`Đã cập nhật: ${newMatrix[rowIdx].name}`);
  };

  React.useEffect(() => {
    const loadData = () => {
      setUsers(userService.getUsers());
      setTerritories(userService.getTerritories());
      setUnitName(userService.getUnitName());
    };
    loadData();
    const unsubscribe = userService.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.code || !newUser.username) {
        toast.error("Vui lòng nhập đủ Mã NV, Họ tên và Tài khoản");
        return;
    }
    const res = await userService.addUser({
        code: newUser.code,
        name: newUser.name,
        username: newUser.username,
        phone: newUser.phone,
        email: newUser.email,
        unit: newUser.unit,
        role: newUser.role,
        status: newUser.status
    });

    if (!res.success) {
        toast.error("Lỗi tạo user trên Supabase cục bộ: " + (res.error?.message || JSON.stringify(res.error)));
        return;
    }

    addAuditLog('Tạo người dùng mới', `Nhân sự: ${newUser.name} (@${newUser.username})`);
    toast.success("Đã thêm nhân sự mới thành công");
    setIsAddUserOpen(false);
    setNewUser({
        code: '',
        name: '',
        username: '',
        phone: '',
        email: '',
        unit: 'PBH Hàm Yên',
        role: 'staff',
        status: 'ACTIVE'
    });
  };

  const openEditUserDialog = (user: UserDetail) => {
    setEditingUser(user);
    setEditedUserForm({
        code: user.code,
        name: user.name,
        username: user.username,
        phone: user.phone,
        email: user.email,
        unit: user.unit,
        role: user.role,
        status: user.status
    });
    setIsEditUserOpen(true);
  };

  const confirmEditUser = async () => {
    if (!editingUser || !editedUserForm.name || !editedUserForm.code || !editedUserForm.username) {
        toast.error("Vui lòng nhập đủ Mã NV, Họ tên và Tài khoản");
        return;
    }
    const res = await userService.updateUser(editingUser.id, editedUserForm);
    if (!res.success) {
        toast.error("Lỗi cập nhật user trên Supabase: " + (res.error?.message || JSON.stringify(res.error)));
        return;
    }
    addAuditLog('Cập nhật người dùng', `Nhân sự: ${editedUserForm.name} (@${editedUserForm.username})`);
    toast.success("Đã cập nhật thông tin nhân sự thành công");
    setIsEditUserOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (user: UserDetail) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      userService.deleteUser(userToDelete.id);
      addAuditLog('Xóa nhân sự', `Nhân sự: ${userToDelete.name} (@${userToDelete.username})`);
      toast.success(`Đã xóa nhân sự ${userToDelete.name} khỏi hệ thống`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSendReminder = () => {
    if (!selectedUser || !reminderMessage.trim()) return;
    
    notificationService.addNotification({
      userId: selectedUser.id,
      title: 'Thông báo nhắc việc',
      message: `${reminderMessage}`,
      type: 'INFO',
      actionUrl: 'tasks'
    });
    
    addAuditLog('Gửi nhắc việc', `Nhân sự: ${selectedUser.name}`);
    toast.success(`Đã gửi thông báo nhắc việc cho ${selectedUser.name}`);
    
    setIsReminderOpen(false);
    setSelectedUser(null);
    setReminderMessage('');
  };

  const handleAssignStaff = (territoryId: string, staffId: string) => {
     userService.assignTerritory(territoryId, staffId);
     addAuditLog('Giao địa bàn', `Cập nhật phụ trách địa bàn ID: ${territoryId}`);
     
     const staffMember = users.find(u => u.id === staffId);
     const territory = territories.find(t => t.id === territoryId);
     if (staffMember && territory) {
        notificationService.addNotification({
          userId: staffId,
          title: 'Phân công địa bàn mới',
          message: `Bạn được phân công phụ trách ô địa bàn ${territory.name}.`,
          type: 'INFO',
          actionUrl: 'customers'
        });
     }
     
     toast.success("Đã cập nhật nhân sự phụ trách địa bàn");
  };

  const handleAddTerritory = () => {
    if (!newTerritory.name) {
        toast.error("Vui lòng nhập tên địa bàn");
        return;
    }
    userService.addTerritory(newTerritory.name, newTerritory.count || '0');
    addAuditLog('Thêm địa bàn mới', `Địa bàn: ${newTerritory.name}`);
    toast.success("Đã thêm địa bàn mới");
    setIsAddTerritoryOpen(false);
    setNewTerritory({ name: '', count: '' });
  };

  const handleDeleteTerritory = (id: string, name: string) => {
    const territoryObj = territories.find(t => t.id === id);
    if (territoryObj) {
      setTerritoryToDelete(territoryObj);
      setIsDeleteTerritoryDialogOpen(true);
    }
  };

  const confirmDeleteTerritory = () => {
    if (territoryToDelete) {
      userService.deleteTerritory(territoryToDelete.id);
      addAuditLog('Xóa địa bàn', `Địa bàn: ${territoryToDelete.name}`);
      toast.success(`Đã xóa địa bàn ${territoryToDelete.name}`);
      setIsDeleteTerritoryDialogOpen(false);
      setTerritoryToDelete(null);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    userService.updateUser(id, { status: newStatus as any });
    addAuditLog(newStatus === 'ACTIVE' ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản', `Nhân sự ID: ${id}`);
    toast.success(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'tạm khóa'} tài khoản`);
  };

  const handleResetPassword = (user: UserDetail) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsChangePasswordOpen(true);
  };

  const [isChangingPwd, setIsChangingPwd] = React.useState(false);

  const confirmChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (selectedUser) {
      setIsChangingPwd(true);
      try {
        await userService.changePassword(selectedUser.id, newPassword);
        toast.success(`Đã đổi mật khẩu thành công cho ${selectedUser.name}`);
        setIsChangePasswordOpen(false);
      } catch (err) {
        toast.error("Có lỗi xảy ra khi đổi mật khẩu");
      } finally {
        setIsChangingPwd(false);
      }
    }
  };

  const handleAddRole = () => {
    if (!newRole.name) {
      toast.error("Vui lòng nhập tên nhóm quyền");
      return;
    }
    toast.success(`Đã tạo nhóm quyền: ${newRole.name}`);
    setIsAddRoleOpen(false);
    setNewRole({ name: '', description: '' });
  };

  const handleDownloadTemplate = async () => {
    // @ts-ignore
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet([
      { 
        "MA_NV": "VNPT001",
        "HO_TEN": "Nguyễn Văn A",
        "TAI_KHOAN": "anv.tq",
        "SO_DT": "0912345678",
        "EMAIL": "anv.tq@vnpt.vn",
        "DON_VI": "PBH Hàm Yên",
        "VAI_TRO": "Nhân viên KD"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Import");
    XLSX.writeFile(wb, "VNPT_Mau_Import_Nhan_Su.xlsx");
    toast.success("Đã tải file mẫu nhân sự!");
  };

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            // @ts-ignore
            const XLSX = await import('xlsx');
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              toast.error("File Excel không có dữ liệu!");
              return;
            }

            const formattedUsers = jsonData.map(item => ({
              code: String(item.MA_NV || item.code || ''),
              name: String(item.HO_TEN || item.name || ''),
              username: String(item.TAI_KHOAN || item.username || ''),
              phone: String(item.SO_DT || item.phone || ''),
              email: String(item.EMAIL || item.email || ''),
              unit: String(item.DON_VI || item.unit || unitName),
              role: String(item.VAI_TRO || item.role || 'Nhân viên KD'),
              status: 'ACTIVE' as const
            }));

            let added = 0;
            for (const u of formattedUsers) {
              if (u.code && u.name) {
                userService.addUser(u);
                added++;
              }
            }
            toast.success(`Đã import thành công ${added} nhân sự!`);
          } catch (error) {
            console.error("Import error:", error);
            toast.error("Lỗi khi xử lý file Excel nhân sự");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleDownloadTerritoryTemplate = async () => {
    // @ts-ignore
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet([
      { 
        "TEN_DIA_BAN": "Phường Minh Xuân",
        "SO_KHACH_HANG": "1500"
      },
      { 
        "TEN_DIA_BAN": "Xã Hùng Đức",
        "SO_KHACH_HANG": "1200"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Dia_Ban");
    XLSX.writeFile(wb, "VNPT_Mau_Import_Dia_Ban.xlsx");
    addAuditLog('Tải file mẫu địa bàn', 'File: VNPT_Mau_Import_Dia_Ban.xlsx');
    toast.success("Đã tải file mẫu địa bàn!");
  };

  const handleImportTerritoryExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            // @ts-ignore
            const XLSX = await import('xlsx');
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              toast.error("File Excel không có dữ liệu!");
              return;
            }

            let added = 0;
            for (const item of jsonData) {
              const name = String(item.TEN_DIA_BAN || item.name || '');
              if (name) {
                const count = String(item.SO_KHACH_HANG || item.count || '0');
                userService.addTerritory(name, count);
                added++;
              }
            }
            addAuditLog('Import Excel địa bàn', `Đã thêm ${added} địa bàn mới từ file Excel`);
            toast.success(`Đã import thành công ${added} địa bàn mới!`);
          } catch (error) {
            console.error("Import error:", error);
            toast.error("Lỗi khi xử lý file Excel địa bàn");
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
      {/* Header & Stats Overview */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-[#005BAA]" />
            QUẢN TRỊ NHÂN SỰ & PHÂN QUYỀN
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Cơ cấu {unitName} | {users.length} Nhân sự</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger 
              render={
                <Button className="bg-[#005BAA] hover:bg-blue-700 rounded-xl font-bold gap-2 shadow-lg shadow-blue-100">
                  <UserPlus className="w-4 h-4" />
                  Thêm nhân sự
                </Button>
              } 
            />
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
              <div className="bg-[#005BAA] p-6 text-white shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Khai báo nhân sự mới</DialogTitle>
                <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Hệ thống HRM & Điều hành VNPT</p>
              </div>
              <div className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar flex-1 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mã nhân viên</label>
                    <Input 
                        placeholder="VNPT..." 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={newUser.code}
                        onChange={(e) => setNewUser({...newUser, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Họ và tên</label>
                    <Input 
                        placeholder="Nhập họ tên" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số điện thoại</label>
                    <Input 
                        placeholder="091..." 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={newUser.phone}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                    <Input 
                        placeholder="@vnpt.vn" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Đơn vị công tác</label>
                    <Select value={newUser.unit} onValueChange={(v) => setNewUser({...newUser, unit: v})}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 font-bold">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PBH Hàm Yên">PBH Hàm Yên</SelectItem>
                        <SelectItem value="PBH Chiêm Hóa">PBH Chiêm Hóa</SelectItem>
                        <SelectItem value={unitName}>{unitName}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tài khoản đăng nhập</label>
                    <Input 
                        placeholder="ten_dang_nhap.tq" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Chức danh / Vai trò</label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 font-bold">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="staff">NVKD</SelectItem>
                         <SelectItem value="manager">Giám đốc HĐ</SelectItem>
                         <SelectItem value="admin">Admin Cấp cao</SelectItem>
                         <SelectItem value="collaborator">CTV Liên kết</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                   <Button variant="ghost" onClick={() => setIsAddUserOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                   <Button onClick={handleAddUser} className="bg-[#005BAA] hover:bg-blue-700 rounded-xl font-bold uppercase text-[10px] px-8">Lưu HRM</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
              <div className="bg-[#005BAA] p-6 text-white shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Sửa thông tin nhân sự</DialogTitle>
                <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Hệ thống HRM & Điều hành VNPT</p>
              </div>
              <div className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar flex-1 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mã nhân viên</label>
                    <Input 
                        placeholder="VNPT..." 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={editedUserForm.code || ''}
                        onChange={(e) => setEditedUserForm({...editedUserForm, code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Họ và tên</label>
                    <Input 
                        placeholder="Nhập họ tên" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={editedUserForm.name || ''}
                        onChange={(e) => setEditedUserForm({...editedUserForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số điện thoại</label>
                    <Input 
                        placeholder="091..." 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={editedUserForm.phone || ''}
                        onChange={(e) => setEditedUserForm({...editedUserForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                    <Input 
                        placeholder="@vnpt.vn" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={editedUserForm.email || ''}
                        onChange={(e) => setEditedUserForm({...editedUserForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Đơn vị công tác</label>
                    <Select value={editedUserForm.unit || ''} onValueChange={(v) => setEditedUserForm({...editedUserForm, unit: v})}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 font-bold">
                        <SelectValue placeholder="Chọn đơn vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PBH Hàm Yên">PBH Hàm Yên</SelectItem>
                        <SelectItem value="PBH Chiêm Hóa">PBH Chiêm Hóa</SelectItem>
                        <SelectItem value={unitName}>{unitName}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tài khoản đăng nhập</label>
                    <Input 
                        placeholder="ten_dang_nhap.tq" 
                        className="rounded-xl bg-slate-50 border-slate-100 font-bold" 
                        value={editedUserForm.username || ''}
                        onChange={(e) => setEditedUserForm({...editedUserForm, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Chức danh / Vai trò</label>
                    <Select value={editedUserForm.role || ''} onValueChange={(v) => setEditedUserForm({...editedUserForm, role: v})}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100 font-bold">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="staff">NVKD</SelectItem>
                         <SelectItem value="manager">Giám đốc HĐ</SelectItem>
                         <SelectItem value="admin">Admin Cấp cao</SelectItem>
                         <SelectItem value="collaborator">CTV Liên kết</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Sale Results / KPI Section */}
                {editingUser?.role === 'staff' || editingUser?.role === 'collaborator' ? (
                <div className="mt-8">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Kết quả bán hàng (Tháng này)</h4>
                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl">
                         <div className="text-[10px] font-bold text-blue-600/80 uppercase">Doanh thu</div>
                         <div className="text-lg font-black text-[#005BAA] mt-1">24.5M</div>
                      </div>
                      <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl">
                         <div className="text-[10px] font-bold text-emerald-600/80 uppercase">Khách hàng PTM</div>
                         <div className="text-lg font-black text-emerald-700 mt-1">12</div>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl">
                         <div className="text-[10px] font-bold text-amber-600/80 uppercase">Tỷ lệ chốt</div>
                         <div className="text-lg font-black text-amber-700 mt-1">68%</div>
                      </div>
                   </div>
                </div>
                ) : null}

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                   <Button variant="ghost" onClick={() => setIsEditUserOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                   <Button onClick={confirmEditUser} className="bg-[#005BAA] hover:bg-blue-700 rounded-xl font-bold uppercase text-[10px] px-8">Lưu thay đổi</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleDownloadTemplate} className="rounded-xl font-bold border-slate-200">
             Mẫu Import
          </Button>
          <Button variant="outline" onClick={handleImportExcel} className="rounded-xl font-bold border-slate-200 text-[#005BAA]">
             <Database className="w-4 h-4 mr-2" />
             Import Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng nhân sự', val: users.length.toString(), icon: Users, color: 'blue' },
          { label: 'Đang làm việc', val: users.filter(u => u.status === 'ACTIVE').length.toString(), icon: CheckCircle2, color: 'emerald' },
          { label: 'Tạm khóa', val: users.filter(u => u.status === 'LOCKED').length.toString(), icon: Lock, color: 'orange' },
          { label: 'Hiệu suất TB', val: '78%', icon: Activity, color: 'indigo' },
       ].map((stat, i) => (
         <Card key={i} className="border-none shadow-sm bg-white overflow-hidden text-left py-4 px-6 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
              'bg-indigo-50 text-indigo-600'
            )}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-mono leading-none">{stat.val}</p>
            </div>
         </Card>
       ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
             <div className="bg-red-500 p-6 text-white text-center">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Xác nhận xóa nhân sự</DialogTitle>
                <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Hành động này không thể hoàn tác</p>
             </div>
             <div className="p-8 text-center bg-white">
                <p className="text-slate-600 font-medium mb-6">
                  Bạn có chắc chắn muốn xóa nhân sự <span className="font-black text-slate-900">"{userToDelete?.name}"</span> ({userToDelete?.code}) khỏi hệ thống HRM?
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                  <Button onClick={confirmDeleteUser} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]">Xác nhận xóa</Button>
                </div>
             </div>
          </DialogContent>
        </Dialog>

        {/* Territory Delete Confirmation Dialog */}
        <Dialog open={isDeleteTerritoryDialogOpen} onOpenChange={setIsDeleteTerritoryDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-red-500 p-6 text-white text-center">
                 <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                 <DialogTitle className="text-xl font-black uppercase tracking-tight">Xác nhận xóa địa bàn</DialogTitle>
                 <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Hành động này không thể hoàn tác</p>
              </div>
              <div className="p-8 text-center bg-white">
                 <p className="text-slate-600 font-medium mb-6">
                   Bạn có chắc chắn muốn xóa địa bàn <span className="font-black text-slate-900">"{territoryToDelete?.name}"</span> khỏi hệ thống?
                 </p>
                 <div className="flex gap-3">
                   <Button variant="ghost" onClick={() => setIsDeleteTerritoryDialogOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                   <Button onClick={confirmDeleteTerritory} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]">Xác nhận xóa</Button>
                 </div>
              </div>
          </DialogContent>
        </Dialog>

        {/* Reminder Dialog */}
        <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-blue-600 p-6 text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-200 animate-pulse" /> Nhắc việc nhân sự
                </DialogTitle>
                <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Gửi thông báo tới: {selectedUser?.name}</p>
              </div>
              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nội dung thông báo *</label>
                  <textarea 
                    className="w-full min-h-[100px] border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-300 font-medium"
                    placeholder="Nhập nội dung nhắc nhở công việc..."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button onClick={() => setIsReminderOpen(false)} variant="ghost" className="flex-1 font-black text-slate-400 h-12 rounded-2xl uppercase tracking-wider text-[11px]">Hủy</Button>
                  <Button onClick={handleSendReminder} className="flex-1 font-black bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl uppercase tracking-wider shadow-lg shadow-blue-100/50 text-[11px]" disabled={!reminderMessage.trim()}>Gửi thông báo</Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-brand-orange p-6 text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Đổi mật khẩu người dùng</DialogTitle>
                <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Bảo mật tài khoản: {selectedUser?.name}</p>
              </div>
              <div className="p-8 space-y-4 bg-white">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password"
                      placeholder="••••••••" 
                      className="pl-10 rounded-xl bg-slate-50 border-slate-100 font-bold" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password"
                      placeholder="••••••••" 
                      className="pl-10 rounded-xl bg-slate-50 border-slate-100 font-bold" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="ghost" onClick={() => setIsChangePasswordOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                  <Button disabled={isChangingPwd} onClick={confirmChangePassword} className="flex-1 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold uppercase text-[10px]">{isChangingPwd ? "Đang xử lý..." : "Cập nhật mật khẩu"}</Button>
                </div>
              </div>
          </DialogContent>
        </Dialog>

        <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit mb-6 overflow-x-auto max-w-full">
          <TabsTrigger value="list" className="rounded-xl font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#005BAA] data-[state=active]:shadow-sm">Danh sách nhân sự ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#005BAA] data-[state=active]:shadow-sm">Phân quyền & Vai trò</TabsTrigger>
          <TabsTrigger value="territory" className="rounded-xl font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#005BAA] data-[state=active]:shadow-sm">Địa bàn quản lý ({territories.length})</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#005BAA] data-[state=active]:shadow-sm">Cấu hình thông báo</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 m-0 flex-1 flex flex-col min-h-0">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
             <CardHeader className="p-6 bg-slate-50/50 flex flex-row items-center justify-between shrink-0">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Tìm tên, mã NV, số điện thoại..." 
                      className="pl-10 w-[300px] bg-white border-slate-200 rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px] rounded-xl bg-white">
                      <SelectValue placeholder="Đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả đơn vị</SelectItem>
                      <SelectItem value="hy">PBH Hàm Yên</SelectItem>
                      <SelectItem value="ch">PBH Chiêm Hóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="rounded-xl"><Filter className="w-4 h-4 text-slate-400" /></Button>
                   <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                </div>
             </CardHeader>
             <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
<div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-6">
<Table className="min-w-[800px]">
                    <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                      <TableHead className="w-[120px] text-[10px] uppercase font-black px-6 text-slate-400">Mã NV</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400">Họ tên / Vai trò</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400">Đơn vị & Địa bàn phụ trách</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 text-center">Trạng thái</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400">Hoạt động cuối</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 text-right pr-6">KPI</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 text-right pr-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-blue-50/20 transition-colors">
                        <TableCell className="px-6 font-mono font-bold text-xs text-[#005BAA]">{user.code}</TableCell>
                        <TableCell className="py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border-2 border-white shadow-sm overflow-hidden">
                                 {user.name.split(' ').pop()?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-none">{user.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {
                                      user.role === 'staff' ? 'Nhân viên KD' :
                                      user.role === 'manager' ? 'Giám đốc' :
                                      user.role === 'admin' ? 'Admin Cấp cao' :
                                      user.role === 'collaborator' ? 'CTV Liên kết' :
                                      user.role // fallback
                                    }
                                  </p>
                                  <span className="text-[8px] text-slate-300">•</span>
                                  <p className="text-[10px] text-[#005BAA] font-black lowercase">{user.username}</p>
                                </div>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{user.unit}</span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {territories.filter(t => t.staffId === user.id).length > 0 ? (
                                  territories.filter(t => t.staffId === user.id).map(t => (
                                    <span key={t.id} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 whitespace-nowrap">
                                      {t.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] italic font-medium text-slate-400">Chưa gán địa bàn</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                            user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            user.status === 'LEAVE' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                            'bg-red-50 text-red-600 border-red-100'
                          )}>
                            {user.status === 'ACTIVE' ? 'Hoạt động' : user.status === 'LEAVE' ? 'Nghỉ phép' : 'Tạm khóa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
                             <Clock className="w-3 h-3" />
                             {user.lastLogin}
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="w-20 ml-auto">
                              <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1">
                                 <span>Đạt</span>
                                 <span className={cn(user.progress >= 80 ? 'text-emerald-500' : 'text-orange-500')}>{user.progress}%</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                 <div className={cn("h-full", user.progress >= 80 ? 'bg-emerald-500' : 'bg-orange-500')} style={{ width: `${user.progress}%` }} />
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsReminderOpen(true);
                                }}
                                variant="ghost" 
                                size="icon" 
                                title="Nhắc việc"
                                className="w-8 h-8 rounded-lg hover:bg-white hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-100 transition-all"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                onClick={() => openEditUserDialog(user)}
                                variant="ghost" 
                                size="icon" 
                                title="Sửa thông tin"
                                className="w-8 h-8 rounded-lg hover:bg-white hover:text-brand-indigo shadow-sm border border-transparent hover:border-brand-indigo/20 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                onClick={() => handleResetPassword(user)}
                                variant="ghost" 
                                size="icon" 
                                title="Đổi mật khẩu"
                                className="w-8 h-8 rounded-lg hover:bg-white hover:text-orange-600 shadow-sm border border-transparent hover:border-orange-100 transition-all"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                variant="ghost" 
                                size="icon" 
                                title={user.status === 'ACTIVE' ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                className={cn(
                                    "w-8 h-8 rounded-lg hover:bg-white shadow-sm border border-transparent transition-all",
                                    user.status === 'ACTIVE' ? "hover:text-orange-600 hover:border-orange-100" : "hover:text-emerald-600 hover:border-emerald-100"
                                )}
                              >
                                {user.status === 'ACTIVE' ? <Shield className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </Button>
                              <Button 
                                onClick={() => handleDeleteUser(user)}
                                variant="ghost" 
                                size="icon" 
                                title="Xóa nhân sự"
                                className="w-8 h-8 rounded-lg hover:bg-white hover:text-red-600 shadow-sm border border-transparent hover:border-red-100 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
</div>
</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="m-0 flex-1 min-h-0 overflow-y-auto">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-slate-200 shadow-sm overflow-hidden h-fit">
                 <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800">Nhóm quyền (Roles)</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2">
                    {ROLES.map((role) => (
                      <div 
                        key={role.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedRole(role.id);
                          toast.info(`Đang xem cấu hình cho: ${role.name}`);
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-xl transition-all group border-b border-slate-50 last:border-none cursor-pointer",
                          selectedRole === role.id ? "bg-blue-50/80 border-blue-200 shadow-sm ring-1 ring-[#005BAA]/10 text-[#005BAA]" : "hover:bg-slate-50 text-slate-900"
                        )}
                      >
                         <div className="flex justify-between items-center">
                            <h5 className={cn("font-bold group-hover:text-[#005BAA]", selectedRole === role.id ? "text-[#005BAA] font-black" : "")}>{role.name}</h5>
                            <Badge variant="outline" className={cn("text-[9px] font-black", selectedRole === role.id ? "bg-[#005BAA] text-white border-none" : "")}>
                               {role.id === 'admin' ? 'Toàn quyền truy cập' : matrix.filter(m => m.keys.includes(role.id)).length + ' Chức năng'}
                            </Badge>
                         </div>
                         <p className="text-[10px] text-slate-400 font-medium mt-1">
                            Sử dụng cho: {role.id === 'staff' || role.id === 'collaborator' ? 'Cấp địa bàn/tổ' : 'Quản trị hệ thống'}
                            <span className="mx-1">•</span> 
                            Thực thi: {users.filter(u => u.role === role.id).length} nhân sự
                         </p>
                      </div>
                    ))}
                    <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                      <DialogTrigger 
                        render={
                          <Button variant="ghost" className="w-full mt-2 h-10 border-2 border-dashed border-slate-100 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 hover:border-slate-200">
                             Tạo nhóm quyền mới
                          </Button>
                        } 
                      />
                      <DialogContent className="sm:max-w-md rounded-3xl p-6">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-black uppercase tracking-tight">Thêm nhóm quyền mới</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Tên nhóm quyền</label>
                            <Input 
                              placeholder="Ví dụ: Giám sát bán hàng" 
                              className="rounded-xl font-bold"
                              value={newRole.name}
                              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsAddRoleOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Hủy</Button>
                          <Button onClick={handleAddRole} className="bg-brand-indigo rounded-xl font-bold uppercase text-[10px] px-6">Lưu</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                 </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                 <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800">Ma trận phân quyền chi tiết</CardTitle>
                    <Button className="h-8 rounded-lg bg-[#005BAA] font-bold text-[10px] uppercase" onClick={() => {
                       localStorage.setItem('vnpt_permission_matrix', JSON.stringify(matrix));
                       toast.success("Đã cấu hình quyền thành công");
                    }}>Lưu thay đổi</Button>
                 </CardHeader>
                 <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
<div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-6">
<Table className="min-w-[600px]">
                       <TableHeader>
                          <TableRow className="bg-slate-50/30">
                             <TableHead className="text-[10px] uppercase font-black px-6 w-[240px]">Chức năng (Modules)</TableHead>
                             <TableHead className={cn("text-center text-[10px] font-black uppercase text-blue-600 transition-all", selectedRole === 'admin' ? "bg-blue-100/30 ring-1 ring-[#005BAA]/10 font-bold py-3.5" : "")}>Admin Cấp cao</TableHead>
                             <TableHead className={cn("text-center text-[10px] font-black uppercase text-indigo-600 transition-all", selectedRole === 'manager' ? "bg-blue-100/30 ring-1 ring-[#005BAA]/10 font-bold py-3.5" : "")}>Giám đốc HĐ</TableHead>
                             <TableHead className={cn("text-center text-[10px] font-black uppercase text-emerald-600 transition-all", selectedRole === 'staff' ? "bg-blue-100/30 ring-1 ring-[#005BAA]/10 font-bold py-3.5" : "")}>NVKD</TableHead>
                             <TableHead className={cn("text-center text-[10px] font-black uppercase text-slate-400 transition-all", selectedRole === 'collaborator' ? "bg-blue-100/30 ring-1 ring-[#005BAA]/10 font-bold py-3.5" : "")}>CTV Liên kết</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {matrix.map((module, i) => (
                             <TableRow key={i} className="hover:bg-slate-50/50 border-b border-slate-50">
                                <TableCell className="px-6 py-4 font-bold text-slate-700 text-[11px] uppercase tracking-wide">{module.name}</TableCell>
                                <TableCell className={cn("text-center transition-all", selectedRole === 'admin' ? "bg-blue-50/20" : "")}>
                                    <Checkbox 
                                        checked={module.keys.includes('admin')} 
                                        onCheckedChange={() => togglePermission(i, 'admin')}
                                        className="rounded text-[#005BAA] border-slate-300" 
                                    />
                                </TableCell>
                                <TableCell className={cn("text-center transition-all", selectedRole === 'manager' ? "bg-blue-50/20" : "")}>
                                    <Checkbox 
                                        checked={module.keys.includes('manager')} 
                                        onCheckedChange={() => togglePermission(i, 'manager')}
                                        className="rounded text-[#005BAA] border-slate-300" 
                                    />
                                </TableCell>
                                <TableCell className={cn("text-center transition-all", selectedRole === 'staff' ? "bg-blue-50/20" : "")}>
                                    <Checkbox 
                                        checked={module.keys.includes('staff')} 
                                        onCheckedChange={() => togglePermission(i, 'staff')}
                                        className="rounded text-[#005BAA] border-slate-300" 
                                    />
                                </TableCell>
                                <TableCell className={cn("text-center transition-all", selectedRole === 'collaborator' ? "bg-blue-50/20" : "")}>
                                    <Checkbox 
                                        checked={module.keys.includes('collaborator')} 
                                        onCheckedChange={() => togglePermission(i, 'collaborator')}
                                        className="rounded text-[#005BAA] border-slate-300" 
                                    />
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
</div>
</CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="territory" className="m-0 flex-1 flex flex-col min-h-0">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
              <InteractiveMap focusedTerritoryId={activeTerritoryId} onSelectTerritory={setActiveTerritoryId} />

              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white flex flex-col min-h-0">
                 <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                    <div>
                       <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800">Danh sách đơn vị hành chính & Nhân sự phụ trách</CardTitle>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Đang hiển thị {territories.length} Xã / Phường</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          onClick={handleDownloadTerritoryTemplate} 
                          className="h-8 rounded-lg font-bold text-[10px] uppercase border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-sans"
                        >
                           Mẫu Import
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleImportTerritoryExcel} 
                          className="h-8 rounded-lg font-bold text-[10px] uppercase border-[#005BAA]/20 text-[#005BAA] bg-blue-50/40 hover:bg-blue-50 font-sans"
                        >
                           <Database className="w-3.5 h-3.5 mr-1" />
                           Import Excel
                        </Button>
                        <Dialog open={isAddTerritoryOpen} onOpenChange={setIsAddTerritoryOpen}>
                            <DialogTrigger 
                              render={
                                <Button className="h-8 rounded-lg font-bold text-[10px] uppercase bg-[#005BAA] hover:bg-blue-700 text-white border-none font-sans">Khai báo địa bàn</Button>
                              }
                            />
                            <DialogContent className="sm:max-w-md rounded-3xl p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black uppercase tracking-tight">Thêm địa bàn mới</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Tên Xã / Phường / Tổ</label>
                                        <Input 
                                            placeholder="Ví dụ: Xã Hùng Đức" 
                                            className="rounded-xl"
                                            value={newTerritory.name}
                                            onChange={(e) => setNewTerritory({...newTerritory, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Ước lượng tập KH (Nghìn)</label>
                                        <Input 
                                            placeholder="Ví dụ: 1,200" 
                                            className="rounded-xl"
                                            value={newTerritory.count}
                                            onChange={(e) => setNewTerritory({...newTerritory, count: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsAddTerritoryOpen(false)} className="rounded-xl font-bold">Hủy</Button>
                                    <Button onClick={handleAddTerritory} className="bg-[#005BAA] rounded-xl font-bold">Lưu địa bàn</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
<div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-6">
<Table className="min-w-[600px]">
                       <TableHeader>
                          <TableRow className="bg-slate-50/30">
                             <TableHead className="text-[10px] uppercase font-black px-6">Tên Xã / Phường</TableHead>
                             <TableHead className="text-center text-[10px] font-black uppercase">Khách hàng</TableHead>
                             <TableHead className="text-[10px] font-black uppercase">Nhân sự phụ trách</TableHead>
                             <TableHead className="text-right pr-6"></TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                           {territories.map((t, i) => (
                             <TableRow 
                                key={t.id} 
                                className={cn(
                                  "hover:bg-slate-50/50 border-b border-slate-50 cursor-pointer transition-colors duration-150",
                                  activeTerritoryId === t.id ? "bg-amber-50/40 hover:bg-amber-50/60 font-medium" : ""
                                )}
                                onClick={() => setActiveTerritoryId(t.id)}
                             >
                                <TableCell className="px-6 py-4">
                                   <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">{t.name}</div>
                                   <div className="text-[9px] text-slate-400 font-mono mt-0.5">TERR-CODE: 2026-HY-{i.toString().padStart(2, '0')}</div>
                                </TableCell>
                                <TableCell className="text-center font-black text-slate-600 font-mono text-xs">{t.count}</TableCell>
                                <TableCell>
                                   <Select 
                                     value={t.staffId || 'unassigned'} 
                                     onValueChange={(v) => handleAssignStaff(t.id, v === 'unassigned' ? '' : v)}
                                   >
                                      <SelectTrigger className="w-full bg-transparent border-transparent hover:bg-slate-50 focus:ring-0 p-1 h-auto shadow-none justify-start">
                                        {t.staffId ? (() => {
                                           const assignedUser = users.find(u => u.id === t.staffId);
                                           return assignedUser ? (
                                             <div className="flex items-center gap-2">
                                               <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-[#005BAA] border-2 border-white shadow-sm shrink-0">
                                                  {assignedUser.name.split(' ').pop()?.charAt(0)}
                                               </div>
                                               <div className="text-left flex flex-col items-start overflow-hidden">
                                                 <span className="text-[11px] font-black text-slate-800 leading-tight truncate w-full">{assignedUser.name}</span>
                                                 <span className="text-[9px] text-[#005BAA] font-bold leading-none uppercase mt-0.5">{assignedUser.role}</span>
                                               </div>
                                             </div>
                                           ) : <span className="text-red-500 text-[10px] font-bold">Lỗi dữ liệu</span>;
                                        })() : (
                                           <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50/50 text-red-500 hover:bg-red-50 border border-red-50 w-fit">
                                             <Users className="w-3.5 h-3.5" />
                                             <span className="text-[10px] font-bold">Chưa gán NV</span>
                                           </div>
                                        )}
                                      </SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="unassigned" className="text-red-500 font-bold text-[10px]">-- Bỏ gán nhân sự --</SelectItem>
                                         {users.map(u => (
                                           <SelectItem key={u.id} value={u.id}>
                                              <div className="flex flex-col">
                                                <span className="font-bold text-[11px]">{u.name}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">{u.role} - {u.unit}</span>
                                              </div>
                                           </SelectItem>
                                         ))}
                                      </SelectContent>
                                   </Select>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                   <div className="flex justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-8 h-8 text-slate-400 hover:text-red-500"
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           handleDeleteTerritory(t.id, t.name);
                                         }}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn(
                                          "w-8 h-8 rounded-full transition-all duration-150",
                                          activeTerritoryId === t.id 
                                            ? "text-amber-500 bg-amber-50 hover:bg-amber-100" 
                                            : "text-slate-400 hover:text-[#005BAA] hover:bg-blue-50/70"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveTerritoryId(t.id);
                                          toast.success(`Đã định vị địa bàn "${t.name}" trên bản đồ số VNPT`);
                                        }}
                                        title="Định vị trên bản đồ"
                                      >
                                        <MapPin className="w-4 h-4" />
                                      </Button>
                                   </div>
                                </TableCell>
                             </TableRow>
                           ))}
                       </TableBody>
                    </Table>
</div>
</CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="logs_disabled" className="hidden flex-1 flex-col min-h-0">
           <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
              <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
                 <div className="flex flex-col gap-1">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                       <span>Nhật ký hoạt động hệ thống (Audit Trail)</span>
                       <Badge className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border-none",
                          isLogEnabled ? "bg-emerald-50 text-emerald-600 font-bold" : "bg-red-50 text-red-500 font-bold"
                       )}>
                          {isLogEnabled ? "Đang ghi nhận" : "Tạm dừng"}
                       </Badge>
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium font-sans">Lưu trữ và giám định vết lịch sử thao tác người dùng thời gian thực</p>
                 </div>
                 <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/50 select-none">
                       <span className="text-[9px] font-black uppercase text-slate-500 font-sans">Kích hoạt Ghi thao tác:</span>
                       <button 
                          id="toggle-operation-logging"
                          onClick={() => {
                             const nextVal = !isLogEnabled;
                             setIsLogEnabled(nextVal);
                             localStorage.setItem('vnpt_log_enabled', nextVal ? 'true' : 'false');
                             if (nextVal) {
                                toast.success("Hệ thống đã KÍCH HOẠT chức năng ghi nhật ký thao tác người dùng");
                             } else {
                                toast.warning("Hệ thống đã TẠM NGỪNG chức năng ghi nhật ký thao tác người dùng");
                             }
                          }}
                          className={cn(
                             "relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:ring-offset-1 border-none",
                             isLogEnabled ? "bg-[#005BAA]" : "bg-slate-300"
                          )}
                       >
                          <span
                             className={cn(
                                "pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                                isLogEnabled ? "translate-x-4.5" : "translate-x-0.5"
                             )}
                          />
                       </button>
                    </div>
                    <Button variant="outline" className="h-8 rounded-lg font-bold text-[10px] uppercase border-slate-200 font-sans">Xác thực OTP</Button>
                    <Button variant="outline" className="h-8 rounded-lg font-bold text-[10px] uppercase border-slate-200 font-sans">Tải nhật ký</Button>
                 </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
<div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-6">
<Table className="min-w-[600px]">
                    <TableHeader>
                       <TableRow className="bg-slate-50/30 font-bold uppercase text-[10px]">
                          <TableHead className="px-6">Thời gian</TableHead>
                          <TableHead>Người thao tác</TableHead>
                          <TableHead>Hành động / Đối tượng</TableHead>
                          <TableHead>Thiết bị / IP</TableHead>
                          <TableHead className="text-right pr-6">Trạng thái</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {auditLogs.map((log, i) => (
                         <TableRow key={i} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none">
                            <TableCell className="px-6 py-4 font-mono text-[10px] font-black text-slate-500">{log.time}</TableCell>
                            <TableCell>
                               <div className="font-bold text-slate-900 text-[11px]">{log.user}</div>
                            </TableCell>
                            <TableCell>
                               <div className="font-black text-[#005BAA] text-[9px] uppercase tracking-wider">{log.action}</div>
                               <div className="text-[10px] text-slate-400 font-medium">{log.target}</div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                  <Smartphone className="w-3 h-3 text-slate-300" />
                                  {log.device}
                               </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                               <Badge className={cn(
                                 "text-[8px] font-black uppercase border",
                                 log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                               )}>
                                  {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                               </Badge>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
</div>
</CardContent>
           </Card>
        </TabsContent>

         <TabsContent value="notifications" className="space-y-4 m-0 flex-1 flex flex-col min-h-0">
           <Card className="border-slate-200 shadow-sm overflow-hidden text-left max-w-4xl">
             <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100/50 rounded-xl">
                      <Bell className="w-6 h-6 text-[#005BAA]" />
                   </div>
                   <div>
                     <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                       Thiết lập thông báo bảo mật & Hoạt động
                     </CardTitle>
                     <p className="text-xs text-slate-500 font-medium mt-1">
                       Quản lý cảnh báo khi đăng nhập trên thiết bị lạ hoặc không đăng nhập quá thời gian quy định.
                     </p>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="p-6 space-y-8 bg-white overflow-y-auto">
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
                     <Shield className="w-4 h-4 text-slate-300" />
                     Sự kiện đăng nhập Account
                   </h3>
                   
                   <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-slate-800">Cảnh báo đăng nhập thiết bị lạ / IP mới</p>
                        <p className="text-[11px] text-slate-500">Gửi OTP hoặc Email nếu ID người dùng đăng nhập từ nơi khác.</p>
                      </div>
                      <button 
                        onClick={() => setNotifyLoginConfig({...notifyLoginConfig, loginNewDevice: !notifyLoginConfig.loginNewDevice})}
                        className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:ring-offset-1 border-none", notifyLoginConfig.loginNewDevice ? "bg-[#005BAA]" : "bg-slate-300")}
                      >
                         <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", notifyLoginConfig.loginNewDevice ? "translate-x-4.5" : "translate-x-0.5")} />
                      </button>
                   </div>

                   <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-slate-800">Báo cáo đăng nhập thất bại liên tiếp</p>
                        <p className="text-[11px] text-slate-500">Gửi cảnh báo đến Admin khi một tài khoản nhập sai mk quá 5 lần.</p>
                      </div>
                      <button 
                        onClick={() => setNotifyLoginConfig({...notifyLoginConfig, loginFailed: !notifyLoginConfig.loginFailed})}
                        className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:ring-offset-1 border-none", notifyLoginConfig.loginFailed ? "bg-[#005BAA]" : "bg-slate-300")}
                      >
                         <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", notifyLoginConfig.loginFailed ? "translate-x-4.5" : "translate-x-0.5")} />
                      </button>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                   <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-2">
                     <Clock className="w-4 h-4 text-slate-300" />
                     Giám sát Không hoạt động (Inactivity)
                   </h3>

                   <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[13px] font-bold text-slate-800">Nhắc nhở nhân sự không đăng nhập</p>
                          <p className="text-[11px] text-slate-500">Hệ thống sẽ gửi thông báo Mobile App cho người dùng chưa đăng nhập hệ thống quá hạn định.</p>
                        </div>
                        <button 
                          onClick={() => setNotifyLoginConfig({...notifyLoginConfig, inactiveWarning: !notifyLoginConfig.inactiveWarning})}
                          className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:ring-offset-1 border-none", notifyLoginConfig.inactiveWarning ? "bg-[#005BAA]" : "bg-slate-300")}
                        >
                           <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", notifyLoginConfig.inactiveWarning ? "translate-x-4.5" : "translate-x-0.5")} />
                        </button>
                      </div>
                      
                      {notifyLoginConfig.inactiveWarning && (
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                         <span className="text-[12px] font-bold text-slate-700">Ngưỡng cảnh báo:</span>
                         <Select 
                           value={notifyLoginConfig.inactiveDays.toString()} 
                           onValueChange={(val) => setNotifyLoginConfig({...notifyLoginConfig, inactiveDays: parseInt(val)})}
                         >
                            <SelectTrigger className="w-40 border-slate-200 rounded-xl bg-white font-bold h-8 text-xs">
                               <SelectValue placeholder="Chọn số ngày..." />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="1">Quá 1 ngày (24h)</SelectItem>
                               <SelectItem value="2">Quá 2 ngày</SelectItem>
                               <SelectItem value="3">Quá 3 ngày</SelectItem>
                               <SelectItem value="7">Quá 1 tuần</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      )}
                   </div>

                   <div className="flex items-center justify-between border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-[13px] font-bold text-slate-800">Báo cáo tổng hợp tình trạng online hàng ngày cho Giám đốc</p>
                        <p className="text-[11px] text-slate-500">Tự động push thông báo tới role Quản lý về tỷ lệ đăng nhập sử dụng trên địa bàn.</p>
                      </div>
                      <button 
                        onClick={() => setNotifyLoginConfig({...notifyLoginConfig, dailyReport: !notifyLoginConfig.dailyReport})}
                        className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600 focus:ring-offset-1 border-none", notifyLoginConfig.dailyReport ? "bg-[#005BAA]" : "bg-slate-300")}
                      >
                         <span className={cn("pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", notifyLoginConfig.dailyReport ? "translate-x-4.5" : "translate-x-0.5")} />
                      </button>
                   </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveAuthConfig} className="bg-[#005BAA] hover:bg-blue-700 rounded-xl px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100">
                     <CheckCircle2 className="w-4 h-4 mr-2" />
                     Lưu Thay Đổi
                  </Button>
                </div>
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
