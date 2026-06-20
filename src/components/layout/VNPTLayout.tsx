import { getRoutePermissions } from "@/src/services/permissionService";
import React from 'react';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  ClipboardList, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu,
  ChevronRight,
  Bell,
  Activity,
  CheckCheck,
  Clock,
  Info,
  AlertTriangle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '@/src/services/authService';
import { userService } from '@/src/services/userService';
import { notificationService, VNPTNotification } from '@/src/services/notificationService';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react'; // Also added missing Lucide icons

interface VNPTLayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function VNPTLayout({ children, userRole, userName, onNavigate, currentPage }: VNPTLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isScrollingDown, setIsScrollingDown] = React.useState(false);
  const [settings, setSettings] = React.useState(userService.getUnitSettings());
  const [notifications, setNotifications] = React.useState<VNPTNotification[]>(notificationService.getNotifications());
  const unreadCount = notifications.filter(n => !n.read).length;

  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [isChangingPass, setIsChangingPass] = React.useState(false);
  const [expandedNotifs, setExpandedNotifs] = React.useState<string[]>([]);
  const lastY = React.useRef(0);

  const toggleExpandNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedNotifs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    setIsChangingPass(true);
    try {
      await authService.changePassword(newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setIsChangePasswordOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message || "Lỗi đổi mật khẩu");
    } finally {
      setIsChangingPass(false);
    }
  };

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const unsubUser = userService.subscribe(() => {
      setSettings(userService.getUnitSettings());
    });

    const unsubNotif = notificationService.subscribe(() => {
      setNotifications(notificationService.getNotifications());
    });
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      unsubUser();
      unsubNotif();
    };
  }, []);

  // Global touch listener to detect scroll direction on mobile
  React.useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      lastY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - lastY.current;
      
      // Swipe up -> scroll down -> hide menus
      if (deltaY < -15) {
        setIsScrollingDown(true);
        lastY.current = currentY;
      } 
      // Swipe down -> scroll up -> show menus
      else if (deltaY > 15) {
        setIsScrollingDown(false);
        lastY.current = currentY;
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type: VNPTNotification['type']) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'TASK': return <ClipboardList className="w-4 h-4 text-green-500" />;
      case 'SYSTEM': return <Settings className="w-4 h-4 text-slate-500" />;
      default: return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  const currentPermissions = getRoutePermissions();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: currentPermissions.dashboard },
    { id: 'users', label: 'Quản lý nhân sự', icon: Users, roles: currentPermissions.users },
    { id: 'assignments', label: 'Giao nhiệm vụ', icon: ClipboardList, roles: currentPermissions.assignments },
    { id: 'archive', label: 'Lưu trữ & Lịch sử', icon: Clock, roles: currentPermissions.archive },
    { id: 'tasks', label: 'Nhiệm vụ', icon: MapPin, roles: currentPermissions.tasks },
    { id: 'customers', label: 'Dữ liệu khách hàng', icon: Users, roles: currentPermissions.customers },
    { id: 'potential', label: 'Thu thập tiềm năng', icon: TrendingUp, roles: currentPermissions.potential },
    { id: 'settings', label: 'Cài đặt đơn vị', icon: Settings, roles: currentPermissions.settings },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.map(r => r.toLowerCase()).includes(userRole.toLowerCase()));

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile if not explicitly toggled */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 224 : (isMobile ? 0 : 80),
          x: isMobile && !isSidebarOpen ? -224 : 0
        }}
        className={cn(
          "bg-gradient-to-b from-[#005BAA] to-[#1c4b82] border-r border-[#1c4b82] flex flex-col z-50 shrink-0 overflow-hidden shadow-[4px_0_15px_rgba(37,94,158,0.2)]",
          isMobile ? "fixed inset-y-0 left-0 shadow-2xl" : "relative"
        )}
      >
        <div className="p-4 flex flex-col gap-1 w-56 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-center mb-4">
             {(isSidebarOpen || !isMobile) ? (
               <div className="flex justify-center w-full">
                 <div className="w-24 h-16 bg-white/95 rounded-xl flex items-center justify-center border border-white/20 overflow-hidden p-1 shadow-md">
                   <img 
                     src="https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png" 
                     alt="VNPT Logo" 
                     className="w-full h-full object-contain"
                     referrerPolicy="no-referrer"
                   />
                 </div>
               </div>
             ) : (
               <div className="mx-auto w-16 h-12 bg-white/95 rounded-xl flex items-center justify-center border border-white/20 overflow-hidden p-1 shadow-md">
                 <img 
                   src="https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png" 
                   alt="VNPT Logo" 
                   className="w-full h-full object-contain"
                   referrerPolicy="no-referrer"
                 />
               </div>
             )}
          </div>
          
          {isSidebarOpen && <p className="text-[10px] font-bold text-green-300/80 uppercase tracking-widest mb-3 mt-2 ml-2 border-b border-green-400/20 pb-1">My Cockpit</p>}

          <nav className="space-y-1">
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 transition-all duration-200 group relative",
                  currentPage === item.id 
                    ? "bg-[#153460] text-white border-l-4 border-[#ffcd00] shadow-inner font-bold rounded-r-lg" 
                    : "text-blue-100 hover:bg-[#004a8b] hover:text-white rounded-lg border-l-4 border-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5", currentPage === item.id ? "text-[#ffcd00]" : "text-blue-100/80 group-hover:text-white")} />
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "text-[12px] tracking-wide text-left truncate block w-full",
                      currentPage === item.id ? "font-bold text-white drop-shadow-sm" : "font-medium"
                    )}
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/10 bg-[#0e2542]/50">
          <div className={cn("flex flex-col gap-4", isSidebarOpen ? "" : "items-center")}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/80 text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#ffcd00]/50 shadow-md">
                {(userName || 'NV').substring(0, 2).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate text-white drop-shadow-sm">{userName}</p>
                  <p className="text-[10px] text-blue-100/80/80 truncate uppercase font-medium">{userRole}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-blue-100/80 hover:bg-[#153460] hover:text-white",
                      isSidebarOpen ? "" : "justify-center"
                  )}
              >
                  <KeyRound className="w-5 h-5" />
                  {isSidebarOpen && <span className="text-[13px] font-medium">Đổi mật khẩu</span>}
              </button>
              
              <button
                  onClick={handleLogout}
                  className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-red-300 hover:bg-red-500/10 hover:text-red-200",
                      isSidebarOpen ? "" : "justify-center"
                  )}
              >
                  <LogOut className="w-5 h-5" />
                  {isSidebarOpen && <span className="text-[13px] font-medium">Thoát hệ thống</span>}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-tr from-[#edf3f8] via-[#f5f8fc] to-[#e4effa]">
        {/* Header */}
        <header className={cn(
          "bg-gradient-to-b from-[#fbfcff] to-[#e8f1f8] text-[#1c4b82] flex items-center justify-between px-6 border-b border-[#a0c5e8] shadow-sm z-40 shrink-0 relative overflow-hidden transition-all duration-300",
          isMobile && isScrollingDown ? "h-0 opacity-0 pointer-events-none" : "h-14 opacity-100"
        )}>
          {/* Glowing light blue system accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#005BAA] via-[#3b82f6] to-[#06b6d4] z-50 opacity-90" />
          
          <div className="flex items-center gap-4 relative z-10">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-[#1c4b82] hover:bg-black/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
            <h1 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 font-heading drop-shadow-sm">
              {menuItems.find(i => i.id === currentPage)?.label || 'Overview'}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger id="notification-trigger" className="relative cursor-pointer group outline-none border-none bg-transparent p-0 flex items-center justify-center w-8 h-8">
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-brand-orange text-[10px] font-black flex items-center justify-center rounded-full border-2 border-brand-indigo shadow-lg z-20 px-1 pointer-events-none text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.div
                  animate={unreadCount > 0 ? {
                    rotate: [0, -15, 15, -15, 15, 0],
                    transition: { repeat: Infinity, repeatDelay: 1.5, duration: 0.5 }
                  } : { rotate: 0 }}
                >
                  <Bell className="w-6 h-6 text-[#1c4b82] group-hover:scale-110 transition-transform duration-200 pointer-events-none" />
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] sm:w-96 rounded-3xl p-2 shadow-2xl border-slate-100 z-50" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black uppercase tracking-tight">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="bg-brand-orange/10 text-brand-orange text-[10px] px-2 py-0.5 rounded-full font-black">
                          {unreadCount} MỚI
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-[10px] font-black uppercase text-slate-400 hover:text-green-700"
                      onClick={() => notificationService.markAllAsRead()}
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Đã xem hết
                    </Button>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-100" />
                <ScrollArea className="h-[400px]">
                  <DropdownMenuGroup>
                    {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có thông báo nào</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 p-1">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={cn(
                            "group p-3 rounded-2xl transition-all duration-200 relative cursor-pointer",
                            notif.read ? "hover:bg-slate-50" : "bg-green-50/50 hover:bg-blue-50"
                          )}
                          onClick={() => {
                            notificationService.markAsRead(notif.id);
                            if (notif.actionUrl) onNavigate(notif.actionUrl);
                          }}
                        >
                          {!notif.read && (
                            <div className="absolute top-4 left-1.5 w-1.5 h-1.5 bg-brand-orange rounded-full" />
                          )}
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                              notif.read ? "bg-white border-slate-100" : "bg-white border-green-100 shadow-sm"
                            )}>
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h4 className={cn("text-xs uppercase tracking-tight truncate pr-2", notif.read ? "font-bold text-slate-600" : "font-black text-blue-700")}>
                                  {notif.title}
                                </h4>
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTimestamp(notif.timestamp)}
                                </span>
                              </div>
                              <p className={cn("text-[11px] leading-relaxed transition-all", notif.read ? "text-slate-500 font-medium" : "text-slate-700 font-bold", expandedNotifs.includes(notif.id) ? "line-clamp-none whitespace-pre-wrap" : "line-clamp-2")}>
                                {notif.message}
                              </p>
                              {notif.message.length > 50 && (
                                <button 
                                  onClick={(e) => toggleExpandNotif(e, notif.id)}
                                  className="text-[9px] text-green-600 hover:text-orange-600 font-black uppercase tracking-wider mt-1.5 transition-colors block"
                                >
                                  {expandedNotifs.includes(notif.id) ? "Thu gọn" : "Xem thêm"}
                                </button>
                              )}
                              <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notificationService.deleteNotification(notif.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </DropdownMenuGroup>
                </ScrollArea>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="p-3 justify-center text-xs font-black uppercase text-blue-700 hover:text-green-700 cursor-pointer rounded-2xl m-1 transition-colors">
                    Xem tất cả nhật ký
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-3 border-l border-[#a0c5e8] pl-6">
               <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-bold text-white drop-shadow-sm">{settings.shortName}</p>
                  <p className="text-[10px] text-blue-100 uppercase tracking-widest font-medium">VNPT Telecom v4.2</p>
               </div>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className={cn("flex-1 flex flex-col overflow-hidden p-4 md:p-6 bg-transparent transition-all duration-300", isMobile && (isScrollingDown ? "pb-4" : "pb-24"))}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation - Visible on mobile for employees */}
        {isMobile && (
          <div className={cn(
            "fixed left-0 right-0 h-[72px] bg-white border-t border-slate-200 flex items-center justify-between px-1 z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] transition-all duration-300",
            isScrollingDown ? "bottom-[-72px] opacity-0 pointer-events-none" : "bottom-0 opacity-100"
          )}>
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 rounded-xl transition-all h-full relative",
                  currentPage === item.id ? "text-green-600 bg-blue-50/80" : "text-slate-400 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", currentPage === item.id ? "text-brand-orange" : "text-slate-400")} />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate w-full px-1 text-center">{item.label}</span>
                {currentPage === item.id && <motion.div layoutId="bottomNav" className="absolute bottom-0 w-8 h-1 bg-brand-orange rounded-t-lg mx-auto" />}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
          )}
        </AnimatePresence>

        {/* Footer - Hidden on mobile to save space */}
        {!isMobile && (
          <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[10px] font-medium text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Server: SG-01 (Stable)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Cập nhật lúc: {new Date().toLocaleTimeString()}</span>
            <span className="text-blue-700 font-bold uppercase tracking-wider">VNPT technology & solutions</span>
          </div>
        </footer>
        )}
      </main>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-slate-50 p-6 border-b border-slate-100">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800">
              Đổi mật khẩu
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2 relative group">
              <Label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu mới</Label>
              <div className="relative">
                 <Input
                   type={showNewPassword ? "text" : "password"}
                   value={newPassword}
                   onChange={(e) => setNewPassword(e.target.value)}
                   className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:bg-white pr-12 transition-all font-medium"
                   placeholder="Nhập mật khẩu mới"
                 />
                 <button
                   type="button"
                   onClick={() => setShowNewPassword(!showNewPassword)}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-orange transition-colors"
                 >
                   {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">Thay đổi mật khẩu sẽ ghi đè lên mật khẩu hiện tại của bạn.</p>
          </div>
          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
            <div className="flex gap-2 w-full">
              <Button type="button" variant="ghost" onClick={() => setIsChangePasswordOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px]">
                Hủy bỏ
              </Button>
              <Button 
                type="button" 
                onClick={handleChangePassword}
                disabled={isChangingPass || !newPassword}
                className="flex-1 rounded-xl bg-brand-orange hover:bg-[#E65A1E] text-white font-bold uppercase text-[10px] items-center justify-center shadow-lg shadow-orange-100 transition-all"
              >
                {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Utility for cleaner conditional classes in this specific file if import not ready
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
