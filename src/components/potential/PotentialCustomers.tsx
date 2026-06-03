import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Plus, MapPin, Phone, StickyNote, Trash2, Crosshair, Target, Search, Loader2, Download, RefreshCw } from 'lucide-react';
import ExcelJS from 'exceljs';
import { dataService, PotentialCustomer } from '@/src/services/dataService';
import { authService } from '@/src/services/authService';
import { userService, UserDetail } from '@/src/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PotentialCustomers() {
  const [customers, setCustomers] = React.useState<PotentialCustomer[]>([]);
  const [users, setUsers] = React.useState<UserDetail[]>([]);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [viewingCustomer, setViewingCustomer] = React.useState<PotentialCustomer | null>(null);
  const [editingSalesNotes, setEditingSalesNotes] = React.useState('');
  const [editingStatus, setEditingStatus] = React.useState<'NEW' | 'CONTACTED' | 'CONVERTED'>('NEW');
  const [confirmDelete, setConfirmDelete] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    customerToTrash: string | null;
  }>({
    open: false,
    title: '',
    description: '',
    customerToTrash: null
  });
  
  // Form State
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [currentProvider, setCurrentProvider] = React.useState('');
  const [isMonthlyPayment, setIsMonthlyPayment] = React.useState(false);
  const [previousBillingExpiration, setPreviousBillingExpiration] = React.useState('');
  const [painPoints, setPainPoints] = React.useState('');
  const [coordinates, setCoordinates] = React.useState<{lat: number, lng: number} | null>(null);

  React.useEffect(() => {
    const refreshData = () => {
      dataService.getPotentialCustomers().then(setCustomers);
    };
    refreshData();
    const unsub = dataService.subscribe(refreshData);

    const autoSyncInterval = setInterval(() => {
      dataService.forceSyncPotentials().catch(console.error);
    }, 60000); // 60 seconds auto-sync (realtime handles immediate updates)

    setUsers(userService.getUsers());
    const unsubUsers = userService.subscribe(() => setUsers(userService.getUsers()));

    return () => {
      unsub();
      unsubUsers();
      clearInterval(autoSyncInterval);
    };
  }, []);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.info("Đang lấy tọa độ GPS...");
      const getPos = (options: PositionOptions) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setCoordinates({ lat, lng });
            toast.success("Đã lấy tọa độ thành công");
            
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`)
              .then(res => res.json())
              .then(data => {
                if (data && data.display_name) {
                  setAddress(data.display_name);
                  toast.success("Đã cập nhật địa chỉ từ tọa độ");
                }
              })
              .catch(() => {
                console.error("Lỗi khi lấy địa chỉ từ tọa độ");
              });
          },
          (error) => {
            if (error.code === 1) { // PERMISSION_DENIED
              toast.error("Bạn đã từ chối cấp quyền định vị. Vui lòng cấp quyền trong cài đặt thiết bị/trình duyệt.");
            } else if (options.enableHighAccuracy) {
              getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
            } else {
              toast.error("Không thể lấy tọa độ. Vui lòng bật GPS trên thiết bị.");
            }
          },
          options
        );
      };
      getPos({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị");
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !address) {
      toast.error("Vui lòng điền đủ Họ tên, Số ĐT và Địa chỉ.");
      return;
    }
    try {
      const currentUser = authService.getCurrentUser();
      await dataService.addPotentialCustomer({
        name,
        phone,
        address,
        currentProvider,
        paymentMethod: isMonthlyPayment ? 'MONTHLY' : 'PREPAID',
        previousBillingExpiration: isMonthlyPayment ? '' : previousBillingExpiration,
        painPoints,
        coordinates: coordinates || undefined,
        status: 'NEW',
        staffId: currentUser?.uid,
        createdBy: currentUser?.uid
      });
      toast.success("Đã thêm khách hàng tiềm năng");
      setIsAddOpen(false);
      resetForm();
    } catch (e) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({
      open: true,
      title: 'Xác nhận xóa',
      description: 'Chắc chắn xóa thông tin khách hàng tiềm năng này?',
      customerToTrash: id
    });
  };

  const [isDeleting, setIsDeleting] = React.useState(false);

  const executeDelete = async () => {
    if (confirmDelete.customerToTrash) {
      setIsDeleting(true);
      try {
        await dataService.deletePotentialCustomer(confirmDelete.customerToTrash);
        toast.success("Đã xóa khách hàng tiềm năng");
      } catch (error) {
        toast.error("Lỗi khi xóa từ máy chủ");
      } finally {
        setIsDeleting(false);
      }
    }
    setConfirmDelete(prev => ({...prev, open: false}));
  };

  const handleUpdateCustomer = async () => {
    if (viewingCustomer) {
      try {
        await dataService.updatePotentialCustomer(viewingCustomer.id, {
          salesNotes: editingSalesNotes,
          status: editingStatus
        });
        toast.success("Đã cập nhật ghi chú và trạng thái");
        setViewingCustomer(null);
      } catch (e) {
        toast.error("Có lỗi xảy ra khi cập nhật");
      }
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setCurrentProvider('');
    setIsMonthlyPayment(false);
    setPreviousBillingExpiration('');
    setPainPoints('');
    setCoordinates(null);
  };

  const extractCommune = (address: string) => {
    if (!address) return 'Khác';
    const parts = address.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('Xã ') || trimmed.startsWith('Phường ') || trimmed.startsWith('Thị trấn ') || trimmed.startsWith('Thị Trấn ')) {
        return trimmed;
      }
    }
    return 'Khác';
  };

  const filteredCustomers = customers.filter(c => {
    const user = authService.getCurrentUser();
    if (!user || user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'manager') return true;
    return c.staffId === user.uid || c.createdBy === user.uid;
  });

  const groupedCustomers = filteredCustomers.reduce((acc, c) => {
    const commune = extractCommune(c.address);
    if (!acc[commune]) acc[commune] = [];
    acc[commune].push(c);
    return acc;
  }, {} as Record<string, PotentialCustomer[]>);

  const exportToExcel = async () => {
    toast.info("Đang tạo file Excel...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DSTiemNang', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 1.18, // ~30mm
          right: 0.59, // ~15mm
          top: 0.79, // ~20mm
          bottom: 0.79, // ~20mm
          header: 0.3,
          footer: 0.3
        }
      }
    });

    // Add Title
    worksheet.mergeCells('A1:J1');
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'DANH SÁCH KHÁCH HÀNG TIỀM NĂNG';
    titleRow.font = { name: 'Times New Roman', size: 14, bold: true };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.addRow([]);

    // Headers
    const headers = [
      'STT', 'Họ tên', 'Số điện thoại', 'Địa chỉ', 'Nhà mạng', 'Hết trước cước', 
      'Tọa độ', 'Điểm đau/vấn đề', 'Ghi chú bán hàng', 'Trạng thái', 'Người thu thập'
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 13, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Columns width
    worksheet.columns = [
      { width: 6 },  // STT
      { width: 20 }, // Họ tên
      { width: 15 }, // SĐT
      { width: 30 }, // Địa chỉ
      { width: 15 }, // Nhà mạng
      { width: 15 }, // Kỳ hết cước / Thanh toán
      { width: 22 }, // Tọa độ
      { width: 25 }, // Vấn đề
      { width: 25 }, // Ghi chú
      { width: 15 }, // Trạng thái
      { width: 20 }  // Người thu thập
    ];

    // Data
    filteredCustomers.forEach((c, index) => {
      const row = worksheet.addRow([
        index + 1,
        c.name,
        c.phone,
        c.address,
        c.currentProvider || '',
        c.paymentMethod === 'MONTHLY' ? 'Thanh toán hàng tháng' : (c.previousBillingExpiration || ''),
        c.coordinates ? `${c.coordinates.lat.toFixed(5)}, ${c.coordinates.lng.toFixed(5)}` : '',
        c.painPoints || '',
        c.salesNotes || '',
        c.status === 'NEW' ? 'MỚI THU THẬP' : c.status === 'CONTACTED' ? 'ĐÃ TIẾP XÚC / TƯ VẤN' : 'ĐÃ CHỐT HỢP ĐỒNG',
        users.find(u => u.id === (c.createdBy || c.staffId))?.name || 'Không xác định'
      ]);

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Times New Roman', size: 13 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        if (colNumber === 1 || colNumber === 3 || colNumber === 9) {
          cell.alignment.horizontal = 'center';
        }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_KHTN_${new Date().toISOString().slice(0,10).replace(/-/g, '')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file Excel");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50 gap-4 overflow-y-auto custom-scrollbar pr-2">
      {/* Header Area */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shrink-0">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#1c4b82] flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> Khách hàng tiềm năng
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Thu thập thông tin KH mới tại thị trường</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button 
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="w-full sm:w-auto bg-brand-orange hover:bg-[#E65A1E] text-white rounded-xl shadow-md shadow-orange-100 font-bold uppercase text-[11px] h-10 px-5 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thu thập thông tin
          </Button>
          <Button 
            onClick={exportToExcel}
            variant="outline"
            className="w-full sm:w-auto text-[#1c4b82] border-brand-indigo/20 hover:bg-brand-indigo/5 rounded-xl font-bold uppercase text-[11px] h-10 px-4 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>
      
      {/* Statistics / Results Summary */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-7xl mx-auto shrink-0 mb-2">
         <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <TrendingUp className="w-16 h-16 text-blue-600" />
             </div>
             <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1 z-10">Đã thu thập</p>
             <h3 className="text-3xl font-black text-[#005BAA] z-10">{customers.length}</h3>
         </div>
         <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Phone className="w-16 h-16 text-amber-600" />
             </div>
             <p className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-1 z-10">Đã tiếp xúc / Tư vấn</p>
             <h3 className="text-3xl font-black text-amber-700 z-10">{customers.filter(c => c.status === 'CONTACTED').length}</h3>
         </div>
         <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Crosshair className="w-16 h-16 text-emerald-600" />
             </div>
             <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mb-1 z-10">Chốt thành công (Ký HĐ)</p>
             <h3 className="text-3xl font-black text-emerald-700 z-10">{customers.filter(c => c.status === 'CONVERTED').length}</h3>
         </div>
      </div>

      {/* List */}
      <div className="w-full max-w-7xl mx-auto space-y-4">
         {Object.entries(groupedCustomers).sort(([a], [b]) => a.localeCompare(b)).map(([commune, list]: [string, any]) => (
           <div key={commune} className="mb-0">
             <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 inline-block bg-slate-200/50 px-3 py-1 rounded-lg">Nhóm: {commune}</h3>
             <div className="space-y-4">
               {list.map((c, i) => (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={c.id}
                   className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 justify-between"
                 >
                   <div className="flex-1 space-y-4">
                     <div>
                                               <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-lg uppercase text-[#1c4b82] tracking-tight">{c.name}</h3>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm border ${
                              c.status === 'NEW' ? "bg-blue-50 text-blue-600 border-blue-100" :
                              c.status === 'CONTACTED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}>
                            {c.status === 'NEW' ? 'MỚI THU THẬP' : c.status === 'CONTACTED' ? 'ĐÃ TIẾP XÚC / TƯ VẤN' : 'ĐÃ CHỐT HỢP ĐỒNG'}
                          </span>
                        </div>
                       <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 mt-2">
                         <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {c.phone}</p>
                         <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {c.address}</p>
                         <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                           <Crosshair className="w-4 h-4 text-slate-400" /> Thu thập bởi: {users.find(u => u.id === (c.createdBy || c.staffId))?.name || 'Không xác định'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-slate-50 p-4 rounded-xl">
                         <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1 text-slate-400">Đang dùng mạng</p>
                         <p className="text-sm font-bold text-slate-700">{c.currentProvider || '---'}</p>
                       </div>
                       <div className={c.previousBillingExpiration ? "bg-red-50 p-4 rounded-xl border border-red-100" : "bg-slate-50 p-4 rounded-xl"}>
                         <p className={`text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${c.previousBillingExpiration ? 'text-red-500' : 'text-slate-400'}`}><StickyNote className="w-3 h-3" /> Kỳ hết cước trước (Đ/Tủ)</p>
                         <p className={`text-sm font-medium ${c.previousBillingExpiration ? 'text-red-800 font-bold' : 'text-slate-700'}`}>{c.paymentMethod === 'MONTHLY' ? 'Thanh toán hàng tháng' : (c.previousBillingExpiration || 'Không có ghi chú')}</p>
                       </div>
                       <div className={c.painPoints ? "bg-orange-50 p-4 rounded-xl border border-orange-100" : "bg-slate-50 p-4 rounded-xl"}>
                         <p className={`text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${c.painPoints ? 'text-orange-500' : 'text-slate-400'}`}><Target className="w-3 h-3" /> Điểm đau / Vấn đề</p>
                         <p className={`text-sm font-medium ${c.painPoints ? 'text-orange-800' : 'text-slate-700'}`}>{c.painPoints || 'Không có ghi chú'}</p>
                       </div>
                     </div>
                     {c.salesNotes && (
                       <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                         <p className="text-[10px] font-bold text-blue-400 uppercase mb-1 flex items-center gap-1">Nhật ký & Ghi chú bán hàng</p>
                         <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">{c.salesNotes}</p>
                       </div>
                     )}
                   </div>
                   
                   <div className="md:border-l md:border-slate-100 md:pl-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 shrink-0 w-full md:w-48">
                      {c.coordinates && (
                        <div className="text-center w-full min-h-[50px] bg-slate-50 p-2 rounded-xl mb-auto flex flex-col justify-center items-center group cursor-pointer hover:bg-slate-100 transition-colors"
                             title="Bấm để xem trên Google Maps"
                             onClick={(e) => {
                               e.stopPropagation();
                               window.open(`https://www.google.com/maps?q=${c.coordinates!.lat},${c.coordinates!.lng}`, '_blank');
                             }}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-center gap-1 group-hover:text-brand-orange transition-colors"><MapPin className="w-3 h-3 text-brand-orange" /> Tọa độ Check-in</p>
                          <p className="text-[11px] text-slate-700 font-mono tracking-wider">{c.coordinates.lat.toFixed(6)}</p>
                          <p className="text-[11px] text-slate-700 font-mono tracking-wider">{c.coordinates.lng.toFixed(6)}</p>
                        </div>
                      )}
                      <div className="w-full flex flex-col gap-2 mt-auto">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setViewingCustomer(c);
                            setEditingSalesNotes(c.salesNotes || '');
                            setEditingStatus(c.status);
                          }}
                          className="border-brand-indigo/20 text-[#1c4b82] hover:bg-brand-indigo/5 font-bold uppercase text-[10px] tracking-wider md:w-full"
                        >
                          <Search className="w-4 h-4 mr-2" /> Xem & Ghi chú
                        </Button>
                        {(authService.getCurrentUser()?.role?.toLowerCase() === 'admin' || authService.getCurrentUser()?.role?.toLowerCase() === 'manager') && (
                          <Button 
                            variant="ghost" 
                            onClick={() => handleDelete(c.id)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-50 font-bold uppercase text-[10px] tracking-wider md:w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Xóa
                          </Button>
                        )}
                      </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           </div>
         ))}
         
         {filteredCustomers.length === 0 && (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <TrendingUp className="w-8 h-8 text-brand-orange" />
             </div>
             <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-2">Chưa có khách hàng tiềm năng</h3>
             <p className="text-xs text-slate-400">Hãy bắt đầu thu thập thông tin khách hàng tại hiện trường.</p>
           </div>
         )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="bg-brand-indigo p-5 shrink-0">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              Thêm KH Tiềm năng
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-5 bg-white space-y-4 overflow-y-auto custom-scrollbar flex-1 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 relative group">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Họ và tên *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-xl font-medium text-sm" placeholder="Nhập họ tên KH" />
              </div>
              <div className="space-y-1.5 relative group">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Số điện thoại *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-xl font-medium text-sm" placeholder="VD: 0912345678" />
              </div>
            </div>
            
            <div className="space-y-1.5 relative group">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Địa chỉ *</Label>
              <div className="flex gap-2">
                <Input value={address} onChange={e => setAddress(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-xl font-medium flex-1 text-sm" placeholder="Số nhà, đường, phường, quận..." />
                <Button onClick={handleGetLocation} type="button" variant="outline" className="h-10 w-10 shrink-0 rounded-xl border-slate-200 hover:bg-brand-indigo hover:text-white p-0 shadow-sm" title="Lấy toạ độ Check-in">
                  <Crosshair className="w-4 h-4" />
                </Button>
              </div>
              {coordinates && (
                <p className="text-[10px] font-mono font-bold text-emerald-600 mt-1">✓ Đã lấy tọa độ: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</p>
              )}
            </div>

            <div className="space-y-1.5 relative group border-t border-slate-100 pt-3">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Đang dùng nhà CC</Label>
              <select value={currentProvider} onChange={e => setCurrentProvider(e.target.value)} className="h-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm px-3 w-full outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo">
                <option value="">Chọn nhà cung cấp...</option>
                <option value="FPT">FPT</option>
                <option value="Viettel">Viettel</option>
                <option value="Mobifone">Mobifone</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="monthlyPayment" checked={isMonthlyPayment} onChange={e => setIsMonthlyPayment(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-indigo focus:ring-brand-indigo" />
              <label htmlFor="monthlyPayment" className="text-[11px] font-bold text-slate-700 cursor-pointer">Dùng thanh toán hàng tháng</label>
            </div>

            {!isMonthlyPayment && (
              <div className="space-y-1.5 relative group mt-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tháng hết hạn đóng trước cước</Label>
                <Input type="month" value={previousBillingExpiration} onChange={e => setPreviousBillingExpiration(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-xl font-medium text-sm" />
              </div>
            )}

            <div className="space-y-1.5 relative group mt-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Điểm đau / Vấn đề của KH</Label>
              <textarea 
                value={painPoints} 
                onChange={e => setPainPoints(e.target.value)} 
                className="bg-slate-50 border-slate-200 rounded-xl font-medium resize-none min-h-[70px] w-full p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-indigo transition-all" 
                placeholder="VD: Mạng chập chờn ban đêm, giá thiết bị cao..." 
              />
            </div>
          </div>

          <DialogFooter className="bg-slate-50 border-t border-slate-100 p-4">
            <div className="flex gap-2 w-full">
              <Button onClick={() => setIsAddOpen(false)} variant="ghost" className="flex-1 h-10 font-bold uppercase text-[11px] tracking-wider rounded-xl">
                Hủy
              </Button>
              <Button onClick={handleSave} className="flex-1 h-10 bg-brand-orange hover:bg-[#E65A1E] text-white font-bold uppercase text-[11px] tracking-wider rounded-xl shadow-md shadow-orange-100">
                Lưu thông tin
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete.open} onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 border-none shadow-2xl">
           <div className="bg-red-500 p-6 text-white text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <DialogTitle className="text-xl font-black uppercase tracking-tight">{confirmDelete.title}</DialogTitle>
              <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Dữ liệu sẽ bị xóa vĩnh viễn</p>
           </div>
           <div className="p-8 text-center bg-white">
              <p className="text-slate-600 font-medium mb-6">
                {confirmDelete.description}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setConfirmDelete(prev => ({ ...prev, open: false }))} className="flex-1 rounded-xl font-bold uppercase text-[10px]" disabled={isDeleting}>Hủy bỏ</Button>
                <Button onClick={executeDelete} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]">
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Xác nhận xóa
                </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 border-none shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="bg-slate-50 p-5 pb-5 border-b border-slate-100 shrink-0">
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-[#1c4b82] flex items-center gap-2">
              <Search className="w-5 h-5 text-brand-orange" />
              Chi tiết khách hàng
            </DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="p-5 bg-white space-y-4 overflow-y-auto custom-scrollbar flex-1 relative z-10">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Họ và tên</p>
                  <p className="text-sm font-bold text-slate-800">{viewingCustomer.name}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Số điện thoại</p>
                    <p className="text-sm font-bold text-slate-800">{viewingCustomer.phone}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Trạng thái</p>
                    <p className="text-sm font-bold text-blue-600">{viewingCustomer.status === "NEW" ? "MỚI THU THẬP" : viewingCustomer.status === "CONTACTED" ? "ĐÃ TIẾP XÚC" : "ĐÃ CHỐT HĐ"}</p>
                 </div>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Địa chỉ</p>
                  <p className="text-sm font-bold text-slate-800">{viewingCustomer.address}</p>
               </div>
               {viewingCustomer.coordinates && (
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Tọa độ Check-in</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm font-mono text-slate-800">{viewingCustomer.coordinates.lat.toFixed(5)}, {viewingCustomer.coordinates.lng.toFixed(5)}</p>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${viewingCustomer.coordinates!.lat},${viewingCustomer.coordinates!.lng}`, '_blank')}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-brand-orange hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors"
                      >
                         <MapPin className="w-3 h-3" /> Xem Bản Đồ
                      </button>
                    </div>
                 </div>
               )}
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 space-y-3">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-start gap-1">Đang dùng mạng / Hình thức TT</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5 whitespace-pre-wrap">{viewingCustomer.currentProvider || 'Chưa cung cấp'} • {viewingCustomer.paymentMethod === 'MONTHLY' ? 'Thanh toán hàng tháng' : `Trả trước: ${viewingCustomer.previousBillingExpiration || '---'}`}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-start gap-1"><StickyNote className="w-3 h-3" /> Kỳ hết cước trước</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{viewingCustomer.paymentMethod === 'MONTHLY' ? 'Thanh toán hàng tháng' : (viewingCustomer.previousBillingExpiration || 'Không có')}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-start gap-1"><Target className="w-3 h-3" /> Điểm đau / Vấn đề</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 whitespace-pre-wrap">{viewingCustomer.painPoints || 'Không có'}</p>
                 </div>
               </div>

               {/* Edit Form Section */}
               <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Trạng thái bán hàng</Label>
                   <div className="flex gap-2">
                     {['NEW', 'CONTACTED', 'CONVERTED'].map(status => (
                       <button
                         key={status}
                         onClick={() => setEditingStatus(status as any)}
                         className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase rounded-xl border ${editingStatus === status ? 'bg-brand-indigo text-white border-brand-indigo shadow-md shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                       >
                         {status === 'NEW' ? 'MỚI' : status === 'CONTACTED' ? 'ĐÃ TIẾP XÚC' : 'ĐÃ CHỐT HĐ'}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nhật ký & Ghi chú bán hàng</Label>
                   <textarea 
                     value={editingSalesNotes} 
                     onChange={e => setEditingSalesNotes(e.target.value)} 
                     className="bg-slate-50 border-slate-200 rounded-xl font-medium resize-none min-h-[70px] w-full p-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-indigo transition-all" 
                     placeholder="Ghi chú sau khi tiếp xúc KH..." 
                   />
                 </div>
               </div>
            </div>
          )}
          <DialogFooter className="bg-slate-50 border-t border-slate-100 p-4">
             <div className="flex gap-2 w-full">
               <Button onClick={() => setViewingCustomer(null)} variant="ghost" className="flex-1 h-10 font-bold uppercase text-[11px] tracking-wider rounded-xl hover:bg-slate-200">
                 Đóng
               </Button>
               <Button onClick={handleUpdateCustomer} className="flex-1 h-10 bg-brand-orange hover:bg-[#E65A1E] text-white font-bold uppercase text-[11px] tracking-wider rounded-xl shadow-md shadow-orange-100 w-full">
                 Cập nhật
               </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
