import * as fs from 'fs';
const text = fs.readFileSync('src/components/users/UserManagement.tsx', 'utf8');
const fixed = text.replace(/''manager''/g, "'manager'").replace(/''collaborator''/g, "'collaborator'");
fs.writeFileSync('src/components/users/UserManagement.tsx', fixed);
