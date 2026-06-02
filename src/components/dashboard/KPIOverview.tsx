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
    const currentMonthAssignments = assignments.filter((a: any) => {
        try {
            if (!a.assignedDate) return true;
            const d = new Date(a.assignedDate);
            return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
        } catch { return true; }
    });

    const hasData = currentMonthAssignments.length > 0;

    // Use absolute mock from image if no data, otherwise use real
    const total = hasData ? currentMonthAssignments.length : 30;
    const completed = hasData ? currentMonthAssignments.filter(a => ['COMPLETED', 'SUCCESS'].includes(a.status)).length : 15;
    const incomplete = hasData ? total - completed : 15;
    
    const pending = hasData ? currentMonthAssignments.filter(a => ['PENDING', 'UNASSIGNED'].includes(a.status)).length : 1;
    const inProgress = hasData ? currentMonthAssignments.filter(a => a.status === 'IN_PROGRESS').length : 3;
    const pieTotal = pending + inProgress + completed;
    
    // Month pie data
    const pieData = [
      { name: 'Nhiệm vụ chờ thực hiện', value: pending, color: '#ff9800', pct: Math.round((pending/(pieTotal||1))*100) },
      { name: 'Nhiệm vụ đang thực hiện', value: inProgress, color: '#0052cc', pct: Math.round((inProgress/(pieTotal||1))*100) },
      { name: 'Nhiệm vụ đã hoàn thành', value: completed, color: '#0bb720', pct: Math.round((completed/(pieTotal||1))*100) }
    ];

    const topStaffRaw = users.filter(u => u.role !== 'admin').map((u) => {
        const closed = currentMonthAssignments.filter(a => a.staffId === u.id && ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
        return { ...u, closed };
      }).sort((a, b) => b.closed - a.closed).slice(0, 5);
      
    // Mock top staff to match image if no real rating data
    const topStaff = topStaffRaw.length >= 3 ? topStaffRaw.map((s, i) => ({
        name: s.name, unit: s.unit || 'Phòng ban', score: (97 - i).toFixed(1), avatar: `https://i.pravatar.cc/150?u=${s.id}`
    })) : [
        { name: 'Nguyễn Thị Nga', unit: 'Phòng Tổ chức-Biên chế', score: '97.0 đ', avatar: 'https://i.pravatar.cc/150?u=1' },
        { name: 'Bùi Hồng Nga', unit: 'Phòng Tổ chức-Biên chế', score: '95.0 đ', avatar: 'https://i.pravatar.cc/150?u=2' },
        { name: 'Trần Thùy Trang', unit: 'Phòng Tổ chức-Biên chế', score: '93.0 đ', avatar: 'https://i.pravatar.cc/150?u=3' },
    ];

    return { total, completed, incomplete, pieData, topStaff, pieTotal };
  }, [assignments, users, selectedMonth, selectedYear]);

  return (
    <div className="w-full max-w-[1400px] mx-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar pb-10 font-sans px-2">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 py-4 rounded-xl">
        <h1 className="text-[22px] font-bold text-[#1a3b5c] uppercase">DASHBOARD CỦA LÃNH ĐẠO CƠ QUAN/TỔ CHỨC</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="vanphong">
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200">
              <SelectValue placeholder="Văn phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vanphong">Văn phòng</SelectItem>
            </SelectContent>
          </Select>

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
             Nhắc việc <span className="bg-white text-[#c62828] rounded-full w-5 h-5 flex items-center justify-center text-[11px]">20</span>
          </button>
        </div>
      </div>

      {/* =========== ROW 1 =========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
         
         {/* TỔNG SỐ NHIỆM VỤ NĂM */}
         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <h2 className="text-center text-sm font-bold text-slate-800 uppercase mb-2 text-opacity-90">Tổng số nhiệm vụ năm {selectedYear}</h2>
            <div className="text-center font-bold text-[42px] text-[#c62828] mb-6">{dData.total}</div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-[#fdf3f2] p-3 rounded-lg border border-red-50">
                  <div className="flex items-center gap-2">
                     <CheckCircle className="w-5 h-5 text-emerald-600" />
                     <span className="font-bold text-sm text-slate-700">Đã hoàn thành</span>
                  </div>
                  <span className="font-bold text-xl text-emerald-600">{dData.completed}</span>
               </div>
               <div className="flex justify-between items-center bg-[#fdf3f2] p-3 rounded-lg border border-red-50">
                  <div className="flex items-center gap-2">
                     <FileText className="w-5 h-5 text-red-500" />
                     <span className="font-bold text-sm text-slate-700">Chưa hoàn thành</span>
                  </div>
                  <span className="font-bold text-xl text-[#f39c12]">{dData.incomplete}</span>
               </div>
            </div>

            <div className="mt-8">
               <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden mb-2">
                  <div className="bg-[#005BAA] h-full" style={{ width: '66%' }}></div>
                  <div className="bg-red-500 h-full" style={{ width: '34%' }}></div>
               </div>
               <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#005BAA]">10 <span className="text-slate-500 font-medium">Còn hạn</span></span>
                  <span className="text-red-500">5 <span className="text-slate-500 font-medium">Quá hạn</span></span>
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
               <div className="relative pl-4 border-l-2 border-slate-100">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-red-500"></div>
                  <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Báo cáo công tác CCHC quý I năm 2026</h3>
                  <div className="flex justify-between items-center mt-2">
                     <div className="text-[11px] text-slate-500 space-y-1">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tháng 4/2026</div>
                        <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> Văn phòng</div>
                        <div className="flex items-center gap-1"><User className="w-3 h-3" /> Nguyễn Thị Mai Anh</div>
                     </div>
                     <span className="px-2 py-0.5 border border-red-500 text-red-500 text-[10px] font-bold rounded-full bg-red-50">Quá hạn 5 ngày</span>
                  </div>
               </div>

               <div className="relative pl-4 border-l-2 border-slate-100">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-red-500"></div>
                  <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Kế hoạch kiểm tra công tác dân vận chính quyền năm 2026</h3>
                  <div className="flex justify-between items-center mt-2">
                     <div className="text-[11px] text-slate-500 space-y-1">
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tháng 4/2026</div>
                        <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> Văn phòng</div>
                        <div className="flex items-center gap-1"><User className="w-3 h-3" /> Nguyễn Thị Anh</div>
                     </div>
                     <span className="px-2 py-0.5 border border-[#005BAA] text-[#005BAA] text-[10px] font-bold rounded-full bg-[#005BAA]/5">Còn hạn 2 ngày</span>
                  </div>
               </div>
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
                     <span>Tổng số lượng công việc: <b className="text-emerald-600">6</b></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 flex rounded-full overflow-hidden mb-3">
                     <div className="bg-red-500 h-full transition-all" style={{width: '20%'}}></div>
                     <div className="bg-[#0bb720] h-full transition-all" style={{width: '80%'}}></div>
                  </div>
                  <div className="flex gap-6 text-[11px] font-bold text-slate-600">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Không đạt chất lượng <span className="text-red-500">1</span> (20%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0bb720]"></div>Đạt chất lượng <span className="text-[#0bb720]">5</span> (80%)</span>
                  </div>
               </div>

               {/* Khối 2 */}
               <div>
                  <div className="flex justify-between text-[13px] font-bold text-slate-800 mb-3">
                     <span>Số lượng công việc theo tiến độ</span>
                     <span>Tỷ lệ đạt tiến độ: <b className="text-red-600">86%</b></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 flex rounded-full overflow-hidden mb-3">
                     <div className="bg-red-500 h-full transition-all" style={{width: '10%'}}></div>
                     <div className="bg-[#0052cc] h-full transition-all" style={{width: '30%'}}></div>
                     <div className="bg-[#ff9800] h-full transition-all" style={{width: '40%'}}></div>
                     <div className="bg-[#0bb720] h-full transition-all" style={{width: '20%'}}></div>
                  </div>
                  <div className="flex gap-5 text-[11px] font-bold text-slate-600">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Chậm tiến độ <span className="text-red-500">1</span> (10%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0052cc]"></div>Còn hạn <span className="text-[#0052cc]">3</span> (30%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff9800]"></div>Đúng hạn <span className="text-[#ff9800]">4</span> (40%)</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0bb720]"></div>Vượt tiến độ <span className="text-[#0bb720]">2</span> (20%)</span>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Top 5 nhân viên xuất sắc tháng 03/2026</h2>
            <p className="text-[11px] text-slate-500 italic mb-4">(chu kỳ gần nhất)</p>
            <div className="space-y-4">
               {dData.topStaff.map((staff, i) => (
                  <div key={i} className="flex items-center gap-3 relative pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                     <img src={staff.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="Avatar"/>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[13px] text-slate-800 leading-tight">{staff.name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{staff.unit}</p>
                        <p className="text-[10px] text-slate-400 italic">Xếp loại: Hoàn thành xuất sắc nhiệm vụ</p>
                     </div>
                     <div className="text-right flex items-center justify-end gap-2 pr-1">
                        <span className="font-bold text-red-500">{staff.score}</span>
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
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Tình trạng đánh giá, xếp loại tháng 03/2026</h2>
            <p className="text-[11px] text-slate-500 italic mb-6">(chu kỳ gần nhất)</p>

            <div className="w-full flex h-6 mb-4">
               <div className="bg-[#ff9800] w-[10%]" title="Không thực hiện đánh giá"></div>
               <div className="bg-red-500 w-[40%]" title="Chưa tự đánh giá"></div>
               <div className="bg-[#00d2d3] w-[20%]" title="Chờ theo dõi, đánh giá"></div>
               <div className="bg-[#1e3799] w-[30%]" title="Chờ xếp loại"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 gap-y-6 mt-6">
               <div className="border-l-2 border-[#ff9800] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Không thực hiện đánh giá</div>
                  <div className="font-bold text-red-500 text-sm">11/115</div>
                  <div className="text-[10px] text-slate-400">Chiếm 10%</div>
               </div>
               <div className="border-l-2 border-[#00d2d3] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chờ theo dõi, đánh giá</div>
                  <div className="font-bold text-[#00d2d3] text-sm">23/115</div>
                  <div className="text-[10px] text-slate-400">Chiếm 20%</div>
               </div>
               <div className="border-l-2 border-red-500 pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chưa tự đánh giá</div>
                  <div className="font-bold text-[#f39c12] text-sm">46/115</div>
                  <div className="text-[10px] text-slate-400">Chiếm 40%</div>
               </div>
               <div className="border-l-2 border-[#1e3799] pl-3">
                  <div className="text-[11px] font-bold text-slate-600">Chờ xếp loại</div>
                  <div className="font-bold text-[#1e3799] text-sm">35/115</div>
                  <div className="text-[10px] text-slate-400">Chiếm 30%</div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
               <h2 className="text-[15px] font-bold text-slate-800 mb-1">Tình trạng đánh giá, xếp loại tháng 03/2026</h2>
               <p className="text-[11px] text-slate-500 italic mb-6">(chu kỳ gần nhất)</p>
            </div>
            
            <div className="space-y-6 flex-1 flex flex-col justify-center">
               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Tự đánh giá</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[40%]"></div>
                     <div className="bg-[#ff9800] w-[60%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn 46 (40%)</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ 69 (60%)</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Theo dõi, đánh giá</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[80%]"></div>
                     <div className="bg-[#ff9800] w-[20%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn 92 (80%)</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ 23 (20%)</span>
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="text-[12px] font-bold text-slate-700">Hoàn thành</div>
                  <div className="w-full bg-slate-100 h-2 flex rounded-full overflow-hidden">
                     <div className="bg-[#0bb720] w-[90%]"></div>
                     <div className="bg-[#ff9800] w-[10%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold pt-1">
                     <span className="flex items-center gap-1 text-[#0bb720]"><div className="w-1.5 h-1.5 bg-[#0bb720] rounded-full"></div>Đúng hạn 104 (90%)</span>
                     <span className="flex items-center gap-1 text-[#ff9800]"><div className="w-1.5 h-1.5 bg-[#ff9800] rounded-full"></div>Muộn/Trễ 11 (10%)</span>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="rounded-xl shadow-sm border-slate-200/60 bg-white p-6 hover:shadow-md transition-shadow relative">
            <h2 className="text-[15px] font-bold text-slate-800 mb-1">Kết quả đánh giá, xếp loại tháng 03/2026</h2>
            <p className="text-[11px] text-slate-500 italic mb-4">(chu kỳ gần nhất)</p>

            <div className="h-[180px] w-full relative mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           {name: "Hoàn thành xuất sắc", value: 40, color: "#0bb720"},
                           {name: "Không hoàn thành", value: 1, color: "#e3e8f0"}, // Very small slice logically 0
                           {name: "Hoàn thành nhiệm vụ", value: 46, color: "#ff9800"},
                           {name: "Hoàn thành tốt nhiệm vụ", value: 29, color: "#0052cc"}
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
                              {name: "Hoàn thành xuất sắc", value: 40, color: "#0bb720"},
                              {name: "Không hoàn thành", value: 1, color: "#e3e8f0"},
                              {name: "Hoàn thành nhiệm vụ", value: 46, color: "#ff9800"},
                              {name: "Hoàn thành tốt nhiệm vụ", value: 29, color: "#0052cc"}
                           ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))
                        }
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               
               <div className="absolute top-[5%] left-0 text-[10px] text-center w-24">
                  <div className="font-bold text-[#0bb720]">40 (35%)</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành xuất sắc nhiệm vụ</div>
               </div>
               <div className="absolute top-[0%] right-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-red-500">0 (0%)</div>
                  <div className="text-slate-600 leading-tight">Không hoàn thành nhiệm vụ</div>
               </div>
               <div className="absolute bottom-[5%] right-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-[#ff9800]">46 (40%)</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành nhiệm vụ</div>
               </div>
               <div className="absolute bottom-[0%] left-[0%] text-[10px] text-center w-20">
                  <div className="font-bold text-[#0052cc]">29 (25%)</div>
                  <div className="text-slate-600 leading-tight">Hoàn thành tốt nhiệm vụ</div>
               </div>
            </div>
         </Card>

      </div>
    </div>
  );
}
