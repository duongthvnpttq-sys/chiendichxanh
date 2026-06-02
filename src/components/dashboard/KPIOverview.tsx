import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { dataService, Assignment, ImplementationBatch } from "@/src/services/dataService";
import { userService, UserDetail } from "@/src/services/userService";
import { Bell, Calendar, User, Clock, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/src/lib/utils";

export default function KPIOverview() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(4); // default as in screenshot
  const [selectedYear, setSelectedYear] = useState(2026);
  const [mode, setMode] = useState<'lãnh_đạo' | 'cá_nhân'>('lãnh_đạo');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [assignData] = await Promise.all([
          dataService.getAssignments(),
        ]);
        setAssignments(assignData);
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

  const dData = useMemo(() => {
    // 1. Nhiệm vụ giao và thực hiện (Assignments)
    const currentMonthAssignments = assignments.filter((a: any) => {
        try {
            if (!a.assignedDate) return true;
            const d = new Date(a.assignedDate);
            return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
        } catch { return true; }
    });

    const yearlyAssignments = assignments.filter((a: any) => {
        try {
            if (!a.assignedDate) return true;
            return new Date(a.assignedDate).getFullYear() === selectedYear;
        } catch { return true; }
    });

    const total = yearlyAssignments.length;
    const completed = yearlyAssignments.filter(a => ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
    const incomplete = total - completed;
    
    // Nhiệm vụ tháng
    const pendingMonth = currentMonthAssignments.filter(a => ['PENDING', 'UNASSIGNED'].includes(a.status)).length;
    const inProgressMonth = currentMonthAssignments.filter(a => a.status === 'IN_PROGRESS').length;
    const completedMonth = currentMonthAssignments.filter(a => ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
    const failedMonth = currentMonthAssignments.filter(a => ['FAILED'].includes(a.status)).length;
    const pieTotal = pendingMonth + inProgressMonth + completedMonth + failedMonth;
    
    // Month pie data
    const pieData = pieTotal > 0 ? [
      { name: 'Mới tiếp nhận / Chờ', value: pendingMonth, color: '#ff9800', pct: Math.round((pendingMonth/pieTotal)*100) },
      { name: 'Đang triển khai', value: inProgressMonth, color: '#0052cc', pct: Math.round((inProgressMonth/pieTotal)*100) },
      { name: 'Đã xử lý thành công', value: completedMonth, color: '#0bb720', pct: Math.round((completedMonth/pieTotal)*100) },
      { name: 'Đã xử lý thất bại', value: failedMonth, color: '#e74c3c', pct: Math.round((failedMonth/pieTotal)*100) }
    ].filter(d => d.value > 0) : [{ name: 'Chưa có DL', value: 1, color: '#ecf0f1', pct: 100 }];

    if (pieData.length === 1 && pieData[0].name === 'Chưa có DL') {
        pieData[0].value = 1;
    }

    const staffOnly = users.filter(u => u.role !== 'admin');
    const totalStaff = staffOnly.length || 1;

    const topStaffRaw = staffOnly.map((u) => {
        const closed = currentMonthAssignments.filter(a => a.staffId === u.id && ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
        const totalStaffAssigns = currentMonthAssignments.filter(a => a.staffId === u.id).length;
        return { ...u, closed, totalStaffAssigns };
      }).sort((a, b) => b.closed - a.closed).slice(0, 5);
      
    const topStaff = topStaffRaw.map((s, i) => ({
        name: s.name, 
        unit: s.unit || 'Phòng ban', 
        score: s.closed, 
        total: s.totalStaffAssigns,
        avatar: `https://i.pravatar.cc/150?u=${s.id}`
    }));

    // Nhiệm vụ sắp hết hạn hoặc quá hạn
    const deadlineTasks = currentMonthAssignments
      .filter(a => a.deadline && ['PENDING', 'IN_PROGRESS'].includes(a.status))
      .map(a => {
         const d = new Date(a.deadline!);
         const now = new Date();
         const diffTime = d.getTime() - now.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return {
            ...a,
            diffDays,
            isOverdue: diffDays < 0
         };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 3); // Lấy 3 việc

    const unassignedCount = currentMonthAssignments.filter(a => ['UNASSIGNED'].includes(a.status)).length;

    // Đánh giá chất lượng thực tế
    const qtyTotal = completedMonth + failedMonth;
    const qualitySuccess = completedMonth;
    const qualityFailed = failedMonth;
    const progressTotal = pieTotal; // tất cả
    const progressOnTime = currentMonthAssignments.filter(a => ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
    const progressLate = currentMonthAssignments.filter(a => ['FAILED'].includes(a.status)).length;
    const progressInProgress = inProgressMonth;

    // Đánh giá User:
    const evalNotDone = Math.floor(totalStaff * 0.1) || 0;
    const evalPendingSelf = Math.floor(totalStaff * 0.4) || 0;
    const evalPendingMgmt = Math.floor(totalStaff * 0.2) || 0;
    const evalRankWait = totalStaff - evalNotDone - evalPendingSelf - evalPendingMgmt;

    return { 
        total, completed, incomplete, 
        pieData, topStaff, pieTotal, 
        deadlineTasks,
        pendingMonth, inProgressMonth, completedMonth, failedMonth, unassignedCount,
        qtyTotal, qualitySuccess, qualityFailed,
        progressTotal, progressOnTime, progressLate, progressInProgress,
        totalStaff, evalNotDone, evalPendingSelf, evalPendingMgmt, evalRankWait
    };
  }, [assignments, users, selectedMonth, selectedYear]);

  return (
    <div className="w-full max-w-[1400px] mx-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-10 font-sans px-2">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 py-4 rounded-xl">
        <h1 className="text-[22px] font-bold text-[#1a3b5c] uppercase">DASHBOARD</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[110px] h-10 bg-white border-slate-200">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[90px] h-10 bg-white border-slate-200">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-md overflow-hidden text-sm border border-red-700 h-10 ml-2">
             <button 
                onClick={() => setMode('lãnh_đạo')}
                className={cn("px-4 py-1.5 font-bold transition-colors", mode === 'lãnh_đạo' ? "bg-[#b82618] text-white" : "bg-[#c62828] text-white/80")}
             >Lãnh đạo</button>
             <button 
                onClick={() => setMode('cá_nhân')}
                className={cn("px-4 py-1.5 font-bold transition-colors", mode === 'cá_nhân' ? "bg-[#b82618] text-white" : "bg-white text-slate-700 border-l border-red-700")}
             >Cá nhân</button>
          </div>

          <button className="flex items-center gap-2 px-4 h-10 bg-[#c62828] text-white font-bold rounded-md text-sm border border-red-700 hover:bg-[#b82618] transition-colors ml-2 shadow-sm">
             <Bell className="w-4 h-4 fill-white" /> 
             Nhắc việc <span className="bg-white text-[#c62828] rounded-full w-5 h-5 flex items-center justify-center text-[11px]">{dData.deadlineTasks.length}</span>
          </button>
        </div>
      </div>

      {/* =========== ROW 1 =========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
         
         {/* TỔNG SỐ KHÁCH HÀNG TIỀM NĂNG */}
         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <h2 className="text-center text-sm font-bold text-slate-800 uppercase mb-2 text-opacity-90">Khách hàng tiềm năng năm {selectedYear}</h2>
            <div className="text-center font-bold text-[42px] text-[#c62828] mb-6">{dData.total}</div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-[#fdf3f2] p-3 rounded-lg border border-red-50">
                  <div className="flex items-center gap-2">
                     <CheckCircle className="w-5 h-5 text-emerald-600" />
                     <span className="font-bold text-sm text-slate-700">Đã chốt đơn / Hợp đồng</span>
                  </div>
                  <span className="font-bold text-xl text-emerald-600">{dData.completed}</span>
               </div>
               <div className="flex justify-between items-center bg-[#fdf3f2] p-3 rounded-lg border border-red-50">
                  <div className="flex items-center gap-2">
                     <FileText className="w-5 h-5 text-red-500" />
                     <span className="font-bold text-sm text-slate-700">Thất bại / Đang xử lý</span>
                  </div>
                  <span className="font-bold text-xl text-[#f39c12]">{dData.incomplete}</span>
               </div>
            </div>

            <div className="mt-8">
               <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden mb-2">
                  <div className="bg-[#005BAA] h-full" style={{ width: `${dData.total > 0 ? ((dData.completed/dData.total)*100) : 0}%` }}></div>
                  <div className="bg-red-500 h-full" style={{ width: `${dData.total > 0 ? ((dData.incomplete/dData.total)*100) : 0}%` }}></div>
               </div>
               <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#005BAA]">{dData.completed} <span className="text-slate-500 font-medium">Chốt đơn</span></span>
                  <span className="text-red-500">{dData.incomplete} <span className="text-slate-500 font-medium">Trượt</span></span>
               </div>
            </div>
         </Card>

         {/* NHIỆM VỤ THÁNG */}
         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 relative hover:shadow-md transition-shadow">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Nhiệm vụ tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</h2>
            <p className="text-xl font-bold text-[#c62828] mb-4">{dData.pieTotal} <span className="text-sm font-medium text-slate-600">Nhiệm vụ</span></p>
            
            <div className="h-[200px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={dData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                     >
                        {dData.pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               {/* Custom Data Labels pointing out exactly like the image */}
               <div className="absolute top-[10%] left-[5%] text-[11px] text-center w-20">
                  <div className="font-bold text-[#ff9800]">{dData.pieData[0].value} ({dData.pieData[0].pct}%)</div>
                  <div className="text-slate-600 leading-tight mt-0.5">Nhiệm vụ chờ thực hiện</div>
               </div>
               <div className="absolute top-[10%] right-[10%] text-[11px] text-center w-24">
                  <div className="font-bold text-[#0bb720]">{dData.pieData[2].value} ({dData.pieData[2].pct}%)</div>
                  <div className="text-slate-600 leading-tight mt-0.5">Nhiệm vụ đã hoàn thành</div>
               </div>
               <div className="absolute bottom-[0%] left-[20%] text-[11px] text-center w-24">
                  <div className="font-bold text-[#0052cc]">{dData.pieData[1].value} ({dData.pieData[1].pct}%)</div>
                  <div className="text-slate-600 leading-tight mt-0.5">Nhiệm vụ đang thực hiện</div>
               </div>
            </div>
         </Card>

         {/* SẮP HET HẠN */}
         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow flex flex-col">
            <h2 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-1">
               Nhiệm vụ sắp hết hạn tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear} <span className="bg-[#c62828] text-white text-[11px] px-1.5 py-0.5 rounded-full ml-1">04</span>
            </h2>
            
            <div className="flex-1 space-y-4 pt-2">
               {dData.deadlineTasks.length === 0 && (
                  <div className="text-[12px] text-slate-500 italic mt-8 text-center">Không có nhiệm vụ nào sắp hết hạn.</div>
               )}
               {dData.deadlineTasks.map((t, i) => (
                   <div key={t.id || i} className="relative pl-4 border-l-2 border-slate-100">
                      <div className={cn("absolute -left-[5px] top-1 w-2 h-2 rounded-full", t.isOverdue ? "bg-red-500" : "bg-[#005BAA]")}></div>
                      <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-1">{t.outcome || 'Nhiệm vụ chưa cập nhật chi tiết'}</h3>
                      <div className="flex justify-between items-center mt-2">
                         <div className="text-[11px] text-slate-500 space-y-1">
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Hạn: {new Date(t.deadline!).toLocaleDateString('vi-VN')}</div>
                            <div className="flex items-center gap-1"><User className="w-3 h-3" /> Nhân sự: {users.find(u => u.id === t.staffId)?.name || 'Chưa gán'}</div>
                         </div>
                         <span className={cn("px-2 py-0.5 border text-[10px] font-bold rounded-full", 
                             t.isOverdue ? "border-red-500 text-red-500 bg-red-50" : "border-[#005BAA] text-[#005BAA] bg-[#005BAA]/5"
                         )}>
                             {t.isOverdue ? `Quá hạn ${Math.abs(t.diffDays)} ngày` : `Còn hạn ${t.diffDays} ngày`}
                         </span>
                      </div>
                   </div>
               ))}
            </div>
         </Card>
      </div>

      {/* =========== ROW 2 =========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
         <Card className="lg:col-span-2 rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-3">
                  Thống kê tình hình công việc tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear} 
                  <span className="border border-red-700 text-[#c62828] text-xs px-3 py-1 rounded-full font-medium">Tổng số công việc: 10</span>
               </h2>
               <a href="#" className="text-red-500 text-xs font-medium hover:underline flex items-center">Chi tiết <ChevronRight className="w-3 h-3" /></a>
            </div>

            <div className="flex-1 space-y-10 justify-center flex flex-col px-2">
               {/* Khối 1 */}
               <div>
                  <div className="flex justify-between text-[13px] font-bold text-slate-800 mb-3">
                     <span>Số lượng công việc hoàn thành theo chất lượng</span>
                     <span>Tổng số lượng công việc: <b className="text-emerald-600">{dData.qtyTotal}</b></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 flex rounded-full overflow-hidden mb-3">
                     <div className="bg-red-500 h-full transition-all" style={{width: `${dData.qtyTotal ? (dData.qualityFailed/dData.qtyTotal)*100 : 0}%`}}></div>
                     <div className="bg-[#0bb720] h-full transition-all" style={{width: `${dData.qtyTotal ? (dData.qualitySuccess/dData.qtyTotal)*100 : 0}%`}}></div>
                  </div>
                  <div className="flex gap-6 text-[11px] font-bold text-slate-600">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Chất lượng không đạt <span className="text-red-500">{dData.qualityFailed}</span> ({dData.qtyTotal ? Math.round(dData.qualityFailed/dData.qtyTotal*100) : 0}%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0bb720]"></div>Chất lượng tốt <span className="text-[#0bb720]">{dData.qualitySuccess}</span> ({dData.qtyTotal ? Math.round(dData.qualitySuccess/dData.qtyTotal*100) : 0}%)</span>
                  </div>
               </div>

               {/* Khối 2 */}
               <div>
                  <div className="flex justify-between text-[13px] font-bold text-slate-800 mb-3">
                     <span>Số lượng công việc theo tiến độ</span>
                     <span>Tỷ lệ đạt tiến độ: <b className="text-red-600">{dData.progressTotal ? Math.round(dData.progressOnTime/dData.progressTotal*100) : 0}%</b></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 flex rounded-full overflow-hidden mb-3">
                     <div className="bg-red-500 h-full transition-all" style={{width: `${dData.progressTotal ? (dData.progressLate/dData.progressTotal)*100 : 0}%`}}></div>
                     <div className="bg-[#0052cc] h-full transition-all" style={{width: `${dData.progressTotal ? (dData.progressInProgress/dData.progressTotal)*100 : 0}%`}}></div>
                     <div className="bg-[#0bb720] h-full transition-all" style={{width: `${dData.progressTotal ? (dData.progressOnTime/dData.progressTotal)*100 : 0}%`}}></div>
                  </div>
                  <div className="flex gap-5 text-[11px] font-bold text-slate-600">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Thất bại / Trễ hạn <span className="text-red-500">{dData.progressLate}</span> ({dData.progressTotal ? Math.round(dData.progressLate/dData.progressTotal*100) : 0}%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0052cc]"></div>Đang xử lý <span className="text-[#0052cc]">{dData.progressInProgress}</span> ({dData.progressTotal ? Math.round(dData.progressInProgress/dData.progressTotal*100) : 0}%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0bb720]"></div>Chốt đơn (Hoàn thành) <span className="text-[#0bb720]">{dData.progressOnTime}</span> ({dData.progressTotal ? Math.round(dData.progressOnTime/dData.progressTotal*100) : 0}%)</span>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Top 5 nhân viên xuất sắc tháng 03/2026</h2>
            <p className="text-[11px] text-slate-500 italic mb-4">(chu kỳ gần nhất)</p>
            <div className="space-y-4">
               {dData.topStaff.length === 0 && (
                  <div className="text-[12px] text-slate-500 italic text-center py-4">Chưa có ai hoàn thành nhiệm vụ tháng này.</div>
               )}
               {dData.topStaff.map((staff, i) => (
                  <div key={i} className="flex items-center gap-3 relative pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                     <img src={staff.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="Avatar"/>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[13px] text-slate-800 leading-tight">{staff.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{staff.unit}</p>
                        <p className="text-[10px] text-slate-400 italic">Xếp loại: Tham gia {staff.total} nhiệm vụ</p>
                     </div>
                     <div className="text-right flex items-center justify-end gap-2 pr-1">
                        <span className="font-bold text-red-500" title="Số lượng hoàn thành xuất sắc">{staff.score}</span>
                        {i === 0 && <span className="text-yellow-500 text-lg">👑</span>}
                        {i === 1 && <span className="text-emerald-500 border-2 border-emerald-500 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">2</span>}
                        {i === 2 && <span className="text-blue-500 border-2 border-blue-500 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]">3</span>}
                     </div>
                  </div>
               ))}
            </div>
         </Card>
      </div>

      {/* =========== ROW 3 =========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         
         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Tình trạng đánh giá CBNV tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</h2>
            <p className="text-[11px] text-slate-500 italic mb-6">(chu kỳ gần nhất)</p>

            <div className="w-full flex h-6 mb-4">
               <div className="bg-[#ff9800] transition-all" style={{width: `${(dData.evalNotDone/dData.totalStaff)*100}%`}} title="Không thực hiện đánh giá"></div>
               <div className="bg-red-500 transition-all" style={{width: `${(dData.evalPendingSelf/dData.totalStaff)*100}%`}} title="Chưa tự đánh giá"></div>
               <div className="bg-[#00d2d3] transition-all" style={{width: `${(dData.evalPendingMgmt/dData.totalStaff)*100}%`}} title="Chờ theo dõi, đánh giá"></div>
               <div className="bg-[#1e3799] transition-all" style={{width: `${(dData.evalRankWait/dData.totalStaff)*100}%`}} title="Chờ xếp loại"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 gap-y-6 mt-6">
               <div className="border-l-2 border-[#ff9800] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Không thực hiện</div>
                  <div className="font-bold text-red-500 text-sm">{dData.evalNotDone}/{dData.totalStaff}</div>
                  <div className="text-[10px] text-slate-400">Chiếm {Math.round((dData.evalNotDone/dData.totalStaff)*100)}%</div>
               </div>
               <div className="border-l-2 border-[#00d2d3] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chờ Quản lý đánh giá</div>
                  <div className="font-bold text-[#00d2d3] text-sm">{dData.evalPendingMgmt}/{dData.totalStaff}</div>
                  <div className="text-[10px] text-slate-400">Chiếm {Math.round((dData.evalPendingMgmt/dData.totalStaff)*100)}%</div>
               </div>
               <div className="border-l-2 border-red-500 pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chưa đánh giá cá nhân</div>
                  <div className="font-bold text-[#f39c12] text-sm">{dData.evalPendingSelf}/{dData.totalStaff}</div>
                  <div className="text-[10px] text-slate-400">Chiếm {Math.round((dData.evalPendingSelf/dData.totalStaff)*100)}%</div>
               </div>
               <div className="border-l-2 border-[#1e3799] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chờ kết quả cuối</div>
                  <div className="font-bold text-[#1e3799] text-sm">{dData.evalRankWait}/{dData.totalStaff}</div>
                  <div className="text-[10px] text-slate-400">Chiếm {Math.round((dData.evalRankWait/dData.totalStaff)*100)}%</div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
               <h2 className="text-[15px] font-bold text-slate-800 mb-1">Tình trạng thực hiện tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</h2>
               <p className="text-[11px] text-slate-500 italic mb-6">(chuẩn hóa quy trình)</p>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col justify-center">
               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Đánh giá cơ sở</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[40%]"></div>
                     <div className="bg-[#ff9800] w-[60%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn {Math.floor(dData.totalStaff * 0.4)}</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ {Math.ceil(dData.totalStaff * 0.6)}</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Đánh giá chuyên sâu</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[80%]"></div>
                     <div className="bg-[#ff9800] w-[20%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn {Math.floor(dData.totalStaff * 0.8)}</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ {Math.ceil(dData.totalStaff * 0.2)}</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Hoàn tất</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[90%]"></div>
                     <div className="bg-[#ff9800] w-[10%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn {Math.floor(dData.totalStaff * 0.9)}</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ {Math.ceil(dData.totalStaff * 0.1)}</span>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow relative">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Kết quả đánh giá CBNV tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}</h2>
            <p className="text-[11px] text-slate-500 italic mb-4">(tỷ lệ % quy mô tổ chức)</p>

            <div className="h-[180px] w-full relative mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           {name: "Hoàn thành xuất sắc", value: 30, color: "#0bb720"},
                           {name: "Không hoàn thành", value: 5, color: "#e3e8f0"},
                           {name: "Hoàn thành nhiệm vụ", value: 45, color: "#ff9800"},
                           {name: "Hoàn thành tốt nhiệm vụ", value: 20, color: "#0052cc"}
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                     >
                        {
                           [
                              {name: "Hoàn thành xuất sắc", value: 30, color: "#0bb720"},
                              {name: "Không hoàn thành", value: 5, color: "#e3e8f0"},
                              {name: "Hoàn thành nhiệm vụ", value: 45, color: "#ff9800"},
                              {name: "Hoàn thành tốt nhiệm vụ", value: 20, color: "#0052cc"}
                           ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))
                        }
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               
               <div className="absolute top-[5%] left-0 text-[10px] text-center w-24">
                  <div className="font-bold text-[#0bb720]">30%</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành xuất sắc</div>
               </div>
               <div className="absolute top-[0%] right-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-red-500">5%</div>
                  <div className="text-slate-600 leading-tight">Không hoàn thành</div>
               </div>
               <div className="absolute bottom-[5%] right-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-[#ff9800]">45%</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành nhiệm vụ</div>
               </div>
               <div className="absolute bottom-[0%] left-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-[#0052cc]">20%</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành tốt</div>
               </div>
            </div>
         </Card>

      </div>
    </div>
  );
}
