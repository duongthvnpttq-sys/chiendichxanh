export const getRoutePermissions = (): Record<string, string[]> => {
    try {
        const saved = localStorage.getItem('vnpt_permission_matrix');
        if (saved) {
           const matrix = JSON.parse(saved);
           const getKeys = (namePart: string) => {
               const m = matrix.find((m: any) => m.name.toLowerCase().includes(namePart.toLowerCase()));
               return m ? m.keys : ['admin'];
           };
           // Always inject 'admin' for critical modules
           const injectAdmin = (roles: string[]) => roles.includes('admin') ? roles : [...roles, 'admin'];
           
           return {
              dashboard: ['admin', 'manager', 'staff', 'collaborator'],
              rankings: ['admin', 'manager', 'staff', 'collaborator'],
              users: injectAdmin(getKeys('Nhân sự')),
              assignments: injectAdmin(getKeys('Giao khách hàng')),
              archive: injectAdmin(getKeys('báo cáo')),
              tasks: injectAdmin(getKeys('Cập nhật kết quả')), 
              customers: injectAdmin(getKeys('Xem khách hàng')),
              potential: injectAdmin(getKeys('tiềm năng')),
              settings: injectAdmin(getKeys('Cài đặt'))
           };
        }
    } catch {}
    
    return {
      dashboard: ['admin', 'manager', 'staff', 'collaborator'],
      rankings: ['admin', 'manager', 'staff', 'collaborator'],
      users: ['admin', 'manager'],
      assignments: ['admin', 'manager'],
      archive: ['admin', 'manager'],
      tasks: ['staff', 'collaborator', 'admin', 'manager'], 
      customers: ['admin', 'manager'],
      potential: ['admin', 'manager', 'staff', 'collaborator'],
      settings: ['admin']
    };
};

