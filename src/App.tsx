import { getRoutePermissions } from "@/src/services/permissionService";
import React, { useState, useEffect } from "react";
import VNPTLayout from "./components/layout/VNPTLayout";
import KPIOverview from "./components/dashboard/KPIOverview";
import MyTasks from "./components/tasks/MyTasks";
import UserAssignments from "./components/assignments/UserAssignments";
import UserManagement from "./components/users/UserManagement";
import UnitSettings from "./components/settings/UnitSettings";
import ArchiveHistory from "./components/archive/ArchiveHistory";
import PotentialCustomers from "./components/potential/PotentialCustomers";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";
import { Lock, User as UserIcon, Loader2, Eye, EyeOff, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authService, UserRole, UserProfile } from "./services/authService";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  
  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
          if (savedUser.role !== 'admin' && savedUser.role !== 'manager') {
              if (currentPage === 'users' || currentPage === 'settings') {
                  setCurrentPage('dashboard');
              }
          }
        }
      } catch (e) {
        console.error("Lỗi khi kiểm tra đăng nhập:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }

    setIsLoggingIn(true);
    try {
      const loggedInUser = await authService.login(email, password, rememberMe);
      setUser(loggedInUser);
      if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'manager') {
         setCurrentPage('dashboard');
      }
      toast.success("Đăng nhập thành công qua hệ thống xác thực!");
    } catch (error: any) {
      toast.error(error.message || "Lỗi đăng nhập không xác định");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-32 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center p-3"
        >
          <img 
            src="https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png" 
            alt="VNPT Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] relative overflow-x-hidden font-sans flex items-center justify-center p-4">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-[#0ea5e9]/20 to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Left Column: VNPT HEART Graphic */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex flex-col items-center justify-center"
          >
            <div className="relative w-64 h-64 flex items-center justify-center">
               {/* Heart glowing effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full blur-2xl opacity-40 animate-pulse" />
               <div className="relative bg-white/90 backdrop-blur-sm w-48 h-48 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-6 border border-white/50 transform rotate-[-5deg]">
                 <Heart className="w-20 h-20 text-red-600 fill-current mb-2" />
                 <h2 className="text-xl font-black text-[#005BAA] tracking-tighter shadow-sm whitespace-nowrap uppercase">
                    VNPT <span className="text-red-600">HEART</span>
                 </h2>
               </div>
            </div>
          </motion.div>

          {/* Center Column: Login Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full max-w-[400px] mx-auto"
          >
            {/* Logo */}
            <div className="mb-8 w-40">
               <img 
                 src="https://logoeps.com/wp-content/uploads/2013/06/vnpt-eps-vector-logo.png" 
                 alt="VNPT Logo" 
                 className="w-full object-contain"
                 referrerPolicy="no-referrer"
               />
            </div>

            <Card className="w-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border-white p-4 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-xl">
              <CardContent className="space-y-6 pt-4 pb-2 px-2 sm:px-4">
                
                <form onSubmit={handleLogin} className="space-y-4">
                   <div className="relative">
                     <Input 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Tên truy nhập / Email" 
                          className="h-12 bg-[#f0f7ff] border-blue-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#005BAA] transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                     />
                   </div>
                   <div className="relative group">
                     <Input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mật khẩu" 
                          className="pr-12 h-12 bg-[#f0f7ff] border-blue-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#005BAA] transition-all font-medium text-slate-700 placeholder:text-slate-400" 
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#005BAA] transition-colors"
                     >
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                   
                   <Button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full h-12 mt-2 bg-gradient-to-r from-[#005BAA] to-[#007dd6] hover:from-[#004a8b] hover:to-[#006abc] text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] uppercase tracking-wide"
                   >
                      {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng nhập"}
                   </Button>
                </form>


              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: HEART Values */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex flex-col gap-6 pl-8"
          >
             {[
               { letter: 'H', title: 'Hợp tác cùng vươn cao', subtitle: 'Higher Together' },
               { letter: 'E', title: 'Thấu hiểu & Chia sẻ', subtitle: 'Empathy & Sharing' },
               { letter: 'A', title: 'Sáng tạo không giới hạn', subtitle: 'Audacious Innovation' },
               { letter: 'R', title: 'Phụng sự để kiến tạo', subtitle: 'Responsible Future Creation' },
               { letter: 'T', title: 'Khách hàng là trái tim', subtitle: 'True Customer Centricity' }
             ].map((item, idx) => (
               <div key={item.letter} className="flex items-center gap-4 relative group">
                  <div className="absolute right-full mr-4 w-32 h-[1px] bg-gradient-to-r from-transparent to-blue-300 opacity-50" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#005BAA] to-[#3b82f6] text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20 shrink-0 border-2 border-white group-hover:scale-110 transition-transform">
                     {item.letter}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#005BAA]">{item.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                  </div>
               </div>
             ))}
          </motion.div>
          
        </div>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <VNPTLayout 
      userRole={user.role} 
      userName={user.displayName || user.email || "Người dùng"}
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
    >
      {renderPage(currentPage, setCurrentPage, user.role)}
      <Toaster position="top-right" richColors />
    </VNPTLayout>
  );
}

function renderPage(page: string, onNavigate: (page: string) => void, userRole: string) {
  const allowedRoles = getRoutePermissions()[page] || ['ADMIN'];
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 rounded-3xl m-6 border border-dashed border-slate-200">
        <Lock className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-black uppercase text-slate-700 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Tính năng này được kiểm soát bởi phân quyền hệ thống.</p>
        <Button onClick={() => onNavigate('dashboard')} variant="outline" className="mt-6 border-slate-200 uppercase font-bold text-xs tracking-wider">
          Quay lại màn hình chính
        </Button>
      </div>
    );
  }

  switch (page) {
    case 'dashboard':
      return <KPIOverview />;
    case 'users':
      return <UserManagement />;
    case 'tasks':
      return <MyTasks />;
    case 'assignments':
      return <UserAssignments mode="ASSIGN" onNavigate={onNavigate} />;
    case 'customers':
      return <UserAssignments mode="LIST" onNavigate={onNavigate} />; // Reusing the list view
    case 'archive':
      return <ArchiveHistory />;
    case 'potential':
      return <PotentialCustomers />;
    case 'settings':
      return <UnitSettings />;
    default:
      return <KPIOverview />;
  }
}
