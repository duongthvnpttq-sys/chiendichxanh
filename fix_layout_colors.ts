import * as fs from 'fs';
let text = fs.readFileSync('src/components/layout/VNPTLayout.tsx', 'utf8');

// Header gradient
text = text.replace(/from-\[\#fbfcff\] to-\[\#e8f1f8\] text-\[\#1c4b82\]/g, 'from-[#43a047] to-[#388e3c] text-white');
text = text.replace(/border-\[\#a0c5e8\]/g, 'border-green-700');

// Header text
text = text.replace(/text-\[\#1c4b82\]/g, 'text-green-800');
text = text.replace(/text-\[\#2a5e96\]/g, 'text-green-600/80');

// Hover colors in header
text = text.replace(/hover:bg-blue-100\/50/g, 'hover:bg-black/10');
text = text.replace(/hover:bg-blue-50/g, 'hover:bg-green-50');

// Sidebar selections
text = text.replace(/bg-gradient-to-r from-blue-50 to-blue-50\/20 text-\[\#005BAA\] border-\[\#005BAA\]/g, 'bg-gradient-to-r from-green-50 to-green-50/20 text-green-700 border-green-600');
text = text.replace(/text-\[\#005BAA\]/g, 'text-green-700');
text = text.replace(/hover:bg-slate-50 text-slate-600/g, 'hover:bg-green-50/50 text-slate-600');
text = text.replace(/bg-\[\#1a5089\]/g, 'bg-green-800');
text = text.replace(/bg-\[\#005BAA\]/g, 'bg-green-600');
text = text.replace(/hover:bg-\[\#005BAA\]\/90/g, 'hover:bg-green-600/90');

// Settings banner
text = text.replace(/from-\[\#005BAA\] to-\[\#003E7A\]/g, 'from-[#43a047] to-[#2e7d32]');

// Fix header text for layout
text = text.replace(/text-\[\#1c4b82\] hover:bg-black\/10/g, 'text-white hover:bg-black/10');

// Mobile bottom nav active item
text = text.replace(/text-brand-orange bg-orange-50\/50/g, 'text-green-600 bg-green-50/80');

fs.writeFileSync('src/components/layout/VNPTLayout.tsx', text);
console.log("Replaced colors.");
