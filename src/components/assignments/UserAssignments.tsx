import React from 'react';
import * as XLSX from 'xlsx';
import { 
  FileUp, 
  Search, 
  Filter, 
  UserPlus, 
  Map as MapIcon,
  Zap,
  Download,
  Users,
  History,
  AlertCircle,
  LayoutGrid,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  Maximize2,
  Minimize2,
  Settings,
  Database
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { dataService, Customer, Assignment, ImplementationBatch, ProgramCategory } from "@/src/services/dataService";
import { userService, UserDetail, Territory } from "@/src/services/userService";
import { authService } from "@/src/services/authService";
import { Plus, Trash2, FolderPlus, Camera, UserMinus, Pencil } from 'lucide-react';
import { notificationService } from "@/src/services/notificationService";

interface UserAssignmentsProps {
  mode?: 'LIST' | 'ASSIGN';
  onNavigate?: (page: string) => void;
}

export default function UserAssignments({ mode = 'ASSIGN', onNavigate }: UserAssignmentsProps) {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [batches, setBatches] = React.useState<ImplementationBatch[]>([]);
  const [categories, setCategories] = React.useState<ProgramCategory[]>([]);
  const [staff, setStaff] = React.useState<UserDetail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCustomers, setSelectedCustomers] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [addBatchDialogOpen, setAddBatchDialogOpen] = React.useState(false);
  const [editingBatch, setEditingBatch] = React.useState<ImplementationBatch | null>(null);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<ProgramCategory | null>(null);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = React.useState(false);
  const [targetStaff, setTargetStaff] = React.useState('');
  const [selectedStaffIds, setSelectedStaffIds] = React.useState<string[]>([]);
  const [isManageMode, setIsManageMode] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [activeBatch, setActiveBatch] = React.useState('all');
  const [revenueRange, setRevenueRange] = React.useState('ALL');
  const [territoryFilter, setTerritoryFilter] = React.useState<string[]>([]);
  const [regionFilter, setRegionFilter] = React.useState<string[]>([]);
  const [communeFilter, setCommuneFilter] = React.useState('');
  const [hamletFilter, setHamletFilter] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [assignedFilter, setAssignedFilter] = React.useState('ALL');
  const [staffFilter, setStaffFilter] = React.useState<string[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [historyTask, setHistoryTask] = React.useState<any>(null);
  const [assignStaffIds, setAssignStaffIds] = React.useState<string[]>([]);
  const [assignTaskType, setAssignTaskType] = React.useState('Tư vấn nâng gói Cáp quang');
  const [assignPriority, setAssignPriority] = React.useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [assignDeadline, setAssignDeadline] = React.useState('');
  const [assignNotes, setAssignNotes] = React.useState('');
  const [assignStaffSearchTerm, setAssignStaffSearchTerm] = React.useState('');
  const [territories, setTerritories] = React.useState<Territory[]>([]);
  const [assignByTerritoryDialogOpen, setAssignByTerritoryDialogOpen] = React.useState(false);
  const [territoryMappings, setTerritoryMappings] = React.useState<Record<string, string>>({});
  const [selectedTerritoriesForAssign, setSelectedTerritoriesForAssign] = React.useState<string[]>([]);
  const [batchAssignStaffId, setBatchAssignStaffId] = React.useState<string>('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [staffSearchTerm, setStaffSearchTerm] = React.useState('');
  const [territorySearchTerm, setTerritorySearchTerm] = React.useState('');

  const [assignmentDeadline, setAssignmentDeadline] = React.useState('');
  const [assignmentNotes, setAssignmentNotes] = React.useState('');
  const [assignmentPriority, setAssignmentPriority] = React.useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [assignmentTaskType, setAssignmentTaskType] = React.useState('Tư vấn nâng gói Cáp quang');
  const [taskTypes, setTaskTypes] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vnpt_task_types');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      'Tư vấn nâng gói Cáp quang',
      'Tư vấn thiết bị Mesh WiFi',
      'Hỗ trợ lắp đặt thiết bị',
      'Chăm sóc & Gia hạn gói cước',
      'Bảo trì / Sửa chữa kỹ thuật',
      'Khác'
    ];
  });
  const [newTaskTypeDialogOpen, setNewTaskTypeDialogOpen] = React.useState(false);
  const [newTaskType, setNewTaskType] = React.useState('');

  const handleAddTaskType = () => {
    if (!newTaskType.trim()) return;
    const updated = [...taskTypes, newTaskType.trim()];
    setTaskTypes(updated);
    localStorage.setItem('vnpt_task_types', JSON.stringify(updated));
    setAssignmentTaskType(newTaskType.trim());
    setNewTaskTypeDialogOpen(false);
    setNewTaskType('');
  };

  // Confirmation Dialog states
  const [confirmDelete, setConfirmDelete] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // New Customer Form State
  const [newCustomer, setNewCustomer] = React.useState({
    name: '',
    phone: '',
    region: '',
    revenue: '',
    services: '',
    territory: '',
    salesManager: '',
    technicalManager: '',
    subscriptionId: '',
    addressDetail: ''
  });

  const handleDeleteSelected = async () => {
    setConfirmDelete({
      open: true,
      title: 'Xóa danh sách đã chọn',
      description: `Bạn có chắc muốn xóa ${selectedCustomers.length} khách hàng đã chọn? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        await dataService.deleteCustomersBulk(selectedCustomers);
        toast.success(`Đã xóa ${selectedCustomers.length} khách hàng.`);
        setSelectedCustomers([]);
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleDeleteAssignments = async () => {
    setConfirmDelete({
      open: true,
      title: 'Xóa nhiệm vụ',
      description: `Bạn có chắc muốn xóa nhiệm vụ của ${selectedCustomers.length} khách hàng đã chọn? Việc này sẽ thu hồi nhiệm vụ từ nhân viên.`,
      onConfirm: async () => {
        await dataService.deleteAssignmentsBulk(selectedCustomers, activeBatch);
        toast.success(`Đã thu hồi (xóa) nhiệm vụ cho ${selectedCustomers.length} khách hàng.`);
        setSelectedCustomers([]);
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleDeleteIndividual = async (id: string, name: string) => {
    setConfirmDelete({
      open: true,
      title: 'Xóa khách hàng',
      description: `Bạn có chắc muốn xóa khách hàng "${name}"?`,
      onConfirm: async () => {
        await dataService.deleteCustomersBulk([id]);
        toast.success(`Đã xóa khách hàng ${name}.`);
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleDeleteAllInBatch = async () => {
    if (activeBatch === 'all') {
      toast.error("Vui lòng chọn một đợt cụ thể để xóa tất cả.");
      return;
    }
    
    setConfirmDelete({
      open: true,
      title: 'Xóa toàn bộ khách hàng trong đợt',
      description: `Bạn có chắc muốn xóa TẤT CẢ ${filteredCustomers.length} khách hàng trong đợt này?`,
      onConfirm: async () => {
        const ids = filteredCustomers.map(c => c.id);
        await dataService.deleteCustomersBulk(ids);
        toast.success(`Đã xóa sạch ${ids.length} khách hàng trong đợt.`);
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleDeleteAllInCategory = async (categoryId: string, categoryName: string) => {
    setConfirmDelete({
      open: true,
      title: 'Xóa sạch danh sách KH của chương trình',
      description: `Bạn có chắc muốn xóa toàn bộ khách hàng thuộc chương trình/danh mục "${categoryName}"? Hành động này rất hữu ích khi chương trình đã kết thúc và bạn muốn dọn dẹp dữ liệu.`,
      onConfirm: async () => {
        const batchIdsInCat = batches.filter(b => b.programId === categoryId).map(b => b.id);
        const customersInCat = customers.filter(c => c.categoryId === categoryId || (c.campaignId && batchIdsInCat.includes(c.campaignId)));
        if (customersInCat.length === 0) {
          toast.info("Không có khách hàng nào trong chương trình này.");
          setConfirmDelete(prev => ({ ...prev, open: false }));
          return;
        }
        const ids = customersInCat.map(c => c.id);
        await dataService.deleteCustomersBulk(ids);
        toast.success(`Đã xóa sạch ${ids.length} khách hàng của chương trình ${categoryName}.`);
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportCategoryIds, setExportCategoryIds] = React.useState<string[]>([]);
  const [exportBatchIds, setExportBatchIds] = React.useState<string[]>([]);
  const [exportTaskTypes, setExportTaskTypes] = React.useState<string[]>([]);
  const [exportRegions, setExportRegions] = React.useState<string[]>([]);
  const [exportTerritories, setExportTerritories] = React.useState<string[]>([]);
  const [exportStaffIds, setExportStaffIds] = React.useState<string[]>([]);
  const [exportStartDate, setExportStartDate] = React.useState<string>('');
  const [exportEndDate, setExportEndDate] = React.useState<string>('');
  const [exportSelectedOnly, setExportSelectedOnly] = React.useState(false);

  const handleExportHTMLReport = async () => {
    try {
      const allCustomers = await dataService.getCustomers();
      const allAssignments = await dataService.getAssignments();
      
      let filteredCustomers = allCustomers;
      let reportName = 'Bao_cao_tong_hop';
      let titleName = 'TẤT CẢ CHƯƠNG TRÌNH / ĐỢT TRIỂN KHAI';

      const assignMap = new Map<string, any>();
      allAssignments.forEach(assign => {
        assignMap.set(`${assign.customerId}_${assign.campaignId}`, assign);
        // Fallback if we just search by customerId
        if (!assignMap.has(assign.customerId)) {
           assignMap.set(assign.customerId, assign);
        }
      });

      // Áp dụng bộ lọc
      if (exportSelectedOnly && selectedCustomers.length > 0) {
        filteredCustomers = filteredCustomers.filter(c => selectedCustomers.includes(c.id));
      } else {
        if (exportBatchIds.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.campaignId && exportBatchIds.includes(c.campaignId));
          reportName = "Bao_cao_theo_dot";
          titleName = "BÁO CÁO THEO ĐỢT TRIỂN KHAI";
        } else if (exportCategoryIds.length > 0) {
          const batchIdsInCat = batches.filter(b => exportCategoryIds.includes(b.programId)).map(b => b.id);
          filteredCustomers = filteredCustomers.filter(c => 
            (c.categoryId && exportCategoryIds.includes(c.categoryId)) || 
            (c.campaignId && batchIdsInCat.includes(c.campaignId))
          );
          reportName = "Bao_cao_theo_chuong_trinh";
          titleName = "BÁO CÁO THEO CHƯƠNG TRÌNH";
        }

        if (exportRegions.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.region && exportRegions.includes(c.region));
        }
        if (exportTerritories.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.territory && exportTerritories.includes(c.territory));
        }
        if (exportStaffIds.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            return a && a.staffId && exportStaffIds.includes(a.staffId);
          });
        }
        if (exportTaskTypes.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            return a && a.status && exportTaskTypes.includes(a.status);
          });
        }
        if (exportStartDate) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            if (!a || !a.assignedDate) return false;
            return new Date(a.assignedDate) >= new Date(exportStartDate);
          });
        }
        if (exportEndDate) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            if (!a || !a.assignedDate) return false;
            const endDt = new Date(exportEndDate);
            endDt.setHours(23, 59, 59, 999);
            return new Date(a.assignedDate) <= endDt;
          });
        }
      }
      
      if (filteredCustomers.length === 0) {
toast.error("Không có dữ liệu khách hàng nào khớp với lựa chọn bộ lọc.");
        return;
      }

      let tableRowsHtml = '';
      filteredCustomers.forEach((customer, index) => {
        const a = assignMap.get(`${customer.id}_${customer.campaignId}`) || assignMap.get(customer.id);
        
        const batch = batches.find(b => b.id === (a?.campaignId || customer.campaignId));
        const category = categories.find(c => c.id === (batch?.programId || customer.categoryId));
        const staffMember = a ? staff.find(s => s.id === a.staffId) : null;
        const status = a ? a.status : 'UNASSIGNED';
        const assignedDate = a?.assignedDate ? new Date(a.assignedDate).toLocaleString('vi-VN') : '---';
        const notes = a?.notes || '';
        const outcome = a?.outcome || '';
        
        const imagesHtml = a && a.images && a.images.length > 0 ? a.images.map((img, i) => {
          const timestamp = a.checkInLocation?.timestamp || a.assignedDate || Date.now();
          const encodedImg = img.replace(/'/g, "\\'");
          return `
          <div style="position: relative; display: inline-block; margin-right: 6px; margin-bottom: 6px; vertical-align: top; transition: all 0.2s ease-in-out;" onmouseenter="this.style.transform='scale(2) translateY(-20px)'; this.style.zIndex='999'; this.style.boxShadow='0 20px 25px -5px rgba(0,0,0,0.3)'" onmouseleave="this.style.transform='scale(1) translateY(0)'; this.style.zIndex='1'; this.style.boxShadow='none'">
            <img src="${img}" style="height: 100px; width: auto; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: zoom-in;" onclick="openImageModal('${encodedImg}', '${a?.checkInLocation ? `${a.checkInLocation.lat.toFixed(6)}, ${a.checkInLocation.lng.toFixed(6)}` : ''}', '${new Date(timestamp).toLocaleString('vi-VN')}')" title="Nhấp để xem ảnh đầy đủ hoặc di chuột để phóng to"/>
            ${a?.checkInLocation ? `<div style="position: absolute; bottom: 4px; left: 4px; right: 4px; background: rgba(0,0,0,0.75); color: #4ade80; font-size: 8px; padding: 2px 4px; border-radius: 4px; font-family: monospace; pointer-events: none; z-index: 2; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.8); border-left: 2px solid #22c55e;">📍 ${a.checkInLocation.lat.toFixed(6)}, ${a.checkInLocation.lng.toFixed(6)}<br/>🕒 ${new Date(timestamp).toLocaleString('vi-VN')}</div>` : ''}
          </div>
        `}).join('') : '';

        const coordsHtml = a?.checkInLocation ? 
          `<a href="https://maps.google.com/?q=${a.checkInLocation.lat},${a.checkInLocation.lng}" target="_blank" style="display:inline-block; margin-top: 4px; padding: 4px 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 10px; color: #166534; font-weight: bold; text-decoration: none; font-family: monospace;">📍 ${a.checkInLocation.lat.toFixed(6)}, ${a.checkInLocation.lng.toFixed(6)}</a>` : '<span style="font-size: 10px; color: #9ca3af; font-style: italic;">Chưa check-in</span>';

        // Style the status badge correctly
        let bgColor = '#edf2f7';
        let textColor = '#4a5568';
        if (status === 'SUCCESS' || status === 'COMPLETED') {
          bgColor = '#dcfce7';
          textColor = '#15803d';
        } else if (status === 'FAILED') {
          bgColor = '#fee2e2';
          textColor = '#b11010';
        } else if (status === 'IN_PROGRESS') {
          bgColor = '#dbeafe';
          textColor = '#1d4ed8';
        } else if (status === 'PENDING') {
          bgColor = '#fef3c7';
          textColor = '#b45309';
        }

        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; color: #334155;">
            <td style="padding: 12px 8px; text-align: center;">${index + 1}</td>
            <td style="padding: 12px 8px; font-weight: bold; color: #111827;">${category?.name || '---'}</td>
            <td style="padding: 12px 8px; color: #4b5563;">${batch?.name || '---'}</td>
            <td style="padding: 12px 8px; font-weight: bold; font-family: monospace; color: #0f172a;">${customer.subscriptionId || '---'}</td>
            <td style="padding: 12px 8px; font-weight: bold; color: #005baa;">${customer.name}</td>
            <td style="padding: 12px 8px; font-family: monospace;">${customer.phone || '---'}</td>
            <td style="padding: 12px 8px; font-weight: 500;">${customer.territory || '---'}</td>
            <td style="padding: 12px 8px; font-size: 11px; max-width: 250px; white-space: normal; word-break: break-word;">
              ${customer.addressDetail || customer.address || '---'}
              <br/>
              ${coordsHtml}
            </td>
            <td style="padding: 12px 8px; color: #4b5563; font-size: 11px;">${(customer.services || []).join(', ') || '---'}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #b91c1c; font-family: monospace;">${(customer.revenue || 0).toLocaleString()} đ</td>
            <td style="padding: 12px 8px; font-weight: bold; color: #1e3a8a;">${staffMember?.name || '---'}</td>
            <td style="padding: 12px 8px; text-align: center;">
              <span style="padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; white-space: nowrap; background-color: ${bgColor}; color: ${textColor};">
                ${getTaskStatusLabel(status)}
              </span>
            </td>
            <td style="padding: 12px 8px; font-style: italic;">
              ${outcome ? `<strong>Kết quả:</strong> ${outcome}<br/>` : ''}${notes || '---'}
            </td>
            <td style="padding: 12px 8px; font-size: 11px; color: #6b7280; font-family: monospace;">${assignedDate}</td>
            <td style="padding: 12px 8px; max-width: 300px;">${imagesHtml || '<span style="color:#9ca3af;font-style:italic;font-size:11px;">Không có ảnh</span>'}</td>
          </tr>
        `;
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <title>Báo Cáo Triển Khai Thực Địa - VNPT</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
            .container { max-width: 1550px; margin: 0 auto; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #005baa; padding-bottom: 20px; margin-bottom: 24px; }
            .title { font-size: 22px; font-weight: 900; color: #005baa; text-transform: uppercase; margin: 0; letter-spacing: -0.5px; }
            .subtitle { font-size: 14px; font-weight: bold; color: #ea580c; margin-top: 4px; text-transform: uppercase; }
            .meta { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background-color: #005baa; color: white; text-align: left; padding: 14px 8px; font-size: 11px; text-transform: uppercase; font-weight: 955; letter-spacing: 0.5px; border-bottom: 2px solid #004488; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <h1 class="title">BÁO CÁO CHI TIẾT ĐỊA BÀN KÈM ẢNH MINH CHỨNG & TỌA ĐỘ</h1>
                <div class="subtitle">${titleName}</div>
                <div class="meta">VNPT FIELD-COMPASS &bull; Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}</div>
              </div>
              <div style="text-align: right; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 20px; border-radius: 16px;">
                <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 900;">Tổng số bản ghi</div>
                <div style="color:#15803d; font-size: 28px; font-weight: 950; line-height: 1;">${filteredCustomers.length}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 45px; text-align: center;">STT</th>
                  <th>Chương trình</th>
                  <th>Đợt triển khai</th>
                  <th>Mã thuê bao</th>
                  <th>Khách hàng</th>
                  <th>Số ĐT</th>
                  <th>Ô địa bàn</th>
                  <th style="max-width: 250px;">Địa chỉ chi tiết & Tọa độ</th>
                  <th>Dịch vụ chính</th>
                  <th style="text-align: right;">Doanh thu</th>
                  <th>Nhân sự phụ trách</th>
                  <th style="text-align: center;">Trạng thái</th>
                  <th>Ghi chú & kết quả</th>
                  <th>Cập nhật ngày</th>
                  <th>Ảnh đính kèm minh chứng</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
          
          <div id="imageModal" style="display:none; position:fixed; z-index:9999; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition: opacity 0.3s ease;">
            <span style="position:absolute; top:20px; right:30px; color:#fff; font-size:40px; font-weight:bold; cursor:pointer;" onclick="closeImageModal()">&times;</span>
            <div style="position:relative; max-width:90%; max-height:90%;">
              <img id="modalImg" style="max-width:100%; max-height:90vh; border-radius:8px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);"/>
              <div id="modalOverlay" style="position:absolute; bottom:20px; left:20px; background:rgba(0,0,0,0.7); color:#fff; padding:12px; border-radius:8px; font-family:monospace; display:none; border-left:4px solid #ea580c;"></div>
            </div>
          </div>

          <script>
            function openImageModal(imgSrc, coords, timestamp) {
              const modal = document.getElementById('imageModal');
              const modalImg = document.getElementById('modalImg');
              const overlay = document.getElementById('modalOverlay');
              
              modalImg.src = imgSrc;
              
              if (coords) {
                overlay.style.display = 'block';
                overlay.innerHTML = '<div style="font-size:12px; font-weight:bold; margin-bottom:4px; color:#fb923c;">XÁC THỰC TỌA ĐỘ GPS</div>📍 ' + coords + '<br/>🕒 ' + timestamp;
              } else {
                overlay.style.display = 'none';
              }
              
              modal.style.display = 'flex';
              modal.style.opacity = '1';
              modal.style.pointerEvents = 'auto';
            }
            
            function closeImageModal() {
              const modal = document.getElementById('imageModal');
              modal.style.opacity = '0';
              modal.style.pointerEvents = 'none';
            }
            
            document.addEventListener('keydown', function(event) {
              if (event.key === "Escape") {
                closeImageModal();
              }
            });
          </script>
        </body>
        </html>
      `;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}_co_anh.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất hoàn thành báo cáo tích hợp ảnh (.html)!");
      setExportDialogOpen(false);
    } catch (error) {
      console.error("HTML Export error:", error);
      toast.error("Lỗi xuất báo cáo ảnh.");
    }
  };

  const handleExportReport = async () => {
    try {
      const allCustomers = await dataService.getCustomers();
      const allAssignments = await dataService.getAssignments();
      
      let filteredCustomers = allCustomers;
      let reportName = 'Bao_cao_tong_hop';
      let titleName = 'TẤT CẢ CHƯƠNG TRÌNH / ĐỢT TRIỂN KHAI';

      const assignMap = new Map<string, any>();
      allAssignments.forEach(assign => {
        assignMap.set(`${assign.customerId}_${assign.campaignId}`, assign);
        if (!assignMap.has(assign.customerId)) {
           assignMap.set(assign.customerId, assign);
        }
      });

      // Áp dụng bộ lọc
      if (exportSelectedOnly && selectedCustomers.length > 0) {
        filteredCustomers = filteredCustomers.filter(c => selectedCustomers.includes(c.id));
      } else {
        if (exportBatchIds.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.campaignId && exportBatchIds.includes(c.campaignId));
          reportName = "Bao_cao_theo_dot";
          titleName = "BÁO CÁO THEO ĐỢT TRIỂN KHAI";
        } else if (exportCategoryIds.length > 0) {
          const batchIdsInCat = batches.filter(b => exportCategoryIds.includes(b.programId)).map(b => b.id);
          filteredCustomers = filteredCustomers.filter(c => 
            (c.categoryId && exportCategoryIds.includes(c.categoryId)) || 
            (c.campaignId && batchIdsInCat.includes(c.campaignId))
          );
          reportName = "Bao_cao_theo_chuong_trinh";
          titleName = "BÁO CÁO THEO CHƯƠNG TRÌNH";
        }

        if (exportRegions.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.region && exportRegions.includes(c.region));
        }
        if (exportTerritories.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => c.territory && exportTerritories.includes(c.territory));
        }
        if (exportStaffIds.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            return a && a.staffId && exportStaffIds.includes(a.staffId);
          });
        }
        if (exportTaskTypes.length > 0) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            return a && a.status && exportTaskTypes.includes(a.status);
          });
        }
        if (exportStartDate) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            if (!a || !a.assignedDate) return false;
            return new Date(a.assignedDate) >= new Date(exportStartDate);
          });
        }
        if (exportEndDate) {
          filteredCustomers = filteredCustomers.filter(c => {
            const a = assignMap.get(`${c.id}_${c.campaignId}`) || assignMap.get(c.id);
            if (!a || !a.assignedDate) return false;
            const endDt = new Date(exportEndDate);
            endDt.setHours(23, 59, 59, 999);
            return new Date(a.assignedDate) <= endDt;
          });
        }
      }
      
      if (filteredCustomers.length === 0) {
toast.error("Không có dữ liệu khách hàng nào khớp với lựa chọn bộ lọc.");
        return;
      }

      const reportData = filteredCustomers.map((customer, index) => {
        const a = assignMap.get(`${customer.id}_${customer.campaignId}`) || assignMap.get(customer.id);
        const staffMember = a ? staff.find(s => s.id === a.staffId) : null;
        const batch = batches.find(b => b.id === (a?.campaignId || customer.campaignId));
        const category = categories.find(c => c.id === (batch?.programId || customer.categoryId));
        
        const imagesCount = a && a.images ? a.images.length : 0;
        const imagesLink = a && a.images ? a.images.join('\n') : '';

        const row = {
          'STT': index + 1,
          'Danh mục chủ đề': category?.name || '---',
          'Đợt triển khai': batch?.name || '---',
          'Mã thuê bao': customer.subscriptionId || '---',
          'Tên Khách hàng': customer.name || '---',
          'Số điện thoại': customer.phone || '---',
          'Địa bàn (Ô/Quầy)': customer.territory || '---',
          'Địa chỉ chi tiết': customer.addressDetail || customer.address || '---',
          'Dịch vụ chính': (customer.services || []).join(', '),
          'Doanh thu phát sinh': customer.revenue || 0,
          'Nhân viên thực hiện': staffMember?.name || '---',
          'Trạng thái xử lý': getTaskStatusLabel(a ? a.status : 'UNASSIGNED'),
          'Kết quả triển khai': a?.outcome || '',
          'Ghi chú/Phản hồi': a?.notes || '',
          'Thời điểm cập nhật': a?.assignedDate ? new Date(a.assignedDate).toLocaleString('vi-VN') : '',
          'Tọa độ Check-in (Lat, Lng)': a?.checkInLocation ? `${a.checkInLocation.lat}, ${a.checkInLocation.lng}` : '',
          'Thời điểm Check-in': a?.checkInLocation?.timestamp ? new Date(a.checkInLocation.timestamp).toLocaleString('vi-VN') : '',
          'Số lượng ảnh': imagesCount,
          'Dữ liệu ảnh minh chứng (Base64)': imagesLink
        };

        // Đảm bảo không vượt quá giới hạn 32767 ký tự của Excel mỗi ô
        Object.keys(row).forEach(key => {
          const val = (row as any)[key];
          if (typeof val === 'string' && val.length > 32000) {
            (row as any)[key] = val.substring(0, 32000) + "... [Đã cắt bớt]";
          }
        });

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(reportData);
      
      // Safe column width calculation without stack overflow
      const colWidths = Object.keys(reportData[0]).map(key => {
        let maxLen = key.length;
        reportData.forEach(row => {
          const cellVal = String((row as any)[key]);
          if (cellVal.length > maxLen) maxLen = cellVal.length;
        });
        return { wch: Math.min(maxLen + 2, 100) }; // Cap width at 100 characters for usability
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
      
      XLSX.writeFile(wb, `${reportName}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
      toast.success("Xuất báo cáo thành công!");
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất báo cáo.");
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Vui lòng nhập tên và số điện thoại.");
      return;
    }

    const customer: Customer = {
      id: 'kh' + Math.random().toString(36).substr(2, 9),
      name: newCustomer.name,
      phone: newCustomer.phone,
      region: newCustomer.region,
      revenue: Number(newCustomer.revenue),
      services: newCustomer.services.split(',').map(s => s.trim()),
      categoryId: activeCategory,
      campaignId: activeBatch,
      territory: newCustomer.territory,
      salesManager: newCustomer.salesManager,
      technicalManager: newCustomer.technicalManager,
      subscriptionId: newCustomer.subscriptionId,
      addressDetail: newCustomer.addressDetail,
      createdAt: new Date().toISOString(),
      createdBy: authService.getCurrentUser()?.uid
    };

    await dataService.addCustomersBulk([customer]);
    toast.success(`Đã thêm khách hàng ${newCustomer.name} vào danh sách.`);
    setAddCustomerDialogOpen(false);
    setNewCustomer({ 
      name: '', phone: '', region: '', revenue: '', services: '', 
      territory: '', salesManager: '', technicalManager: '', 
      subscriptionId: '', addressDetail: '' 
    });
  };

  // New Batch Form State
  const [newBatch, setNewBatch] = React.useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as const
  });

  // New Category Form State
  const [newCat, setNewCat] = React.useState({
    name: '',
    description: '',
    services: ''
  });

  const selectedCategory = categories.find(c => c.id === activeCategory);
  const selectedBatch = batches.find(b => b.id === activeBatch);

  // Realtime subscription
  React.useEffect(() => {
    setLoading(true);
    
    const refreshData = () => {
      dataService.getCustomers().then(setCustomers);
      dataService.getCategories().then(setCategories);
      dataService.getBatches().then(data => {
        setBatches(data);
        if (data.length > 0 && activeBatch !== 'all' && !data.find(b => b.id === activeBatch)) {
          setActiveBatch('all');
        }
      });
    };

    const unsubscribeAssignments = dataService.subscribeToAssignments((data) => {
      setAssignments(data);
      setLoading(false);
    }, activeBatch);

    const unsubscribeGeneric = dataService.subscribe(() => {
      refreshData();
    });

    refreshData();
    setStaff(userService.getUsers());
    setTerritories(userService.getTerritories());

    const userUnsubscribe = userService.subscribe(() => {
      setStaff(userService.getUsers());
      setTerritories(userService.getTerritories());
    });

    return () => {
        unsubscribeAssignments();
        unsubscribeGeneric();
        userUnsubscribe();
    };
  }, [activeBatch, activeCategory]);

  const filteredCustomers = React.useMemo(() => {
    const query = searchTerm.toLowerCase();
    
    // Build lookup maps
    const assignmentMap = new Map<string, any>();
    assignments.forEach(a => {
      assignmentMap.set(a.customerId, a);
    });

    const staffMap = new Map<string, any>();
    staff.forEach(s => {
      staffMap.set(s.id, s);
    });

    const batchMap = new Map<string, any>();
    batches.forEach(b => {
      batchMap.set(b.id, b);
    });

    const filtered = [];
    for (let i = 0; i < customers.length; i++) {
        const c = customers[i];
        const cb = c.campaignId ? batchMap.get(c.campaignId) : undefined;
        
        if (mode === 'ASSIGN') {
          if (cb && cb.status === 'COMPLETED') continue;
        }

        const rev = (c.revenue || 0);
        if (revenueRange === "HIGH" && rev < 500000) continue;
        if (revenueRange === "MID" && (rev < 200000 || rev >= 500000)) continue;
        if (revenueRange === "LOW" && (rev === 0 || rev >= 200000)) continue;
        
        const effectiveCategoryId = c.categoryId || (cb ? cb.programId : undefined);
        if (activeCategory !== "all" && effectiveCategoryId !== activeCategory) continue;
        if (activeBatch !== "all" && c.campaignId !== activeBatch) continue;
        if (territoryFilter.length > 0 && (!c.territory || !territoryFilter.includes(c.territory))) continue;
        if (regionFilter.length > 0 && (!c.region || !regionFilter.includes(c.region))) continue;

        const customerAddress = (c.addressDetail || c.address || '').toLowerCase();
        if (communeFilter) {
          const cleanCommune = communeFilter.trim().toLowerCase();
          if (cleanCommune && !customerAddress.includes(cleanCommune)) continue;
        }

        if (hamletFilter) {
          const cleanHamlet = hamletFilter.trim().toLowerCase();
          if (cleanHamlet && !customerAddress.includes(cleanHamlet)) continue;
        }

        if (query && !(c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query)) || (c.subscriptionId && c.subscriptionId.toLowerCase().includes(query)))) {
          continue;
        }

        const assignment = assignmentMap.get(c.id);
        const taskStatus = assignment ? assignment.status : "UNASSIGNED";
        
        if (statusFilter !== "ALL" && taskStatus !== statusFilter) continue;

        if (assignedFilter === 'ASSIGNED' && taskStatus === 'UNASSIGNED') continue;
        if (assignedFilter === 'UNASSIGNED' && taskStatus !== 'UNASSIGNED') continue;

        if (staffFilter.length > 0) {
          if (!assignment || !staffFilter.includes(assignment.staffId)) continue;
        }

        const assignedStaff = assignment ? staffMap.get(assignment.staffId) : null;
        
        filtered.push({
          ...c,
          assignedTo: assignedStaff ? assignedStaff.name : null,
          taskStatus,
          checkInLocation: assignment?.checkInLocation,
          images: assignment?.images,
          outcome: assignment?.outcome,
          managerNotes: assignment?.managerNotes
        });
    }
    return filtered;
  }, [customers, assignments, staff, searchTerm, statusFilter, activeCategory, activeBatch, revenueRange, territoryFilter, regionFilter, batches, mode, assignedFilter, communeFilter, hamletFilter, staffFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeCategory, activeBatch, revenueRange, territoryFilter, regionFilter, assignedFilter, communeFilter, hamletFilter, staffFilter]);

  React.useEffect(() => {
    if (assignDialogOpen) {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      setAssignmentDeadline(date.toISOString().split('T')[0]);
      setAssignmentNotes('');
      setAssignmentPriority('MEDIUM');
      setAssignmentTaskType('Tư vấn nâng gói Cáp quang');
    }
  }, [assignDialogOpen]);

  React.useEffect(() => {
    if (historyTask) {
      const currentAssignment = assignments.find(a => a.customerId === historyTask.id);
      if (currentAssignment) {
        setAssignStaffIds([currentAssignment.staffId]);
        setAssignTaskType(currentAssignment.taskType || 'Tư vấn nâng gói Cáp quang');
        setAssignPriority(currentAssignment.priority || 'MEDIUM');
        setAssignDeadline(currentAssignment.deadline ? currentAssignment.deadline.substring(0, 10) : '');
        setAssignNotes(currentAssignment.managerNotes || '');
      } else {
        setAssignStaffIds([]);
        setAssignTaskType('Tư vấn nâng gói Cáp quang');
        setAssignPriority('MEDIUM');
        const date = new Date();
        date.setDate(date.getDate() + 3);
        setAssignDeadline(date.toISOString().split('T')[0]);
        setAssignNotes('');
      }
      setAssignStaffSearchTerm('');
    }
  }, [historyTask, assignments]);

  const paginatedCustomers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const uniqueRegions = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.region) set.add(c.region);
    });
    return Array.from(set).sort();
  }, [customers]);

  const uniqueTerritories = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      const matchesCategory = activeCategory === 'all' || c.categoryId === activeCategory;
      const matchesBatch = activeBatch === 'all' || c.campaignId === activeBatch;
      if (matchesCategory && matchesBatch && c.territory) {
        set.add(c.territory);
      }
    });
    return Array.from(set).sort();
  }, [customers, activeCategory, activeBatch]);

  const uniqueCommunes = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (territoryFilter.length > 0 && (!c.territory || !territoryFilter.includes(c.territory))) {
        return;
      }
      const addr = c.addressDetail || c.address || '';
      const parts = addr.split(',').map(p => p.trim());
      parts.forEach(part => {
        const lower = part.toLowerCase();
        if (
          lower.startsWith('xã ') || 
          lower.startsWith('phường ') || 
          lower.startsWith('thị trấn ')
        ) {
          const clean = part.replace(/^(xã|phường|thị trấn)\s+/i, (match) => {
            return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
          });
          set.add(clean);
        }
      });
    });
    return Array.from(set).sort();
  }, [customers, territoryFilter]);

  const uniqueHamlets = React.useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (territoryFilter.length > 0 && (!c.territory || !territoryFilter.includes(c.territory))) {
        return;
      }
      const addr = c.addressDetail || c.address || '';
      const parts = addr.split(',').map(p => p.trim());
      parts.forEach(part => {
        const lower = part.toLowerCase();
        if (
          lower.startsWith('thôn ') || 
          lower.startsWith('ấp ') || 
          lower.startsWith('bản ') || 
          lower.startsWith('xóm ') || 
          lower.startsWith('tổ ') ||
          lower.startsWith('phố ') || 
          lower.startsWith('đường ') ||
          lower.startsWith('đội ')
        ) {
          const clean = part.replace(/^(thôn|ấp|bản|xóm|tổ|phố|đường|đội)\s+/i, (match) => {
            return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
          });
          set.add(clean);
        }
      });
    });
    return Array.from(set).sort();
  }, [customers, territoryFilter]);

  const handleTerritoryFilterChange = (newTerrs: string[]) => {
    setTerritoryFilter(newTerrs);
    
    if (newTerrs.length > 0) {
      // 1. Filter staff managing these territories
      const mappedStaffIds = territories
        .filter(t => newTerrs.includes(t.name) && t.staffId)
        .map(t => t.staffId) as string[];
      
      if (mappedStaffIds.length > 0) {
        setStaffFilter(mappedStaffIds);
      } else {
        setStaffFilter([]);
      }

      // 2. Find matching customers to get exact communes/hamlets for the newTerrs
      const matchingCustomers = customers.filter(c => c.territory && newTerrs.includes(c.territory));
      
      // Compute unique communes/hamlets for these matching customers
      const tempCommunes = new Set<string>();
      const tempHamlets = new Set<string>();
      
      matchingCustomers.forEach(c => {
        const addr = c.addressDetail || c.address || '';
        const parts = addr.split(',').map(p => p.trim());
        parts.forEach(part => {
          const lower = part.toLowerCase();
          if (
            lower.startsWith('xã ') || 
            lower.startsWith('phường ') || 
            lower.startsWith('thị trấn ')
          ) {
            const clean = part.replace(/^(xã|phường|thị trấn)\s+/i, (match) => {
              return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
            });
            tempCommunes.add(clean);
          }
          if (
            lower.startsWith('thôn ') || 
            lower.startsWith('ấp ') || 
            lower.startsWith('bản ') || 
            lower.startsWith('xóm ') || 
            lower.startsWith('tổ ') ||
            lower.startsWith('phố ') || 
            lower.startsWith('đường ') ||
            lower.startsWith('đội ')
          ) {
            const clean = part.replace(/^(thôn|ấp|bản|xóm|tổ|phố|đường|đội)\s+/i, (match) => {
              return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
            });
            tempHamlets.add(clean);
          }
        });
      });

      const comList = Array.from(tempCommunes);
      const hamList = Array.from(tempHamlets);

      if (comList.length === 1) {
        setCommuneFilter(comList[0]);
      } else {
        setCommuneFilter('');
      }

      if (hamList.length === 1) {
        setHamletFilter(hamList[0]);
      } else {
        setHamletFilter('');
      }
    } else {
      // If territory filter is cleared, clear the dependent filters!
      setStaffFilter([]);
      setCommuneFilter('');
      setHamletFilter('');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        "TT": 1, 
        "TEN_TB": "Nguyễn Văn A", 
        "SO_DT": "0912345678", 
        "MA_TB_FIBER": "FIBER_001",
        "DOANHTHU": 250000,
        "KHU_VUC": "Hàm Yên",
        "O_DIA_BAN": "ĐB_BaDinh_01",
        "NVKD_QL": "Nguyễn Văn B",
        "NVKT_QL": "Nguyễn Văn C",
        "DIACHI_LD": "Số 1 Hùng Vương, Ba Đình, Hà Nội",
        "SERVICES": "Fiber, MyTV"
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "VNPT_Mau_Import_Tap_KH.xlsx");
    toast.success("Đã tải file mẫu thành công!");
  };

  const handleImportExcel = () => {
    if (activeCategory === 'all' || activeBatch === 'all') {
      toast.error("Vui lòng chọn Danh mục chương trình và Đợt triển khai cụ thể trước khi Import DS khách hàng!");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              toast.error("File Excel không có dữ liệu!");
              setIsImporting(false);
              return;
            }

            // --- OPTIMIZE: Map keys once rather than on every row ---
            const firstRowKeys = Object.keys(jsonData[0]);
            const normalizedKeys = firstRowKeys.map(k => ({
              original: k,
              normalized: k.toString().trim().toUpperCase().replace(/_/g, '').replace(/\s/g, '')
            }));

            const findHeaderKey = (keywords: string[]) => {
              const matchedKey = normalizedKeys.find(nk => 
                keywords.some(kw => nk.normalized === kw.toUpperCase().replace(/_/g, '').replace(/\s/g, ''))
              );
              return matchedKey ? matchedKey.original : null;
            };

            const keysMap = {
              id: findHeaderKey(['MA_TB_FIBER', 'MA_TB', 'MA_KH', 'ID', 'CUSTOMER_ID', 'THUE_BAO', 'KHACH_HANG', 'MÃ', 'SỐ THUÊ BAO', 'ACCOUNT']),
              services: findHeaderKey(['SERVICES', 'DICH_VU', 'DV', 'DỊCH VỤ', 'LOẠI HÌNH']),
              name: findHeaderKey(['TEN_TB', 'TEN_KH', 'NAME', 'CUSTOMER_NAME', 'TÊN', 'HỌ TÊN', 'TEN_KHACH_HANG']),
              categoryId: findHeaderKey(['CATEGORY', 'CH_DE', 'GROUP', 'CHỦ ĐỀ', 'DANH MỤC', 'PHÂN LOẠI']),
              campaignId: findHeaderKey(['BATCH', 'DOT', 'CAMPAIGN', 'ĐỢT', 'ĐỢT TRIỂN KHAI']),
              phone: findHeaderKey(['SO_DT', 'PHONE', 'SDT', 'SỐ ĐIỆN THOẠI', 'DI ĐỘNG', 'TELEPHONE']),
              region: findHeaderKey(['REGION', 'KHU_VUC', 'DON_VI', 'KHU VỰC', 'ĐƠN VỊ', 'TÀI LIỆU']),
              revenue: findHeaderKey(['DOANHTHU', 'REVENUE', 'DT', 'DOANH THU', 'CUOC_PS']),
              subscriptionId: findHeaderKey(['MA_TB_FIBER', 'MA_TB', 'SUBSCRIPTION_ID', 'MÃ TB', 'MA_THUE_BAO']),
              addressDetail: findHeaderKey(['DIACHI_LD', 'DIA_CHI', 'ADDRESS', 'ĐỊA CHỈ', 'DIACHI']),
              territory: findHeaderKey(['Ô địa bàn', 'TERRITORY', 'DIA_BAN', 'Ô ĐỊA BÀN', 'QUẦY', 'O_DIA_BAN']),
              salesManager: findHeaderKey(['NVKD Quản lý', 'NVKD_QL', 'SALES_MANAGER', 'NVKD', 'NVKD QUẢN LÝ']),
              technicalManager: findHeaderKey(['NVKT Quản lý', 'NVKT_QL', 'TECHNICAL_MANAGER', 'NVKT', 'NVKT QUẢN LÝ'])
            };

            const formattedCustomers: Customer[] = jsonData.map(item => {
              const rawId = keysMap.id ? item[keysMap.id] : undefined;
              const customerId = (rawId && String(rawId).trim()) ? String(rawId).trim() : 'kh' + Math.random().toString(36).substr(2, 9);
              
              const servicesStr = keysMap.services ? item[keysMap.services] : '';
              
              const rawName = keysMap.name ? item[keysMap.name] : undefined;
              const cleanName = (rawName && String(rawName).trim().toLowerCase() !== 'unknown') ? String(rawName).trim() : 'KH_' + customerId.slice(-4);
              
              const importedCat = keysMap.categoryId ? item[keysMap.categoryId] : undefined;
              const importedBatch = keysMap.campaignId ? item[keysMap.campaignId] : undefined;

              return {
                id: String(customerId).trim(),
                name: cleanName,
                phone: String((keysMap.phone ? item[keysMap.phone] : '') || '').replace(/Unknown/gi, ''),
                region: String((keysMap.region ? item[keysMap.region] : '') || '').replace(/Unknown/gi, ''),
                revenue: Number((keysMap.revenue ? item[keysMap.revenue] : 0) || 0),
                categoryId: (importedCat || (activeCategory === 'all' ? undefined : activeCategory)),
                campaignId: (importedBatch || (activeBatch === 'all' ? undefined : activeBatch)),
                services: servicesStr ? String(servicesStr).split(',').map((s: string) => s.trim()) : [],
                subscriptionId: String((keysMap.subscriptionId ? item[keysMap.subscriptionId] : undefined) || customerId).replace(/Unknown/gi, ''),
                addressDetail: String((keysMap.addressDetail ? item[keysMap.addressDetail] : '') || '').replace(/Unknown/gi, ''),
                territory: String((keysMap.territory ? item[keysMap.territory] : '') || '').replace(/Unknown/gi, ''),
                salesManager: String((keysMap.salesManager ? item[keysMap.salesManager] : '') || '').replace(/Unknown/gi, ''),
                technicalManager: String((keysMap.technicalManager ? item[keysMap.technicalManager] : '') || '').replace(/Unknown/gi, ''),
                createdAt: new Date().toISOString(),
                createdBy: authService.getCurrentUser()?.uid
              };
            });

            const result = await dataService.addCustomersBulk(formattedCustomers);
            
            if (result.added === 0 && result.updated === 0 && formattedCustomers.length > 0) {
              toast.warning("Không có khách hàng nào được xử lý.");
            } else if (result.added === 0 && result.updated > 0) {
              toast.success(`Đã cập nhật thông tin cho ${result.updated} khách hàng hiện tại.`);
            } else if (result.updated > 0) {
              toast.success(`Đã thêm mới ${result.added} và cập nhật ${result.updated} khách hàng.`);
            } else {
              toast.success(`Đã import thành công ${result.added} khách hàng mới!`);
            }
          } catch (error) {
            console.error("Import error:", error);
            toast.error("Lỗi khi xử lý file Excel");
          } finally {
            setIsImporting(false);
          }
        };
        reader.onerror = () => {
          toast.error("Lỗi khi đọc file");
          setIsImporting(false);
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  const handleAssign = async () => {
    if (selectedStaffIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhân viên.");
      return;
    }

    const customerMap = new Map<string, any>();
    customers.forEach(c => customerMap.set(c.id, c));

    const newAssignments: Assignment[] = selectedCustomers.map((cid, index) => {
      const customer = customerMap.get(cid);
      const computedCampaignId = customer?.campaignId || (activeBatch !== 'all' ? activeBatch : (batches[0]?.id || ''));
      return {
        customerId: cid,
        staffId: selectedStaffIds[index % selectedStaffIds.length],
        campaignId: computedCampaignId,
        status: 'PENDING',
        assignedDate: new Date().toISOString(),
        deadline: assignmentDeadline || undefined,
        managerNotes: assignmentNotes || undefined,
        priority: assignmentPriority,
        taskType: assignmentTaskType,
        assignedBy: authService.getCurrentUser()?.uid
      };
    });

    const result = await dataService.createAssignments(newAssignments);
    
    // Add notifications per assigned staff
    const assignedCounts: Record<string, number> = {};
    newAssignments.forEach(a => {
      assignedCounts[a.staffId] = (assignedCounts[a.staffId] || 0) + 1;
    });
    Object.entries(assignedCounts).forEach(([staffId, count]) => {
      const staffMember = staff.find(s => s.id === staffId);
      if (staffMember) {
        notificationService.addNotification({
          userId: staffId,
          title: 'Nhiệm vụ mới',
          message: `Bạn được giao ${count} khách hàng. Vui lòng kiểm tra "Nhiệm vụ".`,
          type: 'TASK',
          actionUrl: 'tasks'
        });
      }
    });

    if ((result as any).dbError) {
      toast.error(`Lỗi lưu lên Supabase: ${(result as any).dbError}. Đã lưu cục bộ.`);
    } else {
      if (result.updated > 0) {
        toast.success(`Đã điều chỉnh giao nhiệm vụ ${result.updated} và giao mới ${result.success - result.updated} khách hàng!`);
      } else {
        toast.success(`Đã giao thành công ${result.success} khách hàng cho ${selectedStaffIds.length} nhân viên!`);
      }
    }

    setAssignDialogOpen(false);
    setSelectedCustomers([]);
    setSelectedStaffIds([]);
  };

  const handleSingleAssign = async () => {
    if (!historyTask) return;
    if (assignStaffIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một nhân viên.");
      return;
    }

    const computedCampaignId = historyTask.campaignId || (activeBatch !== 'all' ? activeBatch : (batches[0]?.id || ''));
    
    const newAssignments: Assignment[] = assignStaffIds.map((sid) => {
      return {
        customerId: historyTask.id,
        staffId: sid,
        campaignId: computedCampaignId,
        status: 'PENDING',
        assignedDate: new Date().toISOString(),
        deadline: assignDeadline || undefined,
        managerNotes: assignNotes || undefined,
        priority: assignPriority,
        taskType: assignTaskType,
        assignedBy: authService.getCurrentUser()?.uid
      };
    });

    const result = await dataService.createAssignments(newAssignments);
    
    assignStaffIds.forEach(sid => {
      const staffMember = staff.find(s => s.id === sid);
      if (staffMember) {
        notificationService.addNotification({
          userId: sid,
          title: 'Nhiệm vụ mới',
          message: `Bạn được giao nhiệm vụ mới cho khách hàng: ${historyTask.name}. Vui lòng kiểm tra "Nhiệm vụ".`,
          type: 'TASK',
          actionUrl: 'tasks'
        });
      }
    });

    if ((result as any).dbError) {
      toast.error(`Lỗi lưu lên Supabase: ${(result as any).dbError}. Đã lưu cục bộ.`);
    } else {
      toast.success(`Đã giao việc thành công cho khách hàng "${historyTask.name}"!`);
    }

    setHistoryTask(null);
  };

  const handleOpenAssignByTerritory = () => {
    // Collect unique territories from the currently filtered customers
    const territoriesInFiltered = Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))) as string[];
    
    // Pre-fill mappings from userService if available
    const initialMappings: Record<string, string> = {};
    territoriesInFiltered.forEach(tName => {
      const systemT = territories.find(st => st.name === tName);
      if (systemT?.staffId) {
        initialMappings[tName] = systemT.staffId;
      }
    });
    
    setTerritoryMappings(initialMappings);
    setAssignByTerritoryDialogOpen(true);
  };

  const handleAssignByTerritorySubmit = async () => {
    const assignmentsToCreate: Assignment[] = [];
    
    filteredCustomers.forEach(customer => {
      if (customer.territory && territoryMappings[customer.territory]) {
        const defDeadline = new Date();
        defDeadline.setDate(defDeadline.getDate() + 3);
        const computedCampaignId = customer.campaignId || (activeBatch !== 'all' ? activeBatch : (batches[0]?.id || ''));
        assignmentsToCreate.push({
          customerId: customer.id,
          staffId: territoryMappings[customer.territory],
          campaignId: computedCampaignId,
          status: 'PENDING',
          assignedDate: new Date().toISOString(),
          deadline: defDeadline.toISOString().split('T')[0],
          priority: 'MEDIUM',
          taskType: 'Tư vấn nâng gói Cáp quang',
          managerNotes: 'Giao nhiệm vụ tự động theo ô địa bàn quản lý.',
          assignedBy: authService.getCurrentUser()?.uid
        });
      }
    });

    if (assignmentsToCreate.length === 0) {
      toast.error("Không có khách hàng nào được gán nhân sự.");
      return;
    }

    const result = await dataService.createAssignments(assignmentsToCreate);

    // Add notifications per assigned staff
    const assignedCounts: Record<string, number> = {};
    assignmentsToCreate.forEach(a => {
      assignedCounts[a.staffId] = (assignedCounts[a.staffId] || 0) + 1;
    });
    Object.entries(assignedCounts).forEach(([staffId, count]) => {
      const staffMember = staff.find(s => s.id === staffId);
      if (staffMember) {
        notificationService.addNotification({
          userId: staffId,
          title: 'Giao nhiệm vụ theo ô địa bàn',
          message: `Bạn được giao mới ${count} khách hàng tự động theo vùng.`,
          type: 'TASK',
          actionUrl: 'tasks'
        });
      }
    });

    if ((result as any).dbError) {
      toast.error(`Lỗi đồng bộ Supabase: ${(result as any).dbError}. Đã lưu cục bộ.`);
    } else {
      toast.success(`Đã giao thành công ${result.success} khách hàng theo địa bàn!`);
    }
    setAssignByTerritoryDialogOpen(false);
  };

  const handleCreateCategory = async () => {
    if (!newCat.name) {
      toast.error("Vui lòng nhập tên chủ đề.");
      return;
    }
    
    if (editingCategory) {
      await dataService.updateCategory(editingCategory.id, {
        name: newCat.name,
        description: newCat.description,
        services: newCat.services.split(',').map(s => s.trim())
      });
      toast.success(`Đã cập nhật chủ đề "${newCat.name}" thành công!`);
    } else {
      const cat = await dataService.addCategory({
        name: newCat.name,
        description: newCat.description,
        services: newCat.services.split(',').map(s => s.trim()),
        createdAt: new Date().toISOString(),
        createdBy: authService.getCurrentUser()?.uid
      });
      setActiveCategory(cat.id);
      toast.success(`Đã thêm chủ đề "${newCat.name}" thành công!`);
    }
    
    setAddCategoryDialogOpen(false);
    setEditingCategory(null);
    setNewCat({ name: '', description: '', services: '' });
  };

  const handleEditCategory = (cat: ProgramCategory) => {
    setEditingCategory(cat);
    setNewCat({
      name: cat.name,
      description: cat.description,
      services: cat.services.join(', ')
    });
    setAddCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    setConfirmDelete({
      open: true,
      title: 'Xóa chủ đề chương trình',
      description: `Bạn có chắc muốn xóa chủ đề "${name}"? Tất cả đợt triển khai và dữ liệu liên quan sẽ bị xóa sạch.`,
      onConfirm: async () => {
        await dataService.deleteCategory(id);
        toast.success("Đã xóa chủ đề chương trình.");
        setActiveCategory('all');
        setActiveBatch('all');
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleCreateBatch = async () => {
    if (!newBatch.name) {
      toast.error("Vui lòng nhập tên đợt.");
      return;
    }

    if (editingBatch) {
      await dataService.updateBatch(editingBatch.id, {
        ...newBatch
      });
      toast.success(`Đã cập nhật đợt "${newBatch.name}" thành công!`);
    } else {
      const batch = await dataService.addBatch({
        ...newBatch,
        programId: activeCategory,
        createdAt: new Date().toISOString(),
        createdBy: authService.getCurrentUser()?.uid
      });
      setActiveBatch(batch.id);
      toast.success(`Đã tạo đợt "${newBatch.name}" thành công!`);
    }

    setAddBatchDialogOpen(false);
    setEditingBatch(null);
    setNewBatch({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });
  };

  const handleEditBatch = (batch: ImplementationBatch) => {
    setEditingBatch(batch);
    setNewBatch({
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status
    });
    setAddBatchDialogOpen(true);
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    setConfirmDelete({
      open: true,
      title: 'Xóa đợt triển khai',
      description: `Bạn có chắc muốn xóa đợt "${name}"? Toàn bộ danh sách khách hàng trong đợt này sẽ bị xóa khỏi chương trình.`,
      onConfirm: async () => {
        await dataService.deleteBatch(id);
        toast.success("Đã xóa đợt triển khai.");
        setActiveBatch('all');
        setConfirmDelete(prev => ({ ...prev, open: false }));
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      {/* Upper Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Tổng tập KH', val: customers.length.toLocaleString(), icon: Users, color: 'blue' },
          { label: 'Đã giao NV', val: assignments.length.toLocaleString(), icon: Tag, color: 'emerald' },
          { label: 'Đang thực hiện', val: assignments.filter(a => a.status === 'IN_PROGRESS').length.toLocaleString(), icon: Clock, color: 'orange' },
          { label: 'Đã hoàn thành', val: assignments.filter(a => a.status === 'COMPLETED' || a.status === 'SUCCESS').length.toLocaleString(), icon: CheckCircle2, color: 'indigo' },
       ].map((stat, i) => (
         <Card key={i} className="border-none shadow-sm bg-white py-4 px-6 flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
              'bg-indigo-50 text-indigo-600'
            )}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 font-mono leading-none">{stat.val}</p>
            </div>
         </Card>
       ))}
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* Left Sidebar */}
        <div className={cn("w-full xl:col-span-3 space-y-6 flex flex-col h-auto xl:h-full xl:overflow-y-auto custom-scrollbar shrink-0", isSidebarCollapsed && "hidden")}>
           <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
               <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                 <LayoutGrid className="w-4 h-4 text-[#005BAA]" />
                 Danh mục chương trình
               </CardTitle>
               {mode === 'LIST' && (
                 <div className="flex items-center gap-1">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className={cn("w-6 h-6 rounded-lg transition-colors", isManageMode ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-slate-400 hover:text-[#005BAA]")}
                     onClick={() => setIsManageMode(!isManageMode)}
                     title={isManageMode ? "Thoát chế độ quản lý" : "Kích hoạt chế độ xóa/sửa"}
                   >
                     {isManageMode ? <Trash2 className="w-4 h-4" /> : <History className="w-4 h-4" />}
                   </Button>
                   <AnimatePresence>
                     <Dialog open={addCategoryDialogOpen} onOpenChange={(open) => {
                     setAddCategoryDialogOpen(open);
                     if (!open) {
                       setEditingCategory(null);
                       setNewCat({ name: '', description: '', services: '' });
                     }
                   }}>
                     <DialogTrigger 
                       render={
                         <Button variant="ghost" size="icon" className="w-6 h-6 rounded-lg text-[#005BAA] hover:bg-blue-50">
                           <Plus className="w-4 h-4" />
                         </Button>
                       }
                     />
                     <DialogContent className="sm:max-w-md rounded-3xl">
                       <DialogHeader>
                         <DialogTitle className="text-lg font-black uppercase tracking-tight">
                           {editingCategory ? 'Cập nhật chủ đề' : 'Thêm chủ đề mới'}
                         </DialogTitle>
                       </DialogHeader>
                       <div className="space-y-4 py-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400">Tên chủ đề / Nhóm sản phẩm</label>
                           <Input 
                             value={newCat.name}
                             onChange={e => setNewCat({...newCat, name: e.target.value})}
                             placeholder="Ví dụ: Dịch vụ VinaPhone trả sau" 
                             className="rounded-xl"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400">Mô tả ngắn</label>
                           <Input 
                             value={newCat.description}
                             onChange={e => setNewCat({...newCat, description: e.target.value})}
                             placeholder="Mô tả tệp khách hàng..." 
                             className="rounded-xl"
                           />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Dịch vụ áp dụng (Cách nhau dấu phẩy)</label>
                            <Input 
                              value={newCat.services}
                              onChange={e => setNewCat({...newCat, services: e.target.value})}
                              placeholder="VinaPhone, MyTV..." 
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setAddCategoryDialogOpen(false)}>Hủy</Button>
                          <Button className="bg-[#005BAA] rounded-xl font-bold uppercase text-[10px] px-8" onClick={handleCreateCategory}>
                            {editingCategory ? 'Cập nhật' : 'Tạo chủ đề'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </AnimatePresence>
                </div>
                )}
              </CardHeader>
              <CardContent className="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                 {categories.map((cat) => {
                   const catBatches = batches.filter(b => b.programId === cat.id);
                   let statusColor = "bg-slate-300";
                   let statusText = "Chưa có đợt";
                   
                   if (catBatches.length > 0) {
                     const now = new Date();
                     now.setHours(0, 0, 0, 0);
                     const activeBatches = catBatches.filter(b => b.status === "ACTIVE" || b.status === "UPCOMING");
                     
                     if (activeBatches.length === 0) {
                       statusColor = "bg-red-500";
                       statusText = "Đã dừng";
                     } else {
                       let isRunning = false;
                       let isEndingSoon = false;
                       activeBatches.forEach(b => {
                         const endDate = new Date(b.endDate);
                         endDate.setHours(0, 0, 0, 0);
                         const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                         if (diffDays >= 0 && diffDays <= 3) isEndingSoon = true;
                         else if (diffDays > 3) isRunning = true;
                       });
                       
                       if (isRunning) {
                         statusColor = "bg-green-500";
                         statusText = "Đang chạy";
                       } else if (isEndingSoon) {
                         statusColor = "bg-orange-500";
                         statusText = "Sắp dừng";
                       } else {
                         statusColor = "bg-red-500";
                         statusText = "Đã dừng";
                       }
                     }
                   }

                   return (
                   <div key={cat.id} className="relative group">
                     <button
                       onClick={() => {
                         if (activeCategory !== cat.id) {
                           setActiveCategory(cat.id);
                           setActiveBatch('all');
                         }
                       }}
                       className={cn(
                         "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border-l-4",
                         activeCategory === cat.id 
                           ? `bg-blue-50 text-[#005BAA] shadow-sm shadow-blue-100 border-[#005BAA]` 
                           : `text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200`
                       )}
                     >
                       <div className="min-w-0 flex-1 flex items-start gap-2.5">
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm", statusColor)} title={statusText} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate pr-3">{cat.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5 pr-3">{cat.description}</p>
                          </div>
                       </div>
                       <ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform group-hover:hidden", activeCategory === cat.id ? "translate-x-1" : "opacity-0")} />
                     </button>
                     
                     <div className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                        activeCategory === cat.id ? "opacity-100" : ""
                      )}>
                        {mode === 'LIST' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("w-6 h-6", activeCategory === cat.id ? "hover:bg-blue-200/50" : "hover:bg-slate-200/50")}
                              onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
                              title="Sửa chương trình"
                            >
                              <Pencil className="w-3 h-3 text-[#005BAA]" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("w-6 h-6", activeCategory === cat.id ? "hover:bg-blue-200/50" : "hover:bg-slate-200/50")}
                              onClick={(e) => { e.stopPropagation(); handleDeleteAllInCategory(cat.id, cat.name); }}
                              title="Xóa tất tập khách hàng khỏi chương trình (Hết chiến dịch)"
                            >
                              <UserMinus className="w-3 h-3 text-orange-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("w-6 h-6", activeCategory === cat.id ? "hover:bg-blue-200/50" : "hover:bg-slate-200/50")}
                              onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                              title="Xóa toàn bộ chương trình"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                   </div>
                 )})}
               </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
               <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-[#005BAA]" />
                 Đợt triển khai
               </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
               <div className="flex gap-2">
                 <Select value={activeBatch} onValueChange={setActiveBatch}>
                   <SelectTrigger className="flex-1 bg-slate-50 border-slate-100 rounded-xl h-10 font-bold text-xs uppercase tracking-tight">
                     <SelectValue placeholder="Chọn đợt..." />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl">
                     {(() => {
                        const availableBatches = batches.filter(b => (activeCategory === 'all' ? true : b.programId === activeCategory) && (mode === 'ASSIGN' ? b.status !== 'COMPLETED' : true));
                        if (availableBatches.length === 0 && activeCategory !== 'all') {
                          return (
                            <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase">
                              {mode === 'ASSIGN' ? 'Không có đợt triển khai khả dụng' : 'Chưa có đợt cho danh mục này'}
                            </div>
                          );
                        }
                        return (
                          <>
                            <SelectItem value="all" className="text-xs font-bold text-[#005BAA] focus:bg-blue-50">
                              Tất cả đợt
                            </SelectItem>
                            {availableBatches.map(batch => (
                              <SelectItem key={batch.id} value={batch.id} className="text-xs font-bold focus:bg-blue-50">
                                {batch.name}
                              </SelectItem>
                            ))}
                          </>
                        );
                     })()}
                   </SelectContent>
                 </Select>

                 {mode === 'LIST' && activeBatch !== 'all' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Sửa đợt triển khai"
                        className="h-10 w-10 shrink-0 border-slate-200 rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                        onClick={() => {
                          const batchToEdit = batches.find(b => b.id === activeBatch);
                          if (batchToEdit) handleEditBatch(batchToEdit);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Xóa đợt triển khai"
                        className="h-10 w-10 shrink-0 border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        onClick={() => {
                          const batchToDel = batches.find(b => b.id === activeBatch);
                          if (batchToDel) handleDeleteBatch(batchToDel.id, batchToDel.name);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                 )}

                 <Dialog open={addBatchDialogOpen} onOpenChange={setAddBatchDialogOpen}>
                    <DialogTrigger 
                      render={
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-dashed border-slate-300 rounded-xl hover:bg-blue-50 hover:text-blue-600">
                          <Plus className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-md rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-tight">
                          {editingBatch ? 'Cập nhật đợt triển khai' : 'Tạo đợt triển khai mới'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase text-[#005BAA]">Chủ đề: {selectedCategory?.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên đợt triển khai</label>
                          <Input 
                            placeholder="Ví dụ: Đợt Q3 - 2026" 
                            className="rounded-xl"
                            value={newBatch.name}
                            onChange={e => setNewBatch({...newBatch, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày bắt đầu</label>
                            <Input 
                              type="date" 
                              className="rounded-xl"
                              value={newBatch.startDate}
                              onChange={e => setNewBatch({...newBatch, startDate: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày đến hạn</label>
                            <Input 
                              type="date" 
                              className="rounded-xl"
                              value={newBatch.endDate}
                              onChange={e => setNewBatch({...newBatch, endDate: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Trạng thái</label>
                          <Select value={newBatch.status} onValueChange={(v: any) => setNewBatch({...newBatch, status: v})}>
                             <SelectTrigger className="rounded-xl">
                               <SelectValue placeholder="Chọn trạng thái" />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl">
                               <SelectItem value="ACTIVE" className="text-xs font-bold">Đang chạy</SelectItem>
                               <SelectItem value="UPCOMING" className="text-xs font-bold">Sắp tới</SelectItem>
                               <SelectItem value="COMPLETED" className="text-xs font-bold">Đã kết thúc / Dừng</SelectItem>
                             </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" className="rounded-xl font-bold uppercase text-[10px]" onClick={() => setAddBatchDialogOpen(false)}>Hủy</Button>
                        <Button className="bg-[#005BAA] rounded-xl font-bold uppercase text-[10px] px-8" onClick={handleCreateBatch}>
                          {editingBatch ? 'Cập nhật' : 'Lưu & Tiếp tục'}
                        </Button>
                      </div>
                    </DialogContent>
                 </Dialog>
               </div>
               
               {selectedBatch && (
                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative group">
                    {mode === 'LIST' && (
                      <div className={cn(
                        "absolute top-2 right-2 flex items-center gap-1 transition-all",
                        isManageMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <button 
                          onClick={() => handleEditBatch(selectedBatch)}
                          className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-100 transition-all font-bold"
                          title="Sửa đợt"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBatch(selectedBatch.id, selectedBatch.name)}
                          className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-100 transition-all font-bold"
                          title="Xóa đợt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Thông tin đợt</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">Bắt đầu:</span>
                        <span className="text-slate-900">{selectedBatch.startDate}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">Kết thúc:</span>
                        <span className="text-slate-900">{selectedBatch.endDate}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold mt-2">
                        <span className="text-slate-500">Trạng thái:</span>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase",
                          selectedBatch.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        )}>
                          {selectedBatch.status === 'ACTIVE' ? 'Đang chạy' : 'Sắp tới'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
             </CardContent>
           </Card>
         </div>

         {/* Right Content */}
         <div className={cn("w-full space-y-6 flex flex-col h-auto xl:h-full min-h-[600px] xl:min-h-0 shrink-0", isSidebarCollapsed ? "xl:col-span-12" : "xl:col-span-9")}>
           <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 h-full min-h-[600px] xl:min-h-0">
             <CardHeader className="p-4 sm:p-5 bg-white border-b border-slate-100 shrink-0">
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                  <div className="flex items-center gap-3">
                    <Button
                      id="toggle-sidebar-button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-500 hover:text-[#005BAA] hover:bg-blue-50 transition-colors shrink-0"
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      title={isSidebarCollapsed ? "Mở rộng phân nhóm" : "Thu gọn phân nhóm (Full màn hình)"}
                    >
                      {isSidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </Button>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                        {isSidebarCollapsed && (
                          <LayoutGrid className="w-4 h-4 text-[#005BAA] animate-pulse shrink-0" />
                        )}
                        {selectedCategory?.name || 'Tất cả khách hàng'}
                      </h2>
                      <p className="text-[9px] text-[#005BAA] font-black uppercase tracking-wider mt-1.5 leading-none">
                        {selectedBatch?.name ? `${selectedBatch.name}` : 'Mọi đợt triển khai'} {selectedCategory?.services && `| ${selectedCategory.services.join(' • ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                      {mode === 'LIST' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-slate-200 h-9 text-[10px] font-black uppercase tracking-wider text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm">
                              <Settings className="w-4 h-4 mr-2 text-slate-500" />
                              Công cụ dữ liệu
                              <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 rounded-2xl p-1.5 shadow-xl border border-slate-100" align="end">
                            <span className="block px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans">Quản lý khách hàng</span>
                            <DropdownMenuItem onClick={() => setAddCustomerDialogOpen(true)} className="text-xs font-bold py-2.5 px-3 rounded-xl text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-emerald-500" />
                              Thêm lẻ khách hàng
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1.5" />
                            <span className="block px-2 py-1 text-[8px] font-black uppercase tracking-wider text-slate-400 font-sans">Thao tác Excel</span>
                            <DropdownMenuItem onClick={handleDownloadTemplate} className="text-xs font-bold py-2.5 px-3 rounded-xl text-blue-600 focus:text-blue-700 focus:bg-blue-50 cursor-pointer flex items-center gap-2">
                              <Download className="w-4 h-4 text-blue-500" />
                              Tải tệp mẫu Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleImportExcel} disabled={isImporting} className="text-xs font-bold py-2.5 px-3 rounded-xl text-slate-700 focus:bg-slate-50 cursor-pointer flex items-center gap-2">
                              {isImporting ? <Loader2 className="w-4 h-4 animate-spin text-[#005ba1]" /> : <FileUp className="w-4 h-4 text-[#005ba1]" />}
                              Import danh sách Excel
                            </DropdownMenuItem>
                            {isManageMode && activeBatch !== 'all' && (
                              <>
                                <DropdownMenuSeparator className="bg-slate-100 my-1.5" />
                                <span className="block px-2 py-1 text-[8px] font-black uppercase tracking-wider text-rose-450 font-bold font-sans">Tác vụ khẩn</span>
                                <DropdownMenuItem onClick={handleDeleteAllInBatch} className="text-xs font-bold py-2.5 px-3 rounded-xl text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer flex items-center gap-2">
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  Xóa sạch đợt hiện tại
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button 
                        onClick={() => setExportDialogOpen(true)} 
                        variant="outline" 
                        className="border-slate-200 h-9 text-[10px] font-black uppercase tracking-wider text-orange-600 rounded-xl hover:bg-orange-50 shadow-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Xuất báo cáo
                      </Button>
                      <Button 
                        onClick={() => setAssignDialogOpen(true)}
                        disabled={selectedCustomers.length === 0}
                        className="bg-[#005BAA] hover:bg-blue-700 h-9 font-black shadow-lg shadow-blue-100 uppercase text-[10px] tracking-wider rounded-xl disabled:opacity-50"
                      >
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Giao tập khách hàng theo chiến dịch
                      </Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-slate-50/30 flex-1 flex flex-col min-h-0 relative">
               {loading ? (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="font-bold text-xs uppercase">Đang tải dữ liệu realtime...</p>
                 </div>
               ) : (
                 <div className="flex flex-col flex-1 h-full min-h-0">
                   <div className="flex flex-col md:flex-row gap-3 justify-between items-center mb-4">
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                      <div className="relative flex-1 md:w-72 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input 
                          placeholder="Tìm theo tên hoặc số điện thoại..." 
                          className="pl-9 bg-white border-slate-200 h-9 text-xs rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-blue-400" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[145px] bg-white border-slate-200 h-9 rounded-xl font-bold text-[10px] uppercase shadow-sm">
                            <SelectValue placeholder="Trạng thái" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="ALL" className="text-[10px] font-bold">Tất cả trạng thái</SelectItem>
                            <SelectItem value="UNASSIGNED" className="text-[10px] font-bold text-slate-400">Chưa giao</SelectItem>
                            <SelectItem value="PENDING" className="text-[10px] font-bold text-yellow-600">Đã giao / Chờ</SelectItem>
                            <SelectItem value="IN_PROGRESS" className="text-[10px] font-bold text-blue-600">Đang xử lý</SelectItem>
                            <SelectItem value="COMPLETED" className="text-[10px] font-bold text-emerald-600">Đã hoàn tất</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button 
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          variant="outline"
                          className={cn(
                            "gap-1.5 border-slate-200 bg-white hover:bg-blue-50 h-9 text-xs font-bold text-slate-600 rounded-xl transition-all shadow-sm",
                            showAdvancedFilters && "bg-blue-50 border-blue-400 text-[#005BAA]"
                          )}
                        >
                          <Filter className="w-3.5 h-3.5" />
                          Lọc nâng cao
                          {(revenueRange !== "ALL" || regionFilter.length > 0 || territoryFilter.length > 0 || assignedFilter !== "ALL" || communeFilter !== "" || hamletFilter !== "" || staffFilter.length > 0) && (
                            <span className="ml-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          )}
                        </Button>

                        <Button onClick={handleOpenAssignByTerritory} variant="outline" className="gap-1.5 border-slate-200 bg-white hover:bg-emerald-50 h-9 text-xs font-bold text-emerald-600 rounded-xl shadow-sm">
                          <MapIcon className="w-3.5 h-3.5" />
                          Giao theo Ô
                        </Button>
                      </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      {/* Functions removed per request */}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAdvancedFilters && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mb-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 p-5 bg-blue-50/40 border border-blue-100/50 rounded-2xl">
                          {/* Filter: Assigned status */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phân giao nhiệm vụ</label>
                            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                              <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase">
                                <SelectValue placeholder="Phân giao" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="text-[11px] font-bold">Tất cả (Giao & Chưa)</SelectItem>
                                <SelectItem value="ASSIGNED" className="text-[11px] font-bold text-blue-600">Đã phân giao</SelectItem>
                                <SelectItem value="UNASSIGNED" className="text-[11px] font-bold text-slate-400">Chưa phân giao</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filter: Revenue level */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Doanh thu thuê bao</label>
                            <Select value={revenueRange} onValueChange={setRevenueRange}>
                              <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase">
                                <SelectValue placeholder="Doanh thu" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="ALL" className="text-[11px] font-bold">Mọi mức DT</SelectItem>
                                <SelectItem value="HIGH" className="text-[11px] font-bold text-emerald-600">Cao ({'>'}= 500k)</SelectItem>
                                <SelectItem value="MID" className="text-[11px] font-bold text-blue-600">Vừa (200k - 500k)</SelectItem>
                                <SelectItem value="LOW" className="text-[11px] font-bold text-slate-500">Thấp ({'<'} 200k)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filter: Quận / Huyện */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chọn Quận / Huyện</label>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="outline" className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase justify-between font-sans shadow-sm">
                                    <span className="truncate">
                                      {regionFilter.length === 0 ? "Tất cả Quận/Huyện" : `Đã chọn: ${regionFilter.length} Quận`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent className="w-auto max-w-[400px] min-w-[240px] rounded-xl max-h-[400px] overflow-y-auto custom-scrollbar" align="start">
                                <DropdownMenuCheckboxItem
                                  checked={regionFilter.length === 0}
                                  onCheckedChange={() => setRegionFilter([])}
                                  className="text-[11px] font-bold py-2"
                                >
                                  Tất cả Quận / Huyện
                                </DropdownMenuCheckboxItem>
                                {uniqueRegions.map(r => (
                                  <DropdownMenuCheckboxItem
                                    key={r}
                                    checked={regionFilter.includes(r)}
                                    onCheckedChange={(checked) => {
                                      setRegionFilter(prev => 
                                        checked ? [...prev, r] : prev.filter(x => x !== r)
                                      )
                                    }}
                                    className="text-[11px] font-bold py-2 uppercase"
                                  >
                                    {r}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Filter: Địa bàn (Ô) */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chọn Địa bàn (Ô)</label>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="outline" className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase justify-between font-sans shadow-sm">
                                    <span className="truncate">
                                      {territoryFilter.length === 0 ? "Tất cả địa bàn" : `Đã chọn: ${territoryFilter.length} ô`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent className="w-auto max-w-[400px] min-w-[240px] rounded-xl max-h-[400px] overflow-y-auto custom-scrollbar" align="start">
                                <DropdownMenuCheckboxItem
                                  checked={territoryFilter.length === 0}
                                  onCheckedChange={() => handleTerritoryFilterChange([])}
                                  className="text-[11px] font-bold py-2"
                                >
                                  Tất cả địa bàn
                                </DropdownMenuCheckboxItem>
                                {uniqueTerritories.map(t => (
                                  <DropdownMenuCheckboxItem
                                    key={t}
                                    checked={territoryFilter.includes(t)}
                                    onCheckedChange={(checked) => {
                                      const updated = checked 
                                        ? [...territoryFilter, t] 
                                        : territoryFilter.filter(x => x !== t);
                                      handleTerritoryFilterChange(updated);
                                    }}
                                    className="text-[11px] font-bold py-2"
                                  >
                                    {t}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Filter: Xã / Phường */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Xã / Phường</label>
                            <div className="relative w-full">
                              <Input 
                                list="commune-suggestions"
                                value={communeFilter}
                                onChange={(e) => setCommuneFilter(e.target.value)}
                                placeholder="Nhập tên xã/phường..."
                                className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase pr-8 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-400 placeholder:text-slate-400"
                              />
                              {communeFilter && (
                                <button 
                                  onClick={() => setCommuneFilter('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                                >
                                  ✕
                                </button>
                              )}
                              <datalist id="commune-suggestions">
                                {uniqueCommunes.map(c => (
                                  <option key={c} value={c} />
                                ))}
                              </datalist>
                            </div>
                          </div>

                          {/* Filter: Thôn / Xóm / Phố */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Thôn / Xóm / Phố</label>
                            <div className="relative w-full">
                              <Input 
                                list="hamlet-suggestions"
                                value={hamletFilter}
                                onChange={(e) => setHamletFilter(e.target.value)}
                                placeholder="Nhập tên thôn/xóm/phố..."
                                className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase pr-8 shadow-sm focus-visible:ring-1 focus-visible:ring-blue-400 placeholder:text-slate-400"
                              />
                              {hamletFilter && (
                                <button 
                                  onClick={() => setHamletFilter('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                                >
                                  ✕
                                </button>
                              )}
                              <datalist id="hamlet-suggestions">
                                {uniqueHamlets.map(h => (
                                  <option key={h} value={h} />
                                ))}
                              </datalist>
                            </div>
                          </div>

                          {/* Filter: Nhân sự thực hiện */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nhân sự thực hiện</label>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="outline" className="w-full bg-white border-slate-200 h-10 rounded-xl font-bold text-[11px] uppercase justify-between font-sans shadow-sm">
                                    <span className="truncate">
                                      {staffFilter.length === 0 ? "Tất cả nhân sự" : `Đã chọn: ${staffFilter.length}`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent className="w-auto max-w-[400px] min-w-[240px] rounded-xl max-h-[320px] overflow-y-auto custom-scrollbar" align="start">
                                <DropdownMenuCheckboxItem
                                  checked={staffFilter.length === 0}
                                  onCheckedChange={() => setStaffFilter([])}
                                  className="text-[11px] font-bold py-2"
                                >
                                  Tất cả nhân sự
                                </DropdownMenuCheckboxItem>
                                {staff.map(s => (
                                  <DropdownMenuCheckboxItem
                                    key={s.id}
                                    checked={staffFilter.includes(s.id)}
                                    onCheckedChange={(checked) => {
                                      setStaffFilter(prev => 
                                        checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                                      )
                                    }}
                                    className="text-[11px] font-bold py-2 uppercase"
                                  >
                                    {s.name}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="w-full overflow-x-auto overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      <Table className="min-w-[1200px]">
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12 px-6">
                            <Checkbox 
                              checked={paginatedCustomers.length > 0 && paginatedCustomers.every(c => selectedCustomers.includes(c.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers(prev => {
                                    const pageIds = paginatedCustomers.map(c => c.id);
                                    const merged = new Set([...prev, ...pageIds]);
                                    return Array.from(merged);
                                  });
                                } else {
                                  setSelectedCustomers(prev => {
                                    const pageIds = paginatedCustomers.map(c => c.id);
                                    return prev.filter(id => !pageIds.includes(id));
                                  });
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-slate-400 whitespace-nowrap tracking-wider">Khách hàng / Mã TB</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-slate-400 whitespace-nowrap tracking-wider min-w-[200px]">Địa chỉ / Doanh thu</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-slate-400 whitespace-nowrap tracking-wider">Quản lý Ô / NVKD / NVKT</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-slate-400 text-center whitespace-nowrap tracking-wider">Nhân sự thực hiện</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-slate-400 text-center whitespace-nowrap tracking-wider">Tiến độ</TableHead>
                          <TableHead className="text-right px-6 text-[10px] uppercase font-black text-slate-400"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCustomers.length > 0 ? paginatedCustomers.map((customer) => (
                          <TableRow key={`row-${customer.id}`} className="hover:bg-blue-50/20 transition-colors group">
                            <TableCell className="px-6">
                              <Checkbox 
                                checked={selectedCustomers.includes(customer.id)}
                                disabled={customer.taskStatus === 'COMPLETED' || customer.taskStatus === 'SUCCESS'}
                                onCheckedChange={(checked) => {
                                  setSelectedCustomers(prev => 
                                    checked ? [...prev, customer.id] : prev.filter(id => id !== customer.id)
                                  )
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-slate-900 uppercase text-xs">{customer.name}</div>
                                {customer.assignedTo && (
                                  <div className="group relative">
                                    <AlertCircle className="w-4 h-4 text-orange-500 animate-pulse cursor-help" />
                                    <div className="absolute left-6 top-0 w-64 p-3 bg-white border border-orange-100 shadow-xl rounded-2xl z-50 hidden group-hover:block transition-all scale-95 origin-left group-hover:scale-100">
                                       <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Cảnh báo giao trùng</p>
                                       <p className="text-[11px] font-medium text-slate-600">
                                         KH đã giao cho <span className="font-bold text-slate-900">{customer.assignedTo}</span>. Hiện trạng: <span className="text-orange-500 font-bold">{getTaskStatusLabel(customer.taskStatus)}</span>
                                       </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <div className="text-[10px] text-slate-400 font-mono">{customer.phone}</div>
                                {customer.subscriptionId && <div className="text-[9px] font-black text-[#005BAA] bg-blue-50 px-1.5 py-0.5 rounded w-fit uppercase">{customer.subscriptionId}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-slate-600 font-bold text-[10px] uppercase tracking-tighter line-clamp-1 max-w-[200px]">{customer.addressDetail || customer.address}</div>
                              <div className="font-black text-emerald-600 font-mono text-[10px] mt-0.5">{customer.revenue?.toLocaleString()} đ</div>
                              <div className="text-[9px] text-slate-400 italic">{customer.services?.join(', ')}</div>
                            </TableCell>
                            <TableCell>
                               <div className="space-y-1">
                                  {customer.territory && (
                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
                                      <MapIcon className="w-3 h-3 text-blue-400" />
                                      <span>{customer.territory}</span>
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-0.5">
                                    {customer.salesManager && <div className="text-[9px] text-slate-500"><span className="font-black text-slate-400 mr-1 uppercase">KD:</span> {customer.salesManager}</div>}
                                    {customer.technicalManager && <div className="text-[9px] text-slate-500"><span className="font-black text-slate-400 mr-1 uppercase">KT:</span> {customer.technicalManager}</div>}
                                    {!customer.salesManager && !customer.technicalManager && !customer.territory && <span className="text-[9px] text-slate-300 italic">Chưa cập nhật địa bàn</span>}
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell>
                               {customer.assignedTo ? (
                                 <div className="flex flex-col items-center justify-center">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-[#005BAA] border-2 border-white shadow-sm">
                                       {customer.assignedTo.split(' ').pop()?.charAt(0)}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-700 mt-1">{customer.assignedTo}</p>
                                 </div>
                               ) : (
                                 <div className="flex flex-col items-center justify-center text-[9px] text-slate-400 italic">
                                   <Users className="w-3.5 h-3.5 mb-1" />
                                   <span>Chưa giao</span>
                                 </div>
                               )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div 
                                className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setHistoryTask(customer)}
                              >
                                <Badge className={cn(
                                  "text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg border shadow-sm",
                                  getTaskStatusStyle(customer.taskStatus)
                                )}>
                                  {getTaskStatusLabel(customer.taskStatus)}
                                </Badge>
                                <div className="flex gap-1.5 justify-center mt-0.5">
                                  {customer.checkInLocation && (
                                    <div 
                                      className="group/gps relative cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://www.google.com/maps?q=${customer.checkInLocation.lat},${customer.checkInLocation.lng}`, '_blank');
                                      }}
                                    >
                                      <MapIcon className="w-3.5 h-3.5 text-[#005BAA] hover:scale-125 transition-transform" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white rounded-xl opacity-0 group-hover/gps:opacity-100 pointer-events-none transition-all scale-90 group-hover/gps:scale-100 shadow-xl z-[100] min-w-[150px]">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#005BAA] mb-1">Vị trí thực tế</p>
                                        <p className="text-[10px] font-mono leading-none">{customer.checkInLocation.lat.toFixed(6)}, {customer.checkInLocation.lng.toFixed(6)}</p>
                                        <p className="text-[8px] text-slate-400 mt-2 font-bold uppercase italic">Click để xem bản đồ chi tiết</p>
                                      </div>
                                    </div>
                                  )}
                                  {customer.images && (customer.images as any).length > 0 && (
                                    <div className="group/cam relative">
                                      <Camera className="w-3 h-3 text-emerald-500" />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white border border-slate-200 shadow-xl rounded-lg opacity-0 group-hover/cam:opacity-100 pointer-events-none transition-opacity z-50">
                                        <div className="flex gap-1">
                                           {(customer.images as string[]).slice(0, 3).map((img, idx) => (
                                             <img key={idx} src={img} className="w-8 h-8 object-cover rounded transition-all duration-300 hover:scale-[4] hover:-translate-y-8 hover:z-50 hover:shadow-2xl relative cursor-zoom-in origin-bottom" referrerPolicy="no-referrer" alt="preview" />
                                           ))}
                                           {(customer.images as string[]).length > 3 && (
                                             <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-[8px] font-black text-slate-400">
                                               +{(customer.images as string[]).length - 3}
                                             </div>
                                           )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-6">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  onClick={() => setHistoryTask(customer)}
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </Button>
                                {(mode !== 'LIST' || true) && (
                                 <Button 
                                   onClick={() => {
                                     setSelectedCustomers([customer.id]);
                                     setAssignDialogOpen(true);
                                   }}
                                   variant="ghost" 
                                   size="icon" 
                                   className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#005ba1]"
                                   title={customer.assignedTo ? "Điều chỉnh giao nhiệm vụ" : "Giao việc cho NV"}
                                 >
                                   <UserPlus className="w-3.5 h-3.5" />
                                 </Button>
                                )}
                                {mode === 'LIST' && isManageMode && (
                                  <Button 
                                    onClick={() => handleDeleteIndividual(customer.id, customer.name)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                                    title="Xóa khách hàng"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <Search className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-widest opacity-50">Không có dữ liệu phù hợp</p>
                                <p className="text-xs font-medium max-w-xs mt-2 opacity-40">Thử đổi danh mục chương trình hoặc đợt triển khai khác để xem thêm khách hàng</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Section */}
                  {filteredCustomers.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>Hiển thị</span>
                        <Select 
                          value={String(pageSize)} 
                          onValueChange={(val) => {
                            setPageSize(Number(val));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 h-8 rounded-lg text-slate-700 bg-white border-slate-200">
                            <SelectValue placeholder="25" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="1000">1000</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>mỗi trang.</span>
                        <span className="ml-2 font-semibold text-slate-700">
                          {Math.min(filteredCustomers.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredCustomers.length, currentPage * pageSize)} / {filteredCustomers.length} KH
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 rounded-lg border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          <span className="text-xs">&larr;</span>
                        </Button>

                        {(() => {
                          const pages = [];
                          let startPage = Math.max(1, currentPage - 1);
                          let endPage = Math.min(totalPages, currentPage + 1);

                          if (currentPage === 1) {
                            endPage = Math.min(totalPages, Math.max(1, Math.min(totalPages, 3)));
                          } else if (currentPage === totalPages) {
                            startPage = Math.max(1, totalPages - 2);
                          }

                          if (startPage > 1) {
                            pages.push(
                              <Button
                                key={1}
                                variant={currentPage === 1 ? "default" : "outline"}
                                className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === 1 ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                                onClick={() => setCurrentPage(1)}
                              >
                                1
                              </Button>
                            );
                            if (startPage > 2) {
                              pages.push(<span key="ellips-start" className="text-slate-400 px-1 text-xs">...</span>);
                            }
                          }

                          for (let p = startPage; p <= endPage; p++) {
                            pages.push(
                              <Button
                                key={p}
                                variant={currentPage === p ? "default" : "outline"}
                                className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === p ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                                onClick={() => setCurrentPage(p)}
                              >
                                {p}
                              </Button>
                            );
                          }

                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(<span key="ellips-end" className="text-slate-400 px-1 text-xs">...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPages}
                                variant={currentPage === totalPages ? "default" : "outline"}
                                className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === totalPages ? "bg-slate-900 text-white hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}
                                onClick={() => setCurrentPage(totalPages)}
                              >
                                {totalPages}
                              </Button>
                            );
                          }

                          return pages;
                        })()}

                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 rounded-lg border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                          <span className="text-xs">&rarr;</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
               </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {selectedCustomers.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-8 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-6 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex flex-col">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đã chọn</p>
               <p className="text-sm font-black"><span className="text-[#005BAA] text-lg">{selectedCustomers.length}</span> Khách hàng</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              {mode === 'LIST' && (
                <Button onClick={handleDeleteSelected} variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-500/10 font-bold h-10 px-4 rounded-xl text-[11px] uppercase tracking-wide">
                  <Trash2 className="w-4 h-4 mr-2" /> Xóa tập KH
                </Button>
              )}
              {(mode !== 'LIST' || true) && (
                <>
                  <Button onClick={handleDeleteAssignments} variant="ghost" className="text-orange-400 hover:text-orange-500 hover:bg-orange-500/10 font-bold h-10 px-4 rounded-xl text-[11px] uppercase tracking-wide">
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa nhiệm vụ
                  </Button>
                  <Button onClick={() => setAssignDialogOpen(true)} size="sm" className="bg-[#005ba1] hover:bg-blue-600 font-bold h-10 px-6 rounded-xl text-[11px] uppercase tracking-wide shadow-xl shadow-blue-500/20">Giao việc cho NV</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={confirmDelete.open} onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-red-500 p-6 text-white text-center">
              <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Xác nhận xóa</DialogTitle>
              <p className="text-xs opacity-75 font-bold uppercase tracking-widest mt-1">Dữ liệu sẽ bị xóa vĩnh viễn</p>
           </div>
           <div className="p-8 text-center bg-white">
              <p className="text-slate-600 font-medium mb-6">
                {confirmDelete.description}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setConfirmDelete(prev => ({ ...prev, open: false }))} className="flex-1 rounded-xl font-bold uppercase text-[10px]">Hủy bỏ</Button>
                <Button onClick={confirmDelete.onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px]">Xác nhận xóa</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newTaskTypeDialogOpen} onOpenChange={setNewTaskTypeDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#005BAA] p-6 text-white font-bold">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Thêm loại hình công việc</DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                Tạo loại hình triển khai mới
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tên loại hình</label>
              <Input
                placeholder="Nhập tên loại hình..."
                value={newTaskType}
                onChange={e => setNewTaskType(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTaskType();
                }}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setNewTaskTypeDialogOpen(false)} variant="ghost" className="flex-1 font-black text-slate-400 h-10 rounded-xl uppercase text-[11px]">Hủy bỏ</Button>
              <Button onClick={handleAddTaskType} className="flex-1 font-black bg-[#005BAA] hover:bg-blue-700 h-10 rounded-xl uppercase text-[11px] text-white" disabled={!newTaskType.trim()}>Lưu lại</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[95vh] flex flex-col">
          <div className="bg-[#005BAA] p-6 text-white font-bold shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-200 animate-pulse" />
                Giao tập khách hàng theo chiến dịch
              </DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                Tập: {selectedCategory?.name} | Số lượng: {selectedCustomers.length} KH
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6 bg-white overflow-y-auto custom-scrollbar flex-1 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Users className="w-4 h-4 text-[#005BAA]" />
                     <label className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Chọn nhân sự thụ lý ({selectedStaffIds.length})</label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    type="button"
                    className="text-[10px] font-black uppercase text-[#005BAA]"
                    onClick={() => {
                      if (selectedStaffIds.length === staff.length) setSelectedStaffIds([]);
                      else setSelectedStaffIds(staff.map(s => s.id));
                    }}
                  >
                    {selectedStaffIds.length === staff.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </Button>
                </div>
                
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Tìm kiếm nhân sự..."
                    value={staffSearchTerm}
                    onChange={(e) => setStaffSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {staff.filter(s => s.name.toLowerCase().includes(staffSearchTerm.toLowerCase())).map(s => (
                    <div 
                      key={s.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border",
                        selectedStaffIds.includes(s.id) 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white border-transparent hover:border-slate-200"
                      )}
                      onClick={() => {
                        setSelectedStaffIds(prev => 
                          prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {s.name.split(' ').pop()?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-900">{s.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{s.role}</span>
                        </div>
                      </div>
                      <Checkbox checked={selectedStaffIds.includes(s.id)} />
                    </div>
                  ))}
                </div>

                {selectedStaffIds.length > 1 && (
                  <p className="text-[10px] text-slate-400 italic text-center font-medium">
                    Hệ thống sẽ tự động chia đều {selectedCustomers.length} khách hàng cho {selectedStaffIds.length} nhân viên đã chọn.
                  </p>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#005BAA]" />
                  Thông tin bổ sung khi giao việc
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Loại hình triển khai</label>
                      <Button type="button" variant="ghost" size="sm" className="h-4 px-1 text-[10px] text-[#005BAA] font-black uppercase" onClick={() => setNewTaskTypeDialogOpen(true)}>+ Thêm mới</Button>
                    </div>
                    <Select value={assignmentTaskType} onValueChange={setAssignmentTaskType}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-semibold">
                        <SelectValue placeholder="Chọn loại hình..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {taskTypes.map(t => (
                          <SelectItem key={t} value={t} className="text-xs font-bold">{t === 'Khác' ? 'Nhiệm vụ khác' : t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Độ ưu tiên</label>
                    <Select value={assignmentPriority} onValueChange={(v: any) => setAssignmentPriority(v)}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-semibold">
                        <SelectValue placeholder="Chọn mức ưu tiên..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="HIGH" className="text-xs font-black text-rose-600">🔴 Cao / Khẩn cấp</SelectItem>
                        <SelectItem value="MEDIUM" className="text-xs font-bold text-amber-600">🟡 Trung bình</SelectItem>
                        <SelectItem value="LOW" className="text-xs font-bold text-emerald-600">🟢 Thấp / Bình thường</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hạn xử lý (Deadline)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <Input
                        type="date"
                        className="pl-10 h-10 rounded-xl text-xs font-semibold"
                        value={assignmentDeadline}
                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ghi chú & Chỉ đạo của Quản lý</label>
                  <textarea
                    className="flex min-h-[70px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#005BAA] focus-visible:bg-white transition-colors"
                    placeholder="Chỉ đạo, ghi chú của quản lý khi giao nhiệm vụ này cho nhân viên triển khai..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                  />
                </div>
              </div>

             <div className="flex gap-3 pt-4">
                <Button onClick={() => setAssignDialogOpen(false)} variant="ghost" className="flex-1 font-black text-slate-400 h-12 rounded-2xl uppercase text-[11px]">Hủy bỏ</Button>
                <Button onClick={handleAssign} className="flex-2 font-black bg-[#005BAA] hover:bg-blue-700 h-12 rounded-2xl uppercase text-[11px]">Xác nhận giao việc</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addCustomerDialogOpen} onOpenChange={setAddCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white font-bold">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Thêm khách hàng thủ công</DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                Gắn vào đợt: {selectedBatch?.name}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Họ tên khách hàng</label>
                <Input 
                  placeholder="Nguyễn Văn A" 
                  className="rounded-xl"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số điện thoại</label>
                <Input 
                  placeholder="091..." 
                  className="rounded-xl"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mã TB (MA_TB_FIBER)</label>
                <Input 
                  placeholder="FIBER_..." 
                  className="rounded-xl"
                  value={newCustomer.subscriptionId}
                  onChange={e => setNewCustomer({...newCustomer, subscriptionId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Doanh thu hiện tại</label>
                <Input 
                  type="number"
                  placeholder="150000" 
                  className="rounded-xl"
                  value={newCustomer.revenue}
                  onChange={e => setNewCustomer({...newCustomer, revenue: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Địa bàn / Khu vực</label>
                <Input 
                  placeholder="Ví dụ: Hàm Yên" 
                  className="rounded-xl"
                  value={newCustomer.region}
                  onChange={e => setNewCustomer({...newCustomer, region: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ô địa bàn</label>
                <Input 
                  placeholder="ĐB_..." 
                  className="rounded-xl"
                  value={newCustomer.territory}
                  onChange={e => setNewCustomer({...newCustomer, territory: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">NVKD Quản lý</label>
                <Input 
                  placeholder="Tên NVKD..." 
                  className="rounded-xl"
                  value={newCustomer.salesManager}
                  onChange={e => setNewCustomer({...newCustomer, salesManager: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">NVKT Quản lý</label>
                <Input 
                  placeholder="Tên NVKT..." 
                  className="rounded-xl"
                  value={newCustomer.technicalManager}
                  onChange={e => setNewCustomer({...newCustomer, technicalManager: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Địa chỉ chi tiết (DIACHI_LD)</label>
              <Input 
                placeholder="Số nhà, đường..." 
                className="rounded-xl"
                value={newCustomer.addressDetail}
                onChange={e => setNewCustomer({...newCustomer, addressDetail: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Các dịch vụ đang sử dụng (Cách nhau dấu phẩy)</label>
              <Input 
                placeholder="Fiber, MyTV..." 
                className="rounded-xl"
                value={newCustomer.services}
                onChange={e => setNewCustomer({...newCustomer, services: e.target.value})}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setAddCustomerDialogOpen(false)} variant="ghost" className="flex-1 font-black text-slate-400 h-12 rounded-2xl uppercase text-[11px]">Hủy bỏ</Button>
              <Button onClick={handleAddCustomer} className="flex-1 font-black bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl uppercase text-[11px] text-white">Thêm khách hàng</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!historyTask} onOpenChange={(open) => !open && setHistoryTask(null)}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] h-[92vh] max-h-[95vh] rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col">
          <div className="bg-[#005BAA] p-6 text-white font-bold shrink-0 flex items-center justify-between">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-200 animate-pulse shrink-0" />
                Chi tiết & Chỉ đạo giao việc khách hàng
              </DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                Xem thông tin hồ sơ và tích hợp chỉ đạo bàn giao trực tiếp cho nhân sự thực hiện
              </DialogDescription>
            </DialogHeader>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] text-blue-100 font-black uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Trạng thái: {getTaskStatusLabel(historyTask?.taskStatus || 'UNASSIGNED')}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 bg-slate-50">
            {/* LEFT COLUMN: Customer Detailed Profile (7/12 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 overflow-y-auto custom-scrollbar h-full space-y-6 border-r border-slate-100">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-4 bg-[#005BAA] rounded-full" />
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Hồ sơ khách hàng</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Tên khách hàng</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{historyTask?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Số điện thoại</p>
                    <p className="text-sm font-black text-[#005BAA] font-mono">{historyTask?.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Mã thuê bao (MA_TB)</p>
                    <p className="text-sm font-black text-slate-900 font-mono">{historyTask?.subscriptionId || '---'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Doanh thu hiện tại</p>
                    <p className="text-sm font-black text-emerald-600 font-mono">{historyTask?.revenue?.toLocaleString()} đ</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-4 bg-[#005BAA] rounded-full" />
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Địa chỉ & Phân khu chuyên quản</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Địa chỉ lắp đặt (DIACHI_LD)</p>
                    <p className="text-sm font-bold text-slate-700">{historyTask?.addressDetail || historyTask?.address || '---'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{historyTask?.region}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Ô địa bàn</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapIcon className="w-4 h-4 text-blue-500 shrink-0" />
                        <p className="text-sm font-black text-slate-900 uppercase">{historyTask?.territory || 'Chưa gán'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Dịch vụ đang dùng</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {historyTask?.services?.map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[9px] font-black uppercase bg-white border-slate-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">NVKD Quản lý</p>
                      <p className="text-xs font-bold text-slate-700">{historyTask?.salesManager || '---'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">NVKT Quản lý</p>
                      <p className="text-xs font-bold text-slate-700">{historyTask?.technicalManager || '---'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real implementation results (if any) */}
              {historyTask?.taskStatus !== 'UNASSIGNED' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-1.5 h-4 bg-[#005BAA] rounded-full" />
                    <h3 className="text-sm font-black text-slate-850 uppercase tracking-tight">Kết quả triển khai thực tế</h3>
                  </div>

                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    {historyTask?.checkInLocation && (
                      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-150 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MapIcon className="w-5 h-5 text-[#005BAA] shrink-0" />
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase">Tọa độ Check-in</p>
                            <p className="text-[10px] font-mono text-slate-500">{historyTask.checkInLocation.lat}, {historyTask.checkInLocation.lng}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[10px] font-black text-[#005BAA] uppercase h-8 border-slate-200"
                          onClick={() => window.open(`https://www.google.com/maps?q=${historyTask.checkInLocation.lat},${historyTask.checkInLocation.lng}`, '_blank')}
                        >
                          Mở Bản đồ
                        </Button>
                      </div>
                    )}

                    {historyTask?.images && historyTask.images.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Hình ảnh đính kèm hiện trường ({historyTask.images.length})</p>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                          {historyTask.images.map((img: string, i: number) => (
                            <div key={i} className="relative group shrink-0">
                               <img 
                                 src={img} 
                                 alt={`Evidence ${i}`} 
                                 className="w-24 h-24 object-cover rounded-xl border border-slate-200 transition-all duration-300 hover:scale-105 cursor-zoom-in"
                                 referrerPolicy="no-referrer"
                               />
                               <Button 
                                 size="icon" 
                                 variant="secondary" 
                                 className="absolute inset-0 m-auto w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow"
                                 onClick={() => window.open(img, '_blank')}
                               >
                                 <Search className="w-4 h-4 text-slate-600" />
                               </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {historyTask?.notes && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Phản hồi từ nhân viên thụ lý</p>
                        <div className="p-3.5 bg-white border border-slate-150 rounded-xl text-[11px] font-medium text-slate-700 italic">
                          "{historyTask.notes}"
                        </div>
                      </div>
                    )}

                    {historyTask?.assignedDate && (
                      <p className="text-[9px] text-slate-400 text-right uppercase font-bold pt-1">
                         Lần cuối cập nhật: {new Date(historyTask.assignedDate).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Direct Task Assign Panel (5/12 cols) */}
            <div className="lg:col-span-5 bg-slate-100/70 p-6 sm:p-8 overflow-y-auto custom-scrollbar h-full border-t lg:border-t-0 border-slate-150 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#005BAA] shrink-0" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Chỉ đạo & Giao việc</h3>
                  </div>
                  <Badge className={cn("text-[9px] font-black uppercase tracking-widest", getTaskStatusStyle(historyTask?.taskStatus || 'UNASSIGNED'))}>
                    {getTaskStatusLabel(historyTask?.taskStatus || 'UNASSIGNED')}
                  </Badge>
                </div>

                {/* Choose Staff Component */}
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                      Chọn nhân sự thụ lý ({assignStaffIds.length})
                    </label>
                    {assignStaffIds.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600"
                        onClick={() => setAssignStaffIds([])}
                      >
                        Bỏ chọn hết
                      </Button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Tìm kiếm nhân sự..."
                      value={assignStaffSearchTerm}
                      onChange={(e) => setAssignStaffSearchTerm(e.target.value)}
                      className="pl-10 h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 p-1 bg-slate-50/50 rounded-xl border border-slate-150">
                    {staff.filter(s => s.name.toLowerCase().includes(assignStaffSearchTerm.toLowerCase())).map(s => {
                      const isChecked = assignStaffIds.includes(s.id);
                      return (
                        <div 
                          key={s.id} 
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer border text-xs",
                            isChecked 
                              ? "bg-blue-50/80 border-blue-200" 
                              : "bg-white border-transparent hover:border-slate-200"
                          )}
                          onClick={() => {
                            setAssignStaffIds(prev => 
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                          }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">
                              {s.name.split(' ').pop()?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{s.name}</span>
                              <span className="text-[8px] text-slate-400 font-black uppercase">{s.role}</span>
                            </div>
                          </div>
                          <Checkbox checked={isChecked} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Additional task details component */}
                <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="space-y-1.55">
                     <label className="text-[10px] font-black uppercase text-slate-500 block ml-0.5">Loại hình triển khai</label>
                     <Select value={assignTaskType} onValueChange={setAssignTaskType}>
                       <SelectTrigger className="h-10 rounded-xl text-xs font-semibold">
                         <SelectValue placeholder="Chọn loại hình..." />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                         {taskTypes.map(t => (
                           <SelectItem key={t} value={t} className="text-xs font-bold">{t === 'Khác' ? 'Nhiệm vụ khác' : t}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-500 block ml-0.5">Độ ưu tiên</label>
                       <Select value={assignPriority} onValueChange={(v: any) => setAssignPriority(v)}>
                         <SelectTrigger className="h-10 rounded-xl text-xs font-semibold">
                           <SelectValue placeholder="Mức ưu tiên..." />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                           <SelectItem value="HIGH" className="text-xs font-black text-rose-600">🔴 Cao / Khẩn</SelectItem>
                           <SelectItem value="MEDIUM" className="text-xs font-bold text-amber-600">🟡 Trung bình</SelectItem>
                           <SelectItem value="LOW" className="text-xs font-bold text-emerald-600">🟢 Thấp</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-500 block ml-0.5">Deadline</label>
                       <div className="relative">
                         <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                         <Input
                           type="date"
                           className="pl-9 h-10 rounded-xl text-xs font-semibold"
                           value={assignDeadline}
                           onChange={(e) => setAssignDeadline(e.target.value)}
                         />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-slate-500 block ml-0.5">Nội dung chỉ đạo / Ghi chú quản lý</label>
                     <textarea 
                       placeholder="Nhập ghi chú hoặc yêu cầu chỉ đạo chi tiết khi giao nhiệm vụ..."
                       value={assignNotes}
                       onChange={(e) => setAssignNotes(e.target.value)}
                       className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs placeholder:text-slate-350 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent resize-none font-medium text-slate-700"
                     />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 shrink-0 mt-6 lg:mt-0">
                <Button 
                  onClick={() => setHistoryTask(null)} 
                  variant="ghost" 
                  className="flex-1 font-black text-slate-405 h-12 rounded-xl uppercase text-[11px] tracking-wider border border-slate-200 bg-white hover:bg-slate-50"
                >
                  Đóng lại
                </Button>
                <Button 
                  onClick={handleSingleAssign} 
                  className="flex-1 font-black text-white bg-[#005BAA] hover:bg-blue-700 h-12 rounded-xl uppercase text-[11px] tracking-wider shadow-lg shadow-blue-100"
                >
                  Xác nhận giao việc
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Download className="w-24 h-24 rotate-12" />
            </div>
            <DialogHeader className="relative z-10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight text-white leading-none">Xuất báo cáo</DialogTitle>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-200 mt-1">Hệ thống báo cáo chi tiết</p>
                </div>
              </div>
              <DialogDescription className="text-white/80 text-xs font-medium leading-relaxed mt-2 max-w-[90%]">
                Lựa chọn danh mục chương trình và đợt triển khai tương ứng để kết xuất báo cáo Excel chi tiết.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6 bg-white">
            {selectedCustomers.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-4">
                <Checkbox 
                  id="exportSelectedOnly" 
                  checked={exportSelectedOnly} 
                  onCheckedChange={(checked) => setExportSelectedOnly(checked as boolean)}
                  className="mt-0.5 border-orange-500 data-[state=checked]:bg-orange-500"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="exportSelectedOnly" className="text-sm font-black text-orange-900 cursor-pointer">
                    Chỉ xuất dữ liệu đã chọn ({selectedCustomers.length} nhiệm vụ)
                  </label>
                  <p className="text-[10px] text-orange-600/80 font-bold">Lưu ý: Bỏ qua tất cả bộ lọc bên dưới</p>
                </div>
              </div>
            )}

            <div className={cn("space-y-5 transition-opacity duration-300", exportSelectedOnly ? "opacity-30 pointer-events-none" : "")}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chương trình (Danh mục)</label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs uppercase justify-between shadow-sm">
                        <span className="truncate text-left">
                          {exportCategoryIds.length === 0 ? "Tất cả chương trình" : `Đã chọn: ${exportCategoryIds.length} chương trình`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-auto max-w-[400px] min-w-[280px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                    <DropdownMenuCheckboxItem
                      checked={exportCategoryIds.length === 0}
                      onCheckedChange={() => { setExportCategoryIds([]); setExportBatchIds([]); }}
                      className="text-xs font-bold py-2"
                    >
                      Tất cả chương trình
                    </DropdownMenuCheckboxItem>
                    {categories.map(cat => (
                      <DropdownMenuCheckboxItem
                        key={cat.id}
                        checked={exportCategoryIds.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          setExportCategoryIds(prev => checked ? [...prev, cat.id] : prev.filter(x => x !== cat.id))
                        }}
                        className="text-xs font-bold py-2"
                      >
                        {cat.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đợt triển khai cụ thể</label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" disabled={exportCategoryIds.length === 0} className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs uppercase justify-between shadow-sm disabled:opacity-50">
                        <span className="truncate text-left">
                          {exportBatchIds.length === 0 ? "Tất cả đợt trong chương trình" : `Đã chọn: ${exportBatchIds.length} đợt`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-auto max-w-[400px] min-w-[280px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                    <DropdownMenuCheckboxItem
                      checked={exportBatchIds.length === 0}
                      onCheckedChange={() => setExportBatchIds([])}
                      className="text-xs font-bold py-2"
                    >
                      Tất cả đợt trong chương trình
                    </DropdownMenuCheckboxItem>
                    {batches.filter(b => exportCategoryIds.includes(b.programId)).map(batch => (
                      <DropdownMenuCheckboxItem
                        key={batch.id}
                        checked={exportBatchIds.includes(batch.id)}
                        onCheckedChange={(checked) => {
                          setExportBatchIds(prev => checked ? [...prev, batch.id] : prev.filter(x => x !== batch.id))
                        }}
                        className="text-xs font-bold py-2"
                      >
                        {batch.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {exportCategoryIds.length === 0 && (
                  <p className="text-[9px] text-slate-400 font-bold italic mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-400" />
                    Chọn chương trình để có thể lọc đợt cụ thể
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Khu vực / Quận Huyện</label>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs justify-between shadow-sm">
                          <span className="truncate text-left font-sans">
                            {exportRegions.length === 0 ? "Tất cả khu vực" : `Đã chọn: ${exportRegions.length} khu vực`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent className="w-auto max-w-[400px] min-w-[200px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                      <DropdownMenuCheckboxItem checked={exportRegions.length === 0} onCheckedChange={() => setExportRegions([])} className="text-xs font-bold py-2">
                        Tất cả khu vực
                      </DropdownMenuCheckboxItem>
                      {uniqueRegions.map(r => (
                        <DropdownMenuCheckboxItem key={r} checked={exportRegions.includes(r)} onCheckedChange={(checked) => setExportRegions(prev => checked ? [...prev, r] : prev.filter(x => x !== r))} className="text-xs font-bold py-2">
                          {r}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ô địa bàn</label>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs justify-between shadow-sm">
                          <span className="truncate text-left font-sans">
                            {exportTerritories.length === 0 ? "Tất cả địa bàn" : `Đã chọn ${exportTerritories.length} địa bàn`}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent className="w-auto max-w-[400px] min-w-[200px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                      <DropdownMenuCheckboxItem checked={exportTerritories.length === 0} onCheckedChange={() => setExportTerritories([])} className="text-xs font-bold py-2">
                        Tất cả địa bàn
                      </DropdownMenuCheckboxItem>
                      {Array.from(new Set(customers.map(c => c.territory).filter(Boolean))).sort().map(t => (
                        <DropdownMenuCheckboxItem key={t as string} checked={exportTerritories.includes(t as string)} onCheckedChange={(checked) => setExportTerritories(prev => checked ? [...prev, t as string] : prev.filter(x => x !== t as string))} className="text-xs font-bold py-2">
                          {t as string}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nhân viên phụ trách</label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs justify-between shadow-sm">
                        <span className="truncate text-left font-sans">
                          {exportStaffIds.length === 0 ? "Tất cả nhân viên" : `Đã chọn: ${exportStaffIds.length} nhân viên`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-auto max-w-[400px] min-w-[280px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                    <DropdownMenuCheckboxItem checked={exportStaffIds.length === 0} onCheckedChange={() => setExportStaffIds([])} className="text-xs font-bold py-2">
                      Tất cả nhân viên
                    </DropdownMenuCheckboxItem>
                    {staff.map(s => (
                      <DropdownMenuCheckboxItem key={s.id} checked={exportStaffIds.includes(s.id)} onCheckedChange={(checked) => setExportStaffIds(prev => checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} className="text-xs font-bold py-2">
                        {s.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Từ ngày</label>
                  </div>
                  <input 
                    type="date" 
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 h-10 rounded-xl px-3 font-medium text-xs text-slate-700 outline-none focus:border-slate-300 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đến ngày</label>
                  </div>
                  <input 
                    type="date" 
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 h-10 rounded-xl px-3 font-medium text-xs text-slate-700 outline-none focus:border-slate-300 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trạng thái nhiệm vụ</label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" className="w-full bg-slate-50 border-slate-100 h-10 rounded-xl font-bold text-xs justify-between shadow-sm">
                        <span className="truncate text-left font-sans">
                          {exportTaskTypes.length === 0 ? "Tất cả trạng thái" : `Đã chọn: ${exportTaskTypes.length > 2 && exportTaskTypes.includes('SUCCESS') ? exportTaskTypes.length - 1 : exportTaskTypes.length} trạng thái`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-auto max-w-[400px] min-w-[280px] rounded-xl max-h-[300px] overflow-y-auto custom-scrollbar" align="start">
                    <DropdownMenuCheckboxItem checked={exportTaskTypes.length === 0} onCheckedChange={() => setExportTaskTypes([])} className="text-xs font-bold py-2">
                      Tất cả trạng thái
                    </DropdownMenuCheckboxItem>
                    {[
                      { id: 'PENDING', label: 'Đã giao / Chờ' },
                      { id: 'IN_PROGRESS', label: 'Đang xử lý' },
                      { id: 'COMPLETED', label: 'Đã hoàn tất' }
                    ].map(status => (
                      <DropdownMenuCheckboxItem 
                        key={status.id} 
                        checked={exportTaskTypes.includes(status.id) || (status.id === 'COMPLETED' && exportTaskTypes.includes('SUCCESS'))} 
                        onCheckedChange={(checked) => {
                           if (checked) {
                             if (status.id === 'COMPLETED') setExportTaskTypes(prev => [...prev.filter(x => x !== 'COMPLETED' && x !== 'SUCCESS'), 'COMPLETED', 'SUCCESS']);
                             else setExportTaskTypes(prev => [...prev.filter(x => x !== status.id), status.id]);
                           } else {
                             if (status.id === 'COMPLETED') setExportTaskTypes(prev => prev.filter(x => x !== 'COMPLETED' && x !== 'SUCCESS'));
                             else setExportTaskTypes(prev => prev.filter(x => x !== status.id));
                           }
                        }} 
                        className="text-xs font-bold py-2"
                      >
                        {status.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-6 border-t border-slate-50">
              <div className="flex gap-3">
                <Button 
                  onClick={handleExportReport} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] h-12 shadow-lg shadow-emerald-50/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Xuất Excel (Có mã ảnh)
                </Button>
                <Button 
                  onClick={handleExportHTMLReport} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-[10px] h-12 shadow-lg shadow-orange-50/50 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  Xuất báo cáo có ảnh
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setExportDialogOpen(false)} 
                className="w-full rounded-2xl font-bold uppercase text-[10px] text-slate-400 h-10 hover:bg-slate-50"
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignByTerritoryDialogOpen} onOpenChange={setAssignByTerritoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white font-bold">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Giao nhiệm vụ theo Ô địa bàn</DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                Gán nhân sự phụ trách cho từng Ô địa bàn trong danh sách đang hiển thị
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Giao nhiệm vụ hàng loạt ({selectedTerritoriesForAssign.length} ô đang chọn)</label>
                  <Select value={batchAssignStaffId} onValueChange={setBatchAssignStaffId}>
                    <SelectTrigger className="bg-white border-slate-200 h-10 rounded-xl font-bold text-xs">
                      <SelectValue placeholder="Chọn nhân sự thụ lý chung..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    if (!batchAssignStaffId) return toast.error("Vui lòng chọn nhân sự");
                    if (selectedTerritoriesForAssign.length === 0) return toast.error("Vui lòng chọn ít nhất 1 ô địa bàn");
                    
                    const newMappings = { ...territoryMappings };
                    selectedTerritoriesForAssign.forEach(t => {
                      newMappings[t] = batchAssignStaffId;
                    });
                    setTerritoryMappings(newMappings);
                    toast.success(`Đã áp dụng nhân sự cho ${selectedTerritoriesForAssign.length} ô địa bàn`);
                  }}
                  className="bg-[#005BAA] hover:bg-blue-700 text-white rounded-xl h-10 px-6 font-bold text-xs"
                >
                  Áp dụng
                </Button>
              </div>

              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-100 mb-4 px-2 items-center">
                <div className="col-span-1 border-r border-slate-100 pr-2">
                  <Checkbox 
                    className="w-5 h-5 rounded border-slate-300 data-[state=checked]:bg-[#005BAA] data-[state=checked]:border-[#005BAA]"
                    checked={
                      Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))).length > 0 && 
                      selectedTerritoriesForAssign.length === Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))).length
                    }
                    onCheckedChange={(c) => {
                      const allT = Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))) as string[];
                      if (c) setSelectedTerritoriesForAssign(allT);
                      else setSelectedTerritoriesForAssign([]);
                    }}
                  />
                </div>
                <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase">Ô địa bàn</div>
                <div className="col-span-7 text-[10px] font-black text-slate-400 uppercase pl-2">Nhân sự thụ lý</div>
              </div>
              
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Tìm kiếm ô địa bàn..."
                  value={territorySearchTerm}
                  onChange={(e) => setTerritorySearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              </div>
              {Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))).filter(t => (t as string).toLowerCase().includes(territorySearchTerm.toLowerCase())).map(tName => (
                <div key={tName} className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                  <div className="col-span-1 border-r border-transparent flex justify-center">
                    <Checkbox 
                      className="w-5 h-5 rounded border-slate-300 data-[state=checked]:bg-[#005BAA] data-[state=checked]:border-[#005BAA]"
                      checked={selectedTerritoriesForAssign.includes(tName as string)}
                      onCheckedChange={(c) => {
                        if (c) setSelectedTerritoriesForAssign(prev => [...prev, tName as string]);
                        else setSelectedTerritoriesForAssign(prev => prev.filter(t => t !== tName));
                      }}
                    />
                  </div>
                  <div className="col-span-4">
                    <p className="text-xs font-black text-slate-900 break-words">{tName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      {filteredCustomers.filter(c => c.territory === tName).length} Khách hàng
                    </p>
                  </div>
                  <div className="col-span-7 pl-2">
                    <Select 
                      value={territoryMappings[tName as string] || ""} 
                      onValueChange={(val) => setTerritoryMappings(prev => ({ ...prev, [tName as string]: val }))}
                    >
                      <SelectTrigger className="rounded-xl h-10 border-slate-200 text-xs font-bold">
                        <SelectValue placeholder="Chọn nhân sự..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {staff.map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              {Array.from(new Set(filteredCustomers.map(c => c.territory).filter(Boolean))).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase">Không tìm thấy thông tin Ô địa bàn</p>
                  <p className="text-[10px] font-medium">Vui lòng kiểm tra lại dữ liệu khách hàng hoặc file import</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => setAssignByTerritoryDialogOpen(false)} variant="ghost" className="flex-1 font-black text-slate-400 h-11 rounded-2xl uppercase text-[11px]">Hủy bỏ</Button>
              <Button 
                onClick={handleAssignByTerritorySubmit} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 rounded-2xl uppercase text-[11px] shadow-lg shadow-emerald-100"
              >
                Xác nhận giao nhiệm vụ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTaskStatusStyle(status: string) {
  switch (status) {
    case 'UNASSIGNED': return 'bg-slate-50 text-slate-400 border-slate-100';
    case 'PENDING': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'COMPLETED': case 'SUCCESS': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

function getTaskStatusLabel(status: string) {
  switch (status) {
    case 'UNASSIGNED': return 'Chưa giao';
    case 'PENDING': return 'Đã giao / Chờ';
    case 'IN_PROGRESS': return 'Đang xử lý';
    case 'COMPLETED': case 'SUCCESS': return 'Đã hoàn tất';
    default: return status;
  }
}
