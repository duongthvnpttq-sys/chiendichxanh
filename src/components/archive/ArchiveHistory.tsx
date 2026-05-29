import React from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, ChevronRight, MapPin, CheckSquare, Search } from 'lucide-react';
import { dataService, ProgramCategory, ImplementationBatch, Customer, Assignment } from '@/src/services/dataService';
import { userService, UserDetail } from '@/src/services/userService';
import { Input } from '@/components/ui/input';

export default function ArchiveHistory() {
  const [categories, setCategories] = React.useState<ProgramCategory[]>([]);
  const [batches, setBatches] = React.useState<ImplementationBatch[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [staff, setStaff] = React.useState<UserDetail[]>([]);
  
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const refreshData = () => {
      dataService.getCategories().then(setCategories);
      dataService.getBatches().then(setBatches);
      dataService.getCustomers().then(setCustomers);
      dataService.getAssignments().then(setAssignments);
      setStaff(userService.getUsers());
    };
    
    refreshData();
    const unsub = dataService.subscribe(refreshData);
    return () => unsub();
  }, []);

  const completedBatches = batches.filter(b => b.status === 'COMPLETED');
  const completedBatchIds = completedBatches.map(b => b.id);
  const completedAssignments = assignments.filter(a => completedBatchIds.includes(a.campaignId) || a.status === 'SUCCESS' || a.status === 'COMPLETED');

  // We consider an archive item as a category that has completed batches
  const archiveCategories = categories.filter(c => completedBatches.some(b => b.programId === c.id));

  const filteredAssignments = completedAssignments.filter(a => {
    const cust = customers.find(c => c.id === a.customerId);
    if (!cust) return false;
    const matchesSearch = cust.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cust.phone.includes(searchTerm) || 
                          cust.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If activeCategory is selected, only show assignments from that category
    if (activeCategory) {
      const bat = batches.find(b => b.id === a.campaignId);
      if (bat?.programId !== activeCategory) return false;
    }
    
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 gap-4">
      {/* Header Area */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#1c4b82] flex items-center gap-2">
            <Clock className="w-6 h-6" /> Lưu trữ & Lịch sử
          </h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Danh sách các chương trình đã kết thúc</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm khách hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-none rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left Sidebar - Categories */}
        <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 overflow-y-auto">
          <button 
            onClick={() => setActiveCategory(null)}
            className={`text-left p-4 rounded-2xl transition-all border ${!activeCategory ? 'bg-brand-indigo text-white border-brand-indigo shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-brand-indigo/30'}`}
          >
            <h3 className="font-bold text-sm uppercase">Tất cả chương trình</h3>
            <p className={`text-xs mt-1 font-medium ${!activeCategory ? 'text-blue-200' : 'text-slate-400'}`}>{completedAssignments.length} khách hàng đã giao</p>
          </button>
          
          {archiveCategories.map(cat => {
            const catBatches = completedBatches.filter(b => b.programId === cat.id);
            const catAssignments = completedAssignments.filter(a => catBatches.some(b => b.id === a.campaignId));
            const isActive = activeCategory === cat.id;

            return (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-left p-4 rounded-2xl transition-all border ${isActive ? 'bg-brand-indigo text-white border-brand-indigo shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-brand-indigo/30'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm uppercase tracking-tight truncate pr-2">{cat.name}</h3>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ffcd00]' : 'text-blue-500'}`} />
                </div>
                <p className={`text-xs font-medium ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{catAssignments.length} khách hàng đã giao</p>
              </button>
            )
          })}
        </div>

        {/* Main Content - Customer List */}
        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wide">Lịch sử khách hàng ({filteredAssignments.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredAssignments.map((assignment, idx) => {
              const customer = customers.find(c => c.id === assignment.customerId);
              const batch = batches.find(b => b.id === assignment.campaignId);
              const category = categories.find(c => c.id === batch?.programId);
              const assignee = staff.find(s => s.id === assignment.staffId);
              if (!customer) return null;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={assignment.id || `${idx}_${assignment.customerId}`}
                  className="p-4 rounded-xl border border-slate-100 hover:border-brand-indigo/20 transition-all flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-[#1c4b82] text-sm truncate uppercase">{customer.name}</h4>
                      <span className="text-[10px] bg-green-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider px-2">
                        {assignment.status === 'SUCCESS' || assignment.status === 'COMPLETED' ? 'Đã thu hồi' : assignment.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {customer.address}
                    </p>
                    {category && batch && (
                      <p className="text-[10px] text-brand-orange mt-2 font-bold uppercase tracking-wide truncate">
                        {category.name} <ChevronRight className="w-3 h-3 inline pb-0.5" /> {batch.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="md:text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Người thực hiện</p>
                    <div className="flex items-center md:justify-end gap-2 text-sm font-semibold text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-brand-indigo text-white flex items-center justify-center text-[10px]">
                        {assignee ? (assignee.displayName || 'NV').substring(0,2).toUpperCase() : 'NV'}
                      </div>
                      {assignee ? (assignee.displayName || 'NV') : 'Chưa giao'}
                    </div>
                    {assignment.outcome && (
                      <p className="text-[10px] text-slate-500 mt-2 font-medium bg-white px-2 py-1 rounded inline-block shadow-sm">
                        KQ: {assignment.outcome}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
            
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <CheckSquare className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Không có lịch sử</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
