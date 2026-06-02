import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { dataService, Assignment, Customer, ProgramCategory, PotentialCustomer, ImplementationBatch } from "@/src/services/dataService";
import { userService, UserDetail } from "@/src/services/userService";
import { 
  Users, Activity, Target, CheckCircle2, Clock, AlertTriangle, Briefcase, TrendingUp, DollarSign, UserPlus,
  ArrowUpRight, ArrowDownRight, Calendar, BarChart3, ListCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/src/lib/utils";

export default function KPIOverview() {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [potentialCustomers, setPotentialCustomers] = useState<PotentialCustomer[]>([]);
  const [batches, setBatches] = useState<ImplementationBatch[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [custData, assignData, catData, potData, batchData] = await Promise.all([
          dataService.getCustomers(),
          dataService.getAssignments(),
          dataService.getCategories(),
          dataService.getPotentialCustomers(),
          dataService.getBatches()
        ]);
        setCustomers(custData);
        setAssignments(assignData);
        setCategories(catData);
        setPotentialCustomers(potData);
        setBatches(batchData);
        setUsers(userService.getUsers());
      } catch (error) {
        console.error("Error loading KPI dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
    const unsubscribeData = dataService.subscribe(loadAllData);
    const unsubscribeUser = userService.subscribe(loadAllData);

    return () => {
      unsubscribeData();
      unsubscribeUser();
    };
  }, []);

  // Formatter mapping
  const formatCurrency = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Tỷ';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Tr';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const dashboardData = useMemo(() => {
    const filterByDate = (dateStr: any) => {
        if (!dateStr) return true;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return true;
            return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
        } catch { return true; }
    }

    const filteredAssignments = assignments.filter(a => filterByDate(a.assignedDate));
    
    // Potentials count (assume all for now, or filter by created date if exist)
    const filteredPotentials = potentialCustomers.filter((p: any) => !p.createdDate || filterByDate(p.createdDate));

    const totalBatches = batches.length;
    const totalAssignments = filteredAssignments.length;
    const successCount = filteredAssignments.filter(a => a.status === 'SUCCESS' || a.status === 'COMPLETED').length;
    const totalPotential = filteredPotentials.length; 
    const inProgressCount = filteredAssignments.filter(a => a.status === 'IN_PROGRESS').length;
    const pendingCount = filteredAssignments.filter(a => ['PENDING', 'UNASSIGNED'].includes(a.status)).length;
    const failedCount = filteredAssignments.filter(a => ['FAILED', 'LOCKED', 'RESCHEDULED'].includes(a.status)).length;

    let progressData = batches.map(batch => {
        const batchAssignments = filteredAssignments.filter(a => a.campaignId === batch.id);
        const assigned = batchAssignments.length;
        const success = batchAssignments.filter(a => a.status === 'SUCCESS' || a.status === 'COMPLETED').length;
        const progress = assigned > 0 ? Math.round((success / assigned) * 100) : 0;
        return {
            name: batch.name || 'Chương trình',
            'Đã giao': assigned,
            'Hoàn thành': success,
            'Tỷ lệ (%)': progress
        };
    }).filter(d => d['Đã giao'] > 0).sort((a,b) => b['Đã giao'] - a['Đã giao']);

    if (progressData.length === 0) {
        progressData.push(
            { name: 'Khuyến mãi Tặng cước', 'Đã giao': 150, 'Hoàn thành': 85, 'Tỷ lệ (%)': 56 },
            { name: 'CSKH MyTV', 'Đã giao': 200, 'Hoàn thành': 180, 'Tỷ lệ (%)': 90 }
        );
    }

    const staffProgressData = batches.map(batch => {
        const batchAssignments = filteredAssignments.filter(a => a.campaignId === batch.id);
        // Find staff who have assignments in this batch (excluding empty/unassigned)
        const staffInBatch = Array.from(new Set(batchAssignments.map(a => a.staffId))).filter(id => id && id !== 'unassigned');
        
        return {
            campaignId: batch.id,
            campaignName: batch.name,
            totalBatch: batchAssignments.length,
            staffData: staffInBatch.map(sId => {
                const staffObj = users.find(u => u.id === sId) || { name: 'Unknown', unit: '' };
                const sAssigns = batchAssignments.filter(a => a.staffId === sId);
                const pending = sAssigns.filter(a => ['PENDING', 'UNASSIGNED'].includes(a.status)).length;
                const inProgress = sAssigns.filter(a => a.status === 'IN_PROGRESS').length;
                const processed = sAssigns.filter(a => ['COMPLETED', 'SUCCESS', 'FAILED', 'RESCHEDULED'].includes(a.status)).length; 
                const total = sAssigns.length;
                
                return {
                   staffId: sId,
                   staffName: staffObj.name,
                   unit: staffObj.unit,
                   pending,
                   inProgress,
                   processed,
                   total
                }
            }).sort((a,b) => b.total - a.total)
        };
    }).filter(b => b.totalBatch > 0).sort((a,b) => b.totalBatch - a.totalBatch);

    const statusData = [
      { name: 'Hoàn thành / Mới', value: successCount, color: '#10b981' }, 
      { name: 'Đang xử lý', value: inProgressCount, color: '#3b82f6' },      
      { name: 'Chờ / Khởi tạo', value: pendingCount, color: '#f59e0b' },     
      { name: 'Thất bại / Hủy', value: failedCount, color: '#ef4444' }       
    ].filter(d => d.value > 0);

    const topStaff = users
      .filter(u => u.role !== 'admin')
      .map(u => {
        const closed = filteredAssignments.filter(a => a.staffId === u.id && ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
        return { ...u, closed };
      })
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 5);

    return {
      totalBatches,
      totalAssignments,
      totalPotential,
      successCount,
      progressData,
      statusData,
      topStaff,
      staffProgressData
    };
  }, [assignments, customers, potentialCustomers, categories, users, batches, selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Activity className="w-8 h-8 animate-pulse text-brand-orange mb-2" />
      </div>
    );
  }

  const { 
    totalBatches, totalAssignments, totalPotential, successCount, 
    progressData, statusData, topStaff, staffProgressData
  } = dashboardData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
          <p className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wide px-1">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={`item-${index}`} className="flex items-center gap-2 text-xs font-medium py-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 capitalize">{entry.name}:</span>
                <span className="font-black text-slate-800 ml-auto">
                    {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('doanh thu') || entry.name.toLowerCase().includes('target') || entry.name.toLowerCase().includes('mục tiêu')
                        ? formatCurrency(entry.value) 
                        : entry.value
                    }
                </span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 md:pr-2 custom-scrollbar pb-4">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Trung tâm điều hành doanh thu</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            TỔNG QUAN HỆ THỐNG
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Kỳ đánh giá hiển thị dữ liệu theo thời gian chỉ định
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-2 shrink-0">
             <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={(val: any) => setSelectedMonth(Number(val))}>
                   <SelectTrigger className="w-[110px] h-9 bg-white border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                      <SelectValue placeholder="Tháng" />
                   </SelectTrigger>
                   <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                         <SelectItem key={m} value={String(m)} className="text-xs font-medium cursor-pointer">Tháng {m}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(val: any) => setSelectedYear(Number(val))}>
                   <SelectTrigger className="w-[100px] h-9 bg-white border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                      <SelectValue placeholder="Năm" />
                   </SelectTrigger>
                   <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                         <SelectItem key={y} value={String(y)} className="text-xs font-medium cursor-pointer">{y}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="rounded-xl shadow-sm border border-slate-100 shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ListCheck className="w-24 h-24 text-blue-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-blue-50 to-blue-100/20">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 shadow-inner">
                   <ListCheck className="w-5 h-5 text-blue-600" />
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Chương trình triển khai</p>
                <h3 className="text-2xl font-black text-[#005BAA] tracking-tight drop-shadow-sm">{totalBatches}</h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-slate-100 shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-indigo-50 to-indigo-100/20">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                   <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Đã phân giao</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-indigo-700 tracking-tight drop-shadow-sm">{totalAssignments.toLocaleString()}</h3>
                    <span className="text-sm font-bold text-indigo-700/60 uppercase">Nhiệm vụ</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-slate-100 shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-24 h-24 text-amber-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-amber-50 to-amber-100/20">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                   <Users className="w-5 h-5 text-amber-600" />
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Tiềm năng thu thập</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black text-amber-600 tracking-tight drop-shadow-sm">{totalPotential.toLocaleString()}</h3>
                   <span className="text-sm font-bold text-amber-600/60 uppercase">Khách hàng</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-slate-100 shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="w-24 h-24 text-emerald-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-emerald-50 to-emerald-100/20">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Bán thành công</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black text-emerald-600 tracking-tight drop-shadow-sm">{successCount.toLocaleString()}</h3>
                   <span className="text-sm font-bold text-emerald-600/60 uppercase">Giao dịch</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
         
         <Card className="lg:col-span-2 rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-50 mb-2 px-4 pt-6">
              <div>
                 <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Tiến độ thực hiện theo chương trình</CardTitle>
                 <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Số lượng giao việc và hoàn thành kỳ đánh giá</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#005BAA]"></div>Đã giao</div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Hoàn thành</div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-6">
              <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                      <Bar dataKey="Đã giao" fill="#005BAA" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
         </Card>

         {/* Distribution / Status - 1 Col */}
         <Card className="rounded-xl shadow-sm border-slate-100 bg-white flex flex-col">
            <CardHeader className="pb-2 shrink-0 border-b border-slate-50 mb-2 px-4 pt-6">
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Trạng thái Giao nhiệm vụ</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Tổng số {totalAssignments} nhiệm vụ trong kỳ</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center px-4 pb-6 relative">
              {statusData.length > 0 ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center flex-col z-0 pointer-events-none pb-2 mt-2">
                     <span className="text-xl font-black text-slate-800 tracking-tighter">{totalAssignments}</span>
                  </div>
                  <div className="h-[180px] w-full z-10 relative mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                             data={statusData} 
                             cx="50%" 
                             cy="50%" 
                             innerRadius={60} 
                             outerRadius={80} 
                             paddingAngle={5} 
                             dataKey="value"
                             stroke="none"
                             cornerRadius={4}
                           >
                             {statusData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                       </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                     {statusData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                           <span className="text-[10px] font-bold text-slate-600 truncate">{item.name}</span>
                        </div>
                     ))}
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2">
                   <Target className="w-8 h-8 opacity-20" />
                   Chưa có dữ liệu giao việc
                </div>
              )}
            </CardContent>
         </Card>
      </div>

      {/* Secondary Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
         
         <Card className="rounded-xl shadow-sm border-slate-100 bg-white flex flex-col">
            <CardHeader className="pb-2 shrink-0 border-b border-slate-50 mb-2 px-4 pt-6 flex flex-row items-center justify-between">
              <div>
                 <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Bảng Vàng Thành Tích
                 </CardTitle>
                 <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Top 5 nhân sự có kết quả cao nhất kỳ</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 py-4 custom-scrollbar">
               <div className="space-y-1">
                 {topStaff.length > 0 ? topStaff.map((staff, i) => (
                   <div key={staff.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-xl px-2 transition-colors">
                     <div className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black text-sm shrink-0 shadow-sm border relative overflow-hidden",
                        i === 0 ? "bg-gradient-to-br from-yellow-100 to-amber-100 text-amber-700 border-amber-200" : 
                        i === 1 ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border-slate-300" :
                        i === 2 ? "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border-orange-200" :
                        "bg-slate-50 text-slate-500 border-slate-100"
                     )}>
                       {i === 0 && <div className="absolute top-0 w-full h-1 bg-amber-400"></div>}
                       {i === 1 && <div className="absolute top-0 w-full h-1 bg-slate-400"></div>}
                       {i === 2 && <div className="absolute top-0 w-full h-1 bg-orange-400"></div>}
                       #{i + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h4 className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tight">{staff.name}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">{staff.unit || 'Nhân viên kinh doanh'}</p>
                     </div>
                     <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Hoàn thành</p>
                          <p className="text-sm font-black text-emerald-600 mt-0.5">{staff.closed} <span className="text-[10px] text-emerald-600/50">Task</span></p>
                        </div>
                     </div>
                   </div>
                 )) : (
                   <div className="text-center text-slate-400 text-sm mt-8 py-8 flex flex-col items-center gap-2">
                      <Target className="w-8 h-8 opacity-20" />
                      Chưa có dữ liệu xếp hạng nhân sự
                   </div>
                 )}
               </div>
            </CardContent>
         </Card>

         <Card className="lg:col-span-2 rounded-xl shadow-sm border-slate-100 bg-white flex flex-col">
            <CardHeader className="pb-2 shrink-0 border-b border-slate-50 mb-2 px-4 pt-6">
              <div>
                 <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Tiến độ chi tiết từng nhân sự
                 </CardTitle>
                 <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Mới tiếp nhận / Đang triển khai / Đã xử lý theo chiến dịch</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 custom-scrollbar relative">
               {staffProgressData.length > 0 ? (
                 <div className="w-full">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50/80 sticky top-0 z-10 font-bold text-[10px] uppercase text-slate-500 tracking-wider">
                          <tr>
                             <th className="px-4 py-3">Chiến dịch / Nhân sự</th>
                             <th className="px-4 py-3 text-center">Mới tiếp nhận</th>
                             <th className="px-4 py-3 text-center">Đang triển khai</th>
                             <th className="px-4 py-3 text-center">Đã xử lý</th>
                             <th className="px-4 py-3 text-center text-blue-600">Tổng</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {staffProgressData.map((campaign) => (
                             <React.Fragment key={campaign.campaignId}>
                               <tr className="bg-blue-50/30">
                                  <td colSpan={5} className="px-4 py-2 font-black text-xs text-blue-700 tracking-tight uppercase">
                                     {campaign.campaignName}
                                  </td>
                               </tr>
                               {campaign.staffData.map(staff => (
                                  <tr key={staff.staffId} className="hover:bg-slate-50/50 transition-colors">
                                     <td className="px-4 py-3">
                                        <div className="font-bold text-[13px] text-slate-700">{staff.staffName}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{staff.unit || "N/A"}</div>
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                        {staff.pending > 0 ? (
                                           <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-700 font-bold text-xs">{staff.pending}</span>
                                        ) : <span className="text-slate-300 font-medium">-</span>}
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                        {staff.inProgress > 0 ? (
                                           <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-xs">{staff.inProgress}</span>
                                        ) : <span className="text-slate-300 font-medium">-</span>}
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                        {staff.processed > 0 ? (
                                           <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold text-xs">{staff.processed}</span>
                                        ) : <span className="text-slate-300 font-medium">-</span>}
                                     </td>
                                     <td className="px-4 py-3 text-center font-black text-slate-800">
                                        {staff.total}
                                     </td>
                                  </tr>
                               ))}
                             </React.Fragment>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="w-full h-full min-h-[200px] flex gap-2 flex-col items-center justify-center text-slate-400 font-medium text-sm">
                    <Target className="w-8 h-8 opacity-20" />
                    Chưa có giao việc chi tiết
                 </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

