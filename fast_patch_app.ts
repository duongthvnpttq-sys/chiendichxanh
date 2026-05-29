import * as fs from 'fs';
let text = fs.readFileSync('src/App.tsx', 'utf8');
text = `import { getRoutePermissions } from "@/src/services/permissionService";\n` + text;
text = text.replace(/const routePermissions: Record<string, string\[\]> = \{[\s\S]*?\};\n\nfunction renderPage/m, `function renderPage`);

// Also replace allowedRoles logic in App
text = text.replace(/const allowedRoles = routePermissions\[page\] \|\| \['ADMIN'\];/, `const allowedRoles = getRoutePermissions()[page] || ['ADMIN'];`);
fs.writeFileSync('src/App.tsx', text);
