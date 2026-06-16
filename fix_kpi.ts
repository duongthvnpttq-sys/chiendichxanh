import * as fs from 'fs';
let text = fs.readFileSync('src/components/dashboard/KPIOverview.tsx', 'utf8');
text = text.replace(/#005BAA/g, '#43a047');
fs.writeFileSync('src/components/dashboard/KPIOverview.tsx', text);
