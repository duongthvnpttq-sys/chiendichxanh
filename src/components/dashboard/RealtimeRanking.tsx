import React, { useState, useEffect, useMemo } from 'react';
import { dataService, Assignment } from "@/src/services/dataService";
import { userService, UserDetail } from "@/src/services/userService";
import { Trophy, Calendar, Target, Medal, ArrowUpRight, Award, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/src/lib/utils";

export default function RealtimeRanking() {
  const [loading, setLoading] = useState(true);
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const assignData = await dataService.getAssignments();
        setAssignments(assignData);
        setUsers(userService.getUsers());
      } catch (error) {
        console.error("Error loading Ranking data:", error);
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

  const rankedStaff = useMemo(() => {
    const filterByDate = (dateStr: any) => {
        if (!dateStr) return true;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return true;
            return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
        } catch { return true; }
    }

    const filteredAssignments = assignments.filter(a => filterByDate(a.assignedDate));

    return users
      .filter(u => u.role !== 'admin')
      .map(u => {
        const staffAssignments = filteredAssignments.filter(a => a.staffId === u.id);
        const closed = staffAssignments.filter(a => ['COMPLETED', 'SUCCESS'].includes(a.status)).length;
        const total = staffAssignments.length;
        const progress = total > 0 ? Math.round((closed / total) * 100) : 0;
        return { ...u, closed, total, progress };
      })
      .filter(u => {
         if (!searchTerm) return true;
         return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (u.unit && u.unit.toLowerCase().includes(searchTerm.toLowerCase()));
      })
      .sort((a, b) => b.closed - a.closed || b.progress - a.progress)
  }, [assignments, users, selectedMonth, selectedYear, searchTerm]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Trophy className="w-8 h-8 animate-bounce text-amber-500 mb-2" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 md:pr-2 custom-scrollbar pb-4">
      {/* Header Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 cursor-default">
        <div>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Xếp hạng nhân sự</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            XẾP HẠNG REAL-TIME
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Bảng xếp hạng đóng góp giao dịch thành công trong tháng
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2">
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

      <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-slate-50 mb-2 px-4 pt-6">
            <div>
               <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">Chi tiết xếp hạng</CardTitle>
               <CardDescription className="text-xs font-bold text-slate-400 mt-1.5">Hiển thị danh sách đánh giá hiệu quả chốt deal</CardDescription>
            </div>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Tìm nhân sự..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 w-[200px]"
                />
            </div>
        </CardHeader>
        <CardContent className="px-4 pb-6">
           {rankedStaff.length > 0 ? (
           <div className="rounded-xl overflow-hidden border border-slate-100">
              <div className="grid grid-cols-12 bg-slate-50 p-3 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-100">
                 <div className="col-span-1 text-center">Hạng</div>
                 <div className="col-span-4">Nhân sự</div>
                 <div className="col-span-3">Đơn vị</div>
                 <div className="col-span-2 text-center">Nhiệm vụ</div>
                 <div className="col-span-2 text-right pr-2">Hoàn thành</div>
              </div>
              <div className="divide-y divide-slate-50">
                 {rankedStaff.map((staff, i) => (
                    <div key={staff.id} className="grid grid-cols-12 p-3 items-center hover:bg-blue-50/50 transition-colors group cursor-default">
                       <div className="col-span-1 flex justify-center">
                          <div className={cn(
                             "w-8 h-8 rounded-full flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-sm border relative overflow-hidden",
                             i === 0 ? "bg-gradient-to-br from-yellow-100 to-amber-100 text-amber-700 border-amber-200" : 
                             i === 1 ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border-slate-300" :
                             i === 2 ? "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 border-orange-200" :
                             "bg-slate-50 text-slate-500 border-slate-100"
                          )}>
                             {i === 0 || i === 1 || i === 2 ? (
                                <Medal className="w-4 h-4 drop-shadow-sm" />
                             ) : (
                                <span>{i + 1}</span>
                             )}
                          </div>
                       </div>
                       <div className="col-span-4 pl-2">
                          <p className="text-xs font-black text-slate-800 uppercase group-hover:text-[#005BAA] transition-colors">{staff.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{staff.username}</p>
                       </div>
                       <div className="col-span-3">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider truncate max-w-full block">
                             {staff.unit || '--'}
                          </span>
                       </div>
                       <div className="col-span-2 text-center">
                          <span className="text-xs font-black text-slate-700">{staff.total}</span>
                       </div>
                       <div className="col-span-2 text-right flex flex-col items-end pr-2">
                          <span className="text-sm font-black text-emerald-600">{staff.closed} <span className="text-[10px] text-emerald-600/50">Deal</span></span>
                          <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-0.5" title="Tỷ lệ hoàn thành nhiệm vụ">
                             {staff.progress}% Hiệu suất
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           ) : (
              <div className="text-center text-slate-400 text-sm mt-8 py-12 flex flex-col items-center gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                 <Target className="w-10 h-10 opacity-20 mb-2" />
                 Không có dữ liệu xếp hạng trong khoảng thời gian này
              </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
