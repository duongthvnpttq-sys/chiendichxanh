export const getRoutePermissions = (): Record<string, string[]> => {
    const fullRoles = ['ADMIN', 'MANAGER', 'STAFF', 'COLLABORATOR'];
    
    return {
      dashboard: fullRoles,
      users: fullRoles,
      assignments: fullRoles,
      archive: fullRoles,
      tasks: fullRoles, 
      customers: fullRoles,
      potential: fullRoles,
      settings: fullRoles
    };
};
