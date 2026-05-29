import * as fs from 'fs';
let text = fs.readFileSync('src/components/layout/VNPTLayout.tsx', 'utf8');

text = text.replace(/text-blue-500/g, 'text-green-500');
text = text.replace(/text-blue-300\/80/g, 'text-green-300/80');
text = text.replace(/border-blue-400\/20/g, 'border-green-400/20');
text = text.replace(/bg-blue-50\/50/g, 'bg-green-50/50');
text = text.replace(/border-blue-100/g, 'border-green-100');
text = text.replace(/text-blue-600/g, 'text-green-600');
text = text.replace(/hover:text-blue-700/g, 'hover:text-green-700');
text = text.replace(/text-brand-indigo/g, 'text-green-700');

fs.writeFileSync('src/components/layout/VNPTLayout.tsx', text);
console.log("Replaced remaining layout blue colors.");
