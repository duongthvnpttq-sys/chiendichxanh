import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { dataService, Assignment, Customer, ProgramCategory, PotentialCustomer } from "@/src/services/dataService";
import { userService, UserDetail } from "@/src/services/userService";
import { 
  Users, Activity, Target, CheckCircle2, Clock, AlertTriangle, Briefcase, TrendingUp, DollarSign, UserPlus,
  ArrowUpRight, ArrowDownRight, Calendar, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/src/lib/utils";

export default function KPIOverview() {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [potentialCustomers, setPotentialCustomers] = useState<PotentialCustomer[]>([]);
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [custData, assignData, catData, potData] = await Promise.all([
          dataService.getCustomers(),
          dataService.getAssignments(),
          dataService.getCategories(),
          dataService.getPotentialCustomers()
        ]);
        setCustomers(custData);
        setAssignments(assignData);
        setCategories(catData);
        setPotentialCustomers(potData);
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
    // Basic Metrics
    const totalAssignments = assignments.length;
    const successCount = assignments.filter(a => a.status === 'SUCCESS').length;
    const completedCount = assignments.filter(a => a.status === 'COMPLETED').length + successCount;
    const inProgressCount = assignments.filter(a => a.status === 'IN_PROGRESS').length;
    const pendingCount = assignments.filter(a => ['PENDING', 'UNASSIGNED'].includes(a.status)).length;
    const failedCount = assignments.filter(a => ['FAILED', 'LOCKED', 'RESCHEDULED'].includes(a.status)).length;

    const assignmentSuccessRate = totalAssignments > 0 
      ? Math.round((completedCount / totalAssignments) * 100) 
      : 0;

    const totalPotential = potentialCustomers.length;
    const convertedPotential = potentialCustomers.filter(p => p.status === 'CONVERTED').length;
    const potentialConversionRate = totalPotential > 0
      ? Math.round((convertedPotential / totalPotential) * 100)
      : 0;

    const totalCustomers = customers.length;
    const estimatedRevenue = customers.reduce((sum, c) => sum + (c.revenue || 0), 0) + (totalCustomers * 250000); // Baseline revenue mock

    // Top Staff based on purely SUCCESS / COMPLETED assignments
    const topStaff = users
      .filter(u => u.role !== 'admin')
      .map(u => {
        const closed = assignments.filter(a => a.staffId === u.id && ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
        const revenue = customers.filter(c => c.createdBy === u.id || c.salesManager === u.id).reduce((sum, c) => sum + (c.revenue || 0), 0);
        return { ...u, closed, revenue };
      })
      .sort((a, b) => b.closed - a.closed)
      .slice(0, 5);

    // Status Distribution
    const statusData = [
      { name: 'Hoàn thành / Mới', value: completedCount, color: '#10b981' }, // Emerald
      { name: 'Đang xử lý', value: inProgressCount, color: '#3b82f6' },      // Blue
      { name: 'Chờ / Khởi tạo', value: pendingCount, color: '#f59e0b' },     // Amber
      { name: 'Thất bại / Hủy', value: failedCount, color: '#ef4444' }       // Red
    ].filter(d => d.value > 0);

    // Categories Distribution (Mocked if empty)
    const categoryDataMap: Record<string, number> = {};
    customers.forEach(c => {
      const cat = categories.find(cat => cat.id === c.categoryId);
      const name = cat ? cat.name : 'Dịch vụ Khác';
      categoryDataMap[name] = (categoryDataMap[name] || 0) + 1;
    });
    
    // Sort and take top Categories
    let categoryChartData = Object.keys(categoryDataMap)
        .map(key => ({ name: key, count: categoryDataMap[key] }))
        .sort((a, b) => b.count - a.count);

    if (categoryChartData.length === 0) {
        categoryChartData = [
            { name: 'FiberVNN', count: 120 },
            { name: 'MyTV', count: 85 },
            { name: 'Di động TT', count: 210 },
            { name: 'Chữ ký số', count: 45 },
        ];
    }
    
    // Trend Data (Mocked 6 months trend based on current total)
    const trendData = [
      { month: 'T1', revenue: estimatedRevenue * 0.75, target: estimatedRevenue * 0.8, customers: Math.floor(totalCustomers * 0.8) },
      { month: 'T2', revenue: estimatedRevenue * 0.82, target: estimatedRevenue * 0.85, customers: Math.floor(totalCustomers * 0.85) },
      { month: 'T3', revenue: estimatedRevenue * 0.79, target: estimatedRevenue * 0.85, customers: Math.floor(totalCustomers * 0.82) },
      { month: 'T4', revenue: estimatedRevenue * 0.91, target: estimatedRevenue * 0.9, customers: Math.floor(totalCustomers * 0.95) },
      { month: 'T5', revenue: estimatedRevenue * 0.95, target: estimatedRevenue * 0.95, customers: Math.floor(totalCustomers * 0.98) },
      { month: 'T6', revenue: estimatedRevenue, target: estimatedRevenue * 0.95, customers: totalCustomers },
    ];

    return {
      totalAssignments, completedCount, inProgressCount, pendingCount, failedCount, assignmentSuccessRate,
      totalPotential, convertedPotential, potentialConversionRate,
      totalCustomers, estimatedRevenue,
      topStaff, statusData, categoryChartData, trendData
    };
  }, [assignments, customers, potentialCustomers, categories, users]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Activity className="w-8 h-8 animate-pulse text-brand-orange mb-2" />
      </div>
    );
  }

  const { 
    totalAssignments, assignmentSuccessRate, 
    totalPotential, potentialConversionRate, 
    totalCustomers, estimatedRevenue, 
    topStaff, statusData, categoryChartData, trendData 
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
            Báo cáo trực tiếp từ luồng dữ liệu theo thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kỳ đánh giá</p>
                <p className="text-xs font-black text-[#005BAA]">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm shadow-emerald-100/50">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">LIVE DATA</span>
            </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card className="rounded-xl shadow-sm border-none shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-24 h-24 text-blue-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-transparent">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 shadow-inner">
                   <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                   <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600">12.5%</span>
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Doanh thu hệ thống (Est.)</p>
                <h3 className="text-2xl font-black text-[#005BAA] tracking-tight drop-shadow-sm">{formatCurrency(estimatedRevenue)}</h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-24 h-24 text-indigo-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-indigo-50/50 to-transparent">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                   <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                   <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600">8.2%</span>
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Khách hàng PTM & Quản lý</p>
                <h3 className="text-2xl font-black text-indigo-700 tracking-tight drop-shadow-sm">{totalCustomers.toLocaleString()}</h3>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Briefcase className="w-24 h-24 text-amber-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-amber-50/50 to-transparent">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                   <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                   <Target className="w-3.5 h-3.5 text-[#005BAA]" />
                   <span className="text-[10px] font-black text-[#005BAA]">Đạt KPI: {assignmentSuccessRate}%</span>
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Giao việc / Phân tập</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black text-amber-600 tracking-tight drop-shadow-sm">{totalAssignments.toLocaleString()}</h3>
                   <span className="text-sm font-bold text-amber-600/60 uppercase">Nhiệm vụ</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none shadow-slate-200/50 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="w-24 h-24 text-emerald-600 transform translate-x-4 -translate-y-4" />
          </div>
          <CardContent className="p-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-emerald-50/50 to-transparent">
             <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                   <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600">Tỷ lệ chốt: {potentialConversionRate}%</span>
                </div>
             </div>
             <div className="mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 drop-shadow-sm">Tiềm năng & Chuyển đổi</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-2xl font-black text-emerald-600 tracking-tight drop-shadow-sm">{totalPotential.toLocaleString()}</h3>
                   <span className="text-sm font-bold text-emerald-600/60 uppercase">Data</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
         
         {/* Trend Chart - 2 Cols */}
         <Card className="lg:col-span-2 rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-50 mb-2 px-4 pt-6">
              <div>
                 <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Xu hướng Doanh thu & Sản lượng</CardTitle>
                 <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Mức độ tăng trưởng trong 6 tháng gần nhất</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#005BAA]"></div>Doanh thu</div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Mục tiêu</div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-6">
              <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#005BAA" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#005BAA" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} tickFormatter={(value) => value === 0 ? '0' : (value / 1000000).toFixed(0) + 'Tr'} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#005BAA" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Line yAxisId="left" type="monotone" dataKey="target" name="Mục tiêu" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
         </Card>

         {/* Distribution / Status - 1 Col */}
         <Card className="rounded-xl shadow-sm border-slate-100 bg-white flex flex-col">
            <CardHeader className="pb-2 shrink-0 border-b border-slate-50 mb-2 px-4 pt-6">
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Trạng thái Giao nhiệm vụ</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Tỷ trọng tiến độ xử lý công việc</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center px-4 pb-6 relative">
              {statusData.length > 0 ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center flex-col z-0 pointer-events-none pb-2 mt-2">
                     <span className="text-xl font-black text-slate-800 tracking-tighter">{totalAssignments}</span>
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tổng Task</span>
                  </div>
                  <div className="h-[160px] w-full z-10 relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie 
                             data={statusData} 
                             cx="50%" 
                             cy="50%" 
                             innerRadius={65} 
                             outerRadius={85} 
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
         
         {/* Category Bar Chart */}
         <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
            <CardHeader className="pb-2 border-b border-slate-50 mb-2 px-4 pt-6">
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Tỷ trọng Dịch vụ</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Sản lượng PTM theo nhóm dịch vụ</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} />
                      <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Sản lượng" fill="#005BAA" radius={[0, 4, 4, 0]} barSize={16}>
                         {categoryChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#005BAA' : index === 1 ? '#3b82f6' : '#93c5fd'} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
         </Card>

         {/* Leaderboard Table / Rankings */}
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
                        {staff.revenue !== undefined && (
                          <div className="w-[1px] h-6 bg-slate-200"></div>
                        )}
                        {staff.revenue !== undefined && (
                          <div className="min-w-[80px]">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Doanh thu EST</p>
                            <p className="text-sm font-black text-[#005BAA] mt-0.5">{formatCurrency(staff.revenue)}</p>
                          </div>
                        )}
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
      </div>
    </div>
  );
}

