export const getRoutePermissions = (): Record<string, string[]> => {
    try {
        const saved = localStorage.getItem('vnpt_permission_matrix');
        if (saved) {
           const matrix = JSON.parse(saved);
           const getKeys = (namePart: string) => {
               const m = matrix.find((m: any) => m.name.toLowerCase().includes(namePart.toLowerCase()));
               return m ? m.keys.map((k: string) => k.toUpperCase()) : ['ADMIN'];
           };
           // Always inject ADMIN for critical modules
           const injectAdmin = (roles: string[]) => roles.includes('ADMIN') ? roles : [...roles, 'ADMIN'];
           
           return {
              dashboard: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'],
              users: injectAdmin(getKeys('Nhân sự')),
              assignments: injectAdmin(getKeys('Giao khách hàng')),
              archive: injectAdmin(getKeys('báo cáo')),
              tasks: injectAdmin(getKeys('Cập nhật kết quả')), 
              customers: injectAdmin(getKeys('Xem khách hàng')),
              potential: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'],
              settings: injectAdmin(getKeys('Cấu hình'))
           };
        }
    } catch {}
    
    return {
      dashboard: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'],
      users: ['ADMIN', 'MANAGER'],
      assignments: ['ADMIN', 'MANAGER'],
      archive: ['ADMIN', 'MANAGER'],
      tasks: ['STAFF', 'COLLABORATOR', 'ADMIN', 'MANAGER'], 
      customers: ['ADMIN', 'MANAGER'],
      potential: ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'],
      settings: ['ADMIN']
    };
};
