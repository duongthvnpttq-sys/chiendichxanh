import * as fs from 'fs';
let text = fs.readFileSync('src/components/layout/VNPTLayout.tsx', 'utf8');
text = text.replace(/<p className="text-\[13px\] font-bold text-green-800 drop-shadow-sm">/g, '<p className="text-[13px] font-bold text-white drop-shadow-sm">');
text = text.replace(/<p className="text-\[10px\] text-green-600\/80 uppercase tracking-widest font-medium">/g, '<p className="text-[10px] text-green-100 uppercase tracking-widest font-medium">');
text = text.replace(/className="text-white hover:bg-black\/10"/g, 'className="text-white hover:bg-black/10"');
fs.writeFileSync('src/components/layout/VNPTLayout.tsx', text);
