import React from 'react';
import { 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Navigation,
  History,
  AlertCircle,
  MoreVertical,
  Camera,
  MessageSquare,
  ChevronRight,
  Loader2,
  Search,
  Inbox,
  Activity,
  ClipboardList
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { dataService, Assignment, Customer } from "@/src/services/dataService";
import { authService } from "@/src/services/authService";

interface TaskWithCustomer extends Assignment {
  customer?: Customer;
}

export default function MyTasks() {
  const [tasks, setTasks] = React.useState<TaskWithCustomer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTask, setSelectedTask] = React.useState<TaskWithCustomer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [checkInDone, setCheckInDone] = React.useState(false);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'PENDING' | 'IN_PROGRESS' | 'PROCESSED'>('PENDING');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const userId = authService.getCurrentUser()?.uid || '3'; 
    const unsubscribe = dataService.subscribeToAssignments(async (allAssignments) => {
      const myAssignments = allAssignments.filter(a => String(a.staffId) === String(userId));
      
      const customers = await dataService.getCustomers();
      const batches = await dataService.getBatches();
      const today = new Date().toISOString().split('T')[0];
      
      const merged = myAssignments.map(a => {
        const customer = customers.find(c => c.id === a.customerId);
        return { ...a, customer };
      }).filter(task => {
        // Find the associated campaign/batch
        const batch = batches.find(b => b.id === task.campaignId);
        
        // Hide if batch was deleted
        if (!batch) {
          return false;
        }
        
        // Hide if batch is explicitly marked as COMPLETED
        if (batch.status === 'COMPLETED') {
          return false;
        }
        
        // Hide if batch end date has passed
        if (batch.endDate) {
          if (batch.endDate < today) {
            return false;
          }
        }
        return true;
      });
      
      setTasks(merged);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    try {
      await dataService.updateAssignment(taskId, { status: 'IN_PROGRESS' });
      toast.success("Đã tiếp nhận nhiệm vụ!");
    } catch (err) {
      toast.error("Lỗi tiếp nhận");
    }
  };

  const handleProcessTask = (task: TaskWithCustomer) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
    setNotes(task.notes || '');
    setCheckInDone(!!task.checkInLocation);
  };

  const handleAcceptAll = async () => {
    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    if (pendingTasks.length === 0) return;
    
    setLoading(true);
    try {
        await Promise.all(pendingTasks.map(t => 
            dataService.updateAssignment(t.id!, { status: 'IN_PROGRESS' })
        ));
        toast.success(`Đã tiếp nhận ${pendingTasks.length} nhiệm vụ!`);
    } catch (err) {
        toast.error("Lỗi khi tiếp nhận hàng loạt");
    } finally {
        setLoading(false);
    }
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị");
      return;
    }

    toast.promise(new Promise((resolve, reject) => {
      const getPos = (options: PositionOptions) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
            setCheckInDone(true);
            resolve(pos);
          },
          (err) => {
            if (err.code === 1) { // PERMISSION_DENIED
              reject(err);
            } else if (options.enableHighAccuracy) {
              // Retry without high accuracy
              getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
            } else {
              reject(err);
            }
          },
          options
        );
      };
      
      getPos({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }), {
      loading: 'Đang xác thực tọa độ GPS...',
      success: 'Check-in thành công!',
      error: 'Lỗi định vị. Vui lòng bật GPS trên thiết bị.'
    });
  };

  const handleUploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file && selectedTask) {
        setLoading(true);
        try {
          const originalSizeKB = Math.round(file.size / 1024);
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
              // Automatically scale down to small dimension (max 320px) to guarantee micro size footprint
              const maxWidth = 320;
              const maxHeight = 320;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                const fallbackUrl = event.target?.result as string;
                const existingImages = selectedTask.images || [];
                await dataService.updateAssignment(selectedTask.id!, {
                  images: [...existingImages, fallbackUrl]
                });
                toast.success("Tải ảnh thành công!");
                setLoading(false);
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              
              // Draw coordinates watermark
              if (selectedTask?.checkInLocation) {
                const timestamp = new Date().toLocaleString('vi-VN');
                const lat = selectedTask.checkInLocation.lat.toFixed(6);
                const lng = selectedTask.checkInLocation.lng.toFixed(6);
                const text = `📍 ${lat}, ${lng} - 🕒 ${timestamp}`;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const textHeight = 16;
                const padding = 6;
                
                // Add a background rectangle for readability
                ctx.font = '12px monospace';
                const textWidth = ctx.measureText(text).width;
                ctx.fillRect(width - textWidth - padding * 2, height - textHeight - padding * 2, textWidth + padding * 2, textHeight + padding * 2);
                
                // Add text
                ctx.fillStyle = '#4ade80';
                ctx.textBaseline = 'bottom';
                ctx.fillText(text, width - textWidth - padding, height - padding);
              }

              // Save as low-quality JPEG for maximum physical compression
              const compressedUrl = canvas.toDataURL('image/jpeg', 0.2);
              const compressedSizeKB = Math.round((compressedUrl.length * 0.75) / 1024);

              const existingImages = selectedTask.images || [];
              await dataService.updateAssignment(selectedTask.id!, {
                images: [...existingImages, compressedUrl]
              });

              toast.success(`Đã tự động tối ưu nén ảnh xuống mức gọn nhẹ tối đa: ${compressedSizeKB} KB (Giảm ${Math.round(Math.max(0, 100 - (compressedSizeKB / (originalSizeKB || 1) * 100)))}% dung lượng)`);
              setLoading(false);
            };
            img.onerror = () => {
              toast.error("Lỗi xử lý định dạng ảnh.");
              setLoading(false);
            };
          };
          reader.readAsDataURL(file);
        } catch (err) {
          toast.error("Lỗi tối ưu dung lượng ảnh.");
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const submitResult = async (status: Assignment['status']) => {
    if (!selectedTask || !selectedTask.id) return;

    if (status === 'COMPLETED' || status === 'FAILED') {
        if (!checkInDone) {
            toast.warning("Vui lòng Check-in GPS trước khi hoàn tất.");
            return;
        }
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Assignment> = {
        status,
        notes,
        assignedDate: new Date().toISOString()
      };

      if (location) {
        updates.checkInLocation = {
          ...location,
          timestamp: new Date().toISOString()
        };
      }

      await dataService.updateAssignment(selectedTask.id, updates);
      toast.success(`Đã cập nhật trạng thái: ${status}`);
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Lỗi cập nhật dữ liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = React.useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return tasks.filter(t => {
      // 1. Status Filter based on activeTab
      let matchesStatus = false;
      if (activeTab === 'PENDING') {
        matchesStatus = t.status === 'PENDING';
      } else if (activeTab === 'IN_PROGRESS') {
        matchesStatus = t.status === 'IN_PROGRESS';
      } else if (activeTab === 'PROCESSED') {
        matchesStatus = ['COMPLETED', 'SUCCESS', 'FAILED', 'RESCHEDULED'].includes(t.status);
      }
      if (!matchesStatus) return false;

      // 2. Search Term Filter
      if (!query) return true;
      const customerName = t.customer?.name?.toLowerCase() || '';
      const phone = t.customer?.phone || '';
      const address = (t.customer?.addressDetail || t.customer?.address || '').toLowerCase();
      const subscriptionId = t.customer?.subscriptionId?.toLowerCase() || '';
      return customerName.includes(query) || phone.includes(query) || address.includes(query) || subscriptionId.includes(query);
    });
  }, [tasks, activeTab, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-[10px]">Đang tải nhiệm vụ của bạn...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-y-auto custom-scrollbar pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nhiệm vụ trọng tâm</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => window.location.reload()}
              className="w-10 h-10 rounded-xl bg-white border-slate-200 text-slate-400 hover:text-[#005BAA]"
            >
              <History className="w-4 h-4" />
            </Button>
            {activeTab === 'PENDING' && tasks.some(t => t.status === 'PENDING') && (
                <Button onClick={handleAcceptAll} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-10 px-4 rounded-xl shadow-sm gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    TIẾP NHẬN TẤT CẢ
                </Button>
            )}
        </div>
      </div>

      {/* Modern Control & Classification Tabs Bar */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 justify-between items-stretch bg-white p-4 rounded-3xl border border-slate-100 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2 w-full">
          <Button
            variant={activeTab === 'PENDING' ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab('PENDING')}
            className={cn(
              "text-[11.5px] shrink-0 snap-start font-black uppercase tracking-wider rounded-xl h-10 px-4 flex items-center gap-1.5",
              activeTab === 'PENDING' 
                ? "bg-slate-900 text-white hover:bg-slate-800" 
                : "border-slate-200 text-slate-500 hover:text-slate-800 bg-white"
            )}
          >
            <Inbox className="w-4 h-4" />
            Mới tiếp nhận
            <Badge className={cn("ml-1 px-1.5 py-0.5 text-[9px] font-black rounded-lg", 
              activeTab === 'PENDING' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {tasks.filter(t => t.status === 'PENDING').length}
            </Badge>
          </Button>

          <Button
            variant={activeTab === 'IN_PROGRESS' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab('IN_PROGRESS');
            }}
            className={cn(
              "text-[11.5px] shrink-0 snap-start font-black uppercase tracking-wider rounded-xl h-10 px-4 flex items-center gap-1.5",
              activeTab === 'IN_PROGRESS' 
                ? "bg-[#005BAA] text-white hover:bg-[#004b8c]" 
                : "border-slate-200 text-slate-500 hover:text-slate-800 bg-white"
            )}
          >
            <Activity className="w-4 h-4" />
            Đang triển khai
            <Badge className={cn("ml-1 px-1.5 py-0.5 text-[9px] font-black rounded-lg", 
              activeTab === 'IN_PROGRESS' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {tasks.filter(t => t.status === 'IN_PROGRESS').length}
            </Badge>
          </Button>

          <Button
            variant={activeTab === 'PROCESSED' ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTab('PROCESSED');
            }}
            className={cn(
              "text-[11.5px] shrink-0 snap-start font-black uppercase tracking-wider rounded-xl h-10 px-4 flex items-center gap-1.5",
              activeTab === 'PROCESSED' 
                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                : "border-slate-200 text-slate-500 hover:text-slate-800 bg-white"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Đã xử lý
            <Badge className={cn("ml-1 px-1.5 py-0.5 text-[9px] font-black rounded-lg", 
              activeTab === 'PROCESSED' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {tasks.filter(t => ['COMPLETED', 'SUCCESS', 'FAILED', 'RESCHEDULED'].includes(t.status)).length}
            </Badge>
          </Button>
        </div>

        {/* Realtime Quick Search Bar */}
        <div className="relative w-full shrink-0 md:max-w-xs md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm tên, SĐT, địa chỉ..." 
            className="pl-10 bg-slate-50/50 border-slate-100 h-10 rounded-xl text-[11px] font-semibold focus:bg-white w-full shadow-inner" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task, idx) => (
          <motion.div 
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all hover:border-[#005BAA]/20 cursor-pointer"
            onClick={() => handleProcessTask(task)}
          >
            <div className={cn("absolute left-0 top-0 bottom-0 w-2", getPriorityColor(task.priority || 'MEDIUM'))} />
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                 <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{task.customer?.name}</h3>
                 <p className="text-[9px] text-[#005BAA] font-black uppercase tracking-widest mb-1 mt-1">{task.campaignId}</p>
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase shrink-0 ml-2", 'bg-blue-50 text-blue-700 border-blue-100')}>
                {task.customer?.services?.join(' • ') || 'Fiber'}
              </Badge>
            </div>
            
            {/* Task Assign Metadata */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3 bg-slate-50/70 p-1.5 rounded-2xl border border-slate-100/50">
               {/* Priority Tag */}
               {task.priority === 'HIGH' ? (
                 <span className="text-[8.5px] font-black bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-lg uppercase">🔴 Khẩn</span>
               ) : task.priority === 'LOW' ? (
                 <span className="text-[8.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-lg uppercase">🟢 Thấp</span>
               ) : (
                 <span className="text-[8.5px] font-black bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-lg uppercase">🟡 Thường</span>
               )}

               {/* Task Type */}
               <span className="text-[8.5px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100/50 truncate max-w-[120px]" title={task.taskType || 'Tư vấn nâng gói Cáp quang'}>
                 💼 {task.taskType || 'Tư vấn nâng gói Cáp quang'}
               </span>

               {/* Deadline */}
               <span className="text-[8.5px] font-mono font-black text-rose-500 bg-white px-2 py-0.5 rounded-lg border border-slate-100/50 ml-auto flex items-center gap-1">
                 📅 {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}) : 'Hôm nay'}
               </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/40 p-2 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Mã thuê bao</span>
                  <span className="font-mono font-black text-slate-700 truncate block">{task.customer?.subscriptionId || '---'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block text-right">Doanh thu bình quân</span>
                  <span className="font-mono font-black text-emerald-600 block text-right">{(task.customer?.revenue || 0).toLocaleString()} đ</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-[#005BAA] mt-0.5 shrink-0" />
                <p className="text-[10px] font-bold text-slate-500 line-clamp-1">{task.customer?.addressDetail || task.customer?.address || 'Hà Nội'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-blue-50/50 p-2 rounded-xl">
                  <Phone className="w-3.5 h-3.5 text-[#005BAA] shrink-0" />
                  <p className="text-[9px] font-black text-[#005BAA] tracking-wider">{task.customer?.phone}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                  <span className="text-[8.5px] font-black text-slate-500 uppercase truncate">📍 Ô: {task.customer?.territory || 'Chưa gán'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-1.5">
                  <div className={cn("w-2.5 h-2.5 rounded-full ring-4 ring-offset-0 transition-all", getStatusDotColor(task.status))} />
                  <span className={cn("text-[10px] font-black uppercase tracking-wider", getStatusTextColor(task.status))}>
                    {getStatusLabel(task.status)}
                  </span>
               </div>
               <div className="flex gap-2">
                 <Button 
                   variant="outline" 
                   size="icon"
                   className="w-10 h-10 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-600 active:scale-95 transition-transform"
                   onClick={(e) => {
                     e.stopPropagation();
                     if (task.customer?.phone) {
                       toast.success(`Đang thực hiện cuộc gọi tới ${task.customer.phone}...`);
                       window.location.href = `tel:${task.customer.phone}`;
                       if (task.status === 'PENDING') {
                         dataService.updateAssignment(task.id!, { status: 'IN_PROGRESS' }).catch(console.error);
                       }
                     } else {
                       toast.error("Không tìm thấy số điện thoại.");
                     }
                   }}
                 >
                   <Phone className="w-4 h-4" />
                 </Button>
                 {task.status === 'PENDING' ? (
                   <Button 
                     onClick={(e) => handleAcceptTask(e, task.id!)}
                     className="h-10 px-4 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
                   >
                      TIẾP NHẬN
                   </Button>
                 ) : (
                   <Button variant="ghost" size="sm" className="h-10 px-3 text-[11px] font-black text-[#005BAA] hover:bg-blue-50 rounded-xl gap-2 transition-transform group-hover:translate-x-1 active:scale-105">
                      XỬ LÝ <ChevronRight className="w-3.5 h-3.5" />
                   </Button>
                 )}
               </div>
            </div>
          </motion.div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             {activeTab === 'PENDING' && (
               <>
                 <Inbox className="w-16 h-16 text-slate-200 mb-4" />
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có nhiệm vụ mới tiếp nhận</p>
                 <p className="text-xs text-slate-300 font-bold mt-2">Toàn bộ nhiệm vụ mới đã được xử lý hoặc tiếp nhận!</p>
               </>
             )}
             {activeTab === 'IN_PROGRESS' && (
               <>
                 <Activity className="w-16 h-16 text-slate-200 mb-4 animate-pulse" />
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có khách hàng đang triển khai</p>
                 <p className="text-xs text-slate-300 font-bold mt-2">Hãy check tab "Mới tiếp nhận" để tiếp nhận thêm khách hàng.</p>
               </>
             )}
             {activeTab === 'PROCESSED' && (
               <>
                 <CheckCircle2 className="w-16 h-16 text-slate-200 mb-4" />
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có lịch sử đã xử lý xong</p>
                 <p className="text-xs text-slate-300 font-bold mt-2">Các khách hàng xử lý xong sẽ hiển thị lưu vết ở đây.</p>
               </>
             )}
          </div>
        )}
      </div>

      </div>

      {/* Processing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-[2rem] p-0 border-none shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
          <div className="bg-[#005BAA] p-6 text-white shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">Xử lý nhiệm vụ</DialogTitle>
            <DialogDescription className="text-white/60 text-[10px] uppercase font-black tracking-widest mt-1">
              Khách hàng: {selectedTask?.customer?.name}
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6 bg-white overflow-y-auto custom-scrollbar flex-1">
             {/* Full campaign inputs and subscriber information segment */}
             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/80 space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#005BAA]" />
                  Thông tin đầu vào chiến dịch & thuê bao
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-slate-100/50">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Mã thuê bao (MA_TB)</span>
                    <span className="font-mono font-black text-slate-800 text-[11px]">{selectedTask?.customer?.subscriptionId || '---'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block text-right">Doanh thu phát sinh</span>
                    <span className="font-mono font-black text-emerald-600 block text-right text-[11px]">{(selectedTask?.customer?.revenue || 0).toLocaleString()} VNĐ</span>
                  </div>
                  
                  <div className="h-px bg-slate-100 col-span-2 my-0.5" />

                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Dịch vụ sử dụng</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedTask?.customer?.services?.map((s, idx) => (
                        <span key={idx} className="text-[8px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 uppercase">{s}</span>
                      )) || <span className="text-[8.5px] text-slate-400 font-bold">Fiber</span>}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block text-right">Chiến dịch / Đợt</span>
                    <span className="font-bold text-slate-500 block text-right text-[11px] truncate">{selectedTask?.campaignId || 'Gói cước'}</span>
                  </div>

                  <div className="h-px bg-slate-100 col-span-2 my-0.5" />

                  <div className="col-span-2 space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Địa chỉ lắp đặt (DIACHI_LD)</span>
                    <span className="font-bold text-slate-700 block leading-tight text-[11px]">{selectedTask?.customer?.addressDetail || selectedTask?.customer?.address || '---'}</span>
                    {selectedTask?.customer?.region && (
                      <span className="text-[8.5px] text-[#005BAA] font-black uppercase mt-0.5 block">📍 Địa bàn: {selectedTask?.customer?.region}</span>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 col-span-2 my-0.5" />

                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Địa bàn (Ô phụ trách)</span>
                    <span className="font-black text-slate-800 uppercase block text-[11px]">🗺️ {selectedTask?.customer?.territory || 'Trống'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] text-slate-400 font-bold uppercase block text-right">NVKD Quản lý</span>
                    <span className="font-medium text-slate-600 block text-right text-[11px] truncate" title={selectedTask?.customer?.salesManager || 'NVKD VNPT'}>
                      👤 {selectedTask?.customer?.salesManager || 'NVKD VNPT'}
                    </span>
                  </div>

                  <div className="col-span-2 pt-1.5 border-t border-dashed border-slate-100 mt-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold uppercase text-[8.5px]">Kỹ thuật phụ trách ô:</span>
                      <span className="font-bold text-slate-700 text-[11px]">🔧 {selectedTask?.customer?.technicalManager || 'Chưa gán'}</span>
                    </div>
                  </div>
                </div>
             </div>

             {/* Dynamic manager assignment note panel */}
             <div className="bg-[#005BAA]/5 p-4 rounded-3xl border border-[#005BAA]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#005BAA] tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Chỉ đạo & Nhiệm vụ giao việc
                  </span>
                  
                  {selectedTask?.priority === 'HIGH' ? (
                    <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg uppercase">🔴 Khẩn cấp</span>
                  ) : selectedTask?.priority === 'LOW' ? (
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">🟢 Thấp</span>
                  ) : (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg uppercase">🟡 Trung bình</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-slate-200 pb-2.5">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Nhiệm vụ chính</p>
                    <p className="font-bold text-slate-800">{selectedTask?.taskType || 'Tư vấn nâng gói Cáp quang'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase text-right">Hạn hoàn thành</p>
                    <p className="font-mono font-black text-rose-600 text-right">
                      {selectedTask?.deadline 
                        ? new Date(selectedTask.deadline).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) 
                        : 'Hôm nay'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Chỉ đạo của Quản lý</p>
                  <p className="text-xs font-semibold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100/80 italic leading-relaxed">
                    {selectedTask?.managerNotes || "Thực hiện tiếp xúc khách hàng, giới thiệu dịch vụ và cập nhật báo cáo kết quả chi tiết."}
                  </p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-1 md:gap-2">
                <Button 
                  variant="outline" 
                  className="h-28 flex flex-col gap-3 rounded-3xl border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-center bg-emerald-50/10 text-emerald-600"
                  onClick={async () => {
                    if (selectedTask?.customer?.phone) {
                      toast.success(`Đang thực hiện cuộc gọi tới ${selectedTask.customer.phone}...`);
                      window.location.href = `tel:${selectedTask.customer.phone}`;
                      if (selectedTask.status === 'PENDING') {
                        try {
                          await dataService.updateAssignment(selectedTask.id!, { status: 'IN_PROGRESS' });
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    } else {
                      toast.error("Không tìm thấy số điện thoại khách hàng.");
                    }
                  }}
                >
                  <Phone className="w-7 h-7 text-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Gọi điện
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                   className={cn(
                    "h-28 flex flex-col gap-3 rounded-3xl border-slate-100 transition-all text-center",
                    selectedTask?.images && selectedTask.images.length > 0 ? "bg-emerald-50 border-emerald-200" : "hover:bg-blue-50 hover:border-blue-200"
                  )}
                  onClick={handleUploadImage}
                >
                  <Camera className={cn("w-7 h-7", selectedTask?.images && selectedTask.images.length > 0 ? "text-emerald-600" : "text-[#005BAA]")} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {selectedTask?.images && selectedTask.images.length > 0 ? `${selectedTask.images.length} Ảnh minh chứng` : "Chụp ảnh"}
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-28 flex flex-col gap-3 rounded-3xl border-slate-100 transition-all text-center",
                    checkInDone ? "bg-emerald-50 border-emerald-200" : "hover:bg-blue-50 hover:border-blue-200"
                  )}
                  onClick={handleCheckIn}
                >
                  <MapPin className={cn("w-7 h-7", checkInDone ? "text-emerald-600" : "text-[#005BAA]")} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    {checkInDone ? "CHECK-IN OK" : "Xác thực GPS"}
                  </span>
                </Button>
             </div>

             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Phản hồi từ hiện trường</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[100px] p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#005BAA]/5 transition-all text-slate-700"
                  placeholder="Ghi nhận ý kiến khách hàng, lý do thành công/thất bại..."
                />
             </div>

             <div className="grid grid-cols-2 gap-3">
                <Button 
                   disabled={isSubmitting}
                   onClick={() => submitResult("FAILED")}
                   variant="outline" 
                   className="w-full font-black border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 h-14 rounded-2xl uppercase text-[11px] tracking-widest transition-colors"
                >
                  Thất bại
                </Button>
                <Button 
                   disabled={isSubmitting}
                  onClick={() => submitResult("RESCHEDULED")}
                  variant="outline" 
                  className="w-full font-black border-slate-100 text-slate-400 hover:bg-orange-50 hover:text-orange-600 h-14 rounded-2xl uppercase text-[11px] tracking-widest transition-colors"
                >
                  Hẹn gặp lại
                </Button>
             </div>
             {checkInDone && selectedTask?.images && selectedTask.images.length > 0 && notes.trim().length > 0 ? (
               <Button 
                  disabled={isSubmitting}
                  onClick={() => submitResult("COMPLETED")}
                  className="w-full font-black bg-emerald-600 hover:bg-emerald-700 h-16 rounded-2xl shadow-2xl shadow-emerald-200 uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN HOÀN TẤT"}
                </Button>
             ) : (
                <div className="w-full min-h-[64px] flex items-center justify-center text-center p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Hoàn thành: Chụp ảnh, Check-in GPS, và Ghi chú phản hồi hiện trường để hiện Xác Nhận Hoàn Tất
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH': return 'bg-red-500';
    case 'MEDIUM': return 'bg-orange-400';
    case 'LOW': return 'bg-blue-400';
    default: return 'bg-slate-300';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING': return 'Đã giao';
    case 'IN_PROGRESS': return 'Đang xử lý';
    case 'COMPLETED': case 'SUCCESS': return 'Thành công';
    case 'FAILED': return 'Không thành công';
    case 'RESCHEDULED': return 'Hẹn gặp lại';
    default: return status;
  }
}

function getStatusTextColor(status: string) {
  switch (status) {
    case 'COMPLETED': case 'SUCCESS': return 'text-emerald-600';
    case 'IN_PROGRESS': return 'text-blue-600';
    case 'RESCHEDULED': return 'text-orange-600';
    case 'FAILED': return 'text-red-600';
    default: return 'text-slate-500';
  }
}

function getStatusDotColor(status: string) {
  switch (status) {
    case 'COMPLETED': case 'SUCCESS': return 'bg-emerald-500';
    case 'IN_PROGRESS': return 'bg-blue-500';
    case 'RESCHEDULED': return 'bg-orange-500';
    case 'FAILED': return 'bg-red-500';
    default: return 'bg-slate-300';
  }
}

