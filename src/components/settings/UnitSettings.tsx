import React from "react";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  Hash, 
  Image as ImageIcon,
  Save,
  Info,
  AlertCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userService, UnitSettings as IUnitSettings } from "@/src/services/userService";
import { motion } from "motion/react";
import { toast } from "sonner";

export default function UnitSettings() {
  const [settings, setSettings] = React.useState<IUnitSettings>(userService.getUnitSettings());
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = () => {
    userService.setUnitSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (field: keyof IUnitSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-4 pb-8 h-full overflow-y-auto custom-scrollbar pr-2"
    >
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-brand-indigo border border-indigo-100">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Cài đặt hệ thống</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Quản lý thông tin đơn vị và nhận diện thương hiệu</p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          className="h-10 px-6 bg-brand-orange hover:bg-orange-600 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaved ? "Đã lưu cấu hình" : "Lưu thay đổi"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Info - Occupies 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-brand-indigo flex items-center gap-2">
                <Info className="w-4 h-4" /> Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Tên đơn vị đầy đủ</label>
                <div className="relative group">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
                  <Input 
                    value={settings.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-brand-orange focus-visible:border-brand-orange transition-all font-medium uppercase"
                    placeholder="Nhập tên đơn vị đầy đủ..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Thương hiệu / Viết tắt</label>
                <div className="relative group">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
                  <Input 
                    value={settings.shortName}
                    onChange={(e) => handleChange("shortName", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-brand-orange focus-visible:border-brand-orange transition-all font-medium uppercase"
                    placeholder="VD: VNPT Tuyên Quang"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Người đứng đầu (Lãnh đạo)</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
                  <Input 
                    value={settings.leader}
                    onChange={(e) => handleChange("leader", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-brand-orange focus-visible:border-brand-orange transition-all font-medium"
                    placeholder="Nhập họ và tên lãnh đạo..."
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Địa chỉ trụ sở</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
                  <Input 
                    value={settings.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-brand-orange focus-visible:border-brand-orange transition-all font-medium"
                    placeholder="Nhập địa chỉ trụ sở..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info - Occupies 1 column */}
        <div className="space-y-6">
          {/* Contact info */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-brand-indigo flex items-center gap-2">
                <Phone className="w-4 h-4" /> Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Số điện thoại</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#005BAA] transition-colors" />
                  <Input 
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-[#005BAA] focus-visible:border-[#005BAA] transition-all font-medium"
                    placeholder="VD: 024..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Email công vụ</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#005BAA] transition-colors" />
                  <Input 
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-[#005BAA] focus-visible:border-[#005BAA] transition-all font-medium"
                    placeholder="VD: email@vnpt.vn"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Website</label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#005BAA] transition-colors" />
                  <Input 
                    value={settings.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="pl-10 h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-[#005BAA] focus-visible:border-[#005BAA] transition-all font-medium"
                    placeholder="VD: https://tuyenquang.vnpt.vn"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand */}
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-brand-indigo flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Nhận diện thương hiệu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Đường dẫn Logo (URL)</label>
                <Input 
                  value={settings.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="Nhập URL ảnh định dạng PNG/SVG..."
                  className="h-10 border-slate-200 rounded-xl text-sm focus-visible:ring-[#005BAA] focus-visible:border-[#005BAA] transition-all font-medium"
                />
              </div>
              
              <div className="pt-2 flex justify-center">
                <div className="w-full max-w-[200px] aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center p-3 relative group">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400 space-y-1">
                       <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                       <p className="text-[10px] uppercase font-bold tracking-wider">Chưa có logo</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-5">
              <CardTitle className="text-xs font-bold uppercase tracking-wide text-brand-indigo flex items-center gap-2">
                <Settings className="w-4 h-4" /> Hệ thống / Cảnh báo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 bg-white">
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-tight">Xóa trắng bộ nhớ tạm (Cache)</h4>
                  <p className="text-[11px] font-medium opacity-80 leading-snug">Tính năng này sẽ dọn dẹp toàn bộ dữ liệu lưu tạm trên trình duyệt hiện tại. Sử dụng trong trường hợp hệ thống bị lỗi dữ liệu, sau khi vừa được Admin xóa dữ liệu lỗi cũ từ cơ sở dữ liệu server.</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  try {
                    localStorage.removeItem('vnpt_customers');
                    localStorage.removeItem('vnpt_assignments');
                    localStorage.removeItem('vnpt_batches');
                    localStorage.removeItem('vnpt_categories');
                    toast.success("Đã xóa bộ nhớ đệm (cache) trình duyệt. Trang sẽ tự động tải lại.");
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (e) {
                    toast.error("Không thể clear cache");
                  }
                }}
                variant="outline"
                className="w-full border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 font-bold tracking-wide uppercase text-xs h-10 rounded-xl"
              >
                Tiến hành dọn dẹp Cache
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
