import * as fs from 'fs';
let text = fs.readFileSync('src/components/potential/PotentialCustomers.tsx', 'utf8');

text = text.replace(
  /<div className="flex items-center gap-3 mb-2">\s*<h3 className="font-black text-lg uppercase text-\[\#1c4b82\] tracking-tight">\{c\.name\}<\/h3>\s*<span className="text-\[10px\] bg-blue-50 text-blue-600 px-2\.5 py-1 rounded-full font-black uppercase shadow-sm">\s*\{c\.status === 'NEW' \? 'MỚI' : c\.status\}\s*<\/span>\s*<\/div>/g,
  `                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-lg uppercase text-[#1c4b82] tracking-tight">{c.name}</h3>
                          <span className={\`text-[10px] px-2.5 py-1 rounded-full font-black uppercase shadow-sm border \${
                              c.status === 'NEW' ? "bg-blue-50 text-blue-600 border-blue-100" :
                              c.status === 'CONTACTED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }\`}>
                            {c.status === 'NEW' ? 'MỚI THU THẬP' : c.status === 'CONTACTED' ? 'ĐÃ TIẾP XÚC / TƯ VẤN' : 'ĐÃ CHỐT HỢP ĐỒNG'}
                          </span>
                        </div>`
);
fs.writeFileSync('src/components/potential/PotentialCustomers.tsx', text);
