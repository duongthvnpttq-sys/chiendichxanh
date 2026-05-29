import * as fs from 'fs';
let text = fs.readFileSync('src/components/potential/PotentialCustomers.tsx', 'utf8');

text = text.replace(
  /\{status === 'NEW' \? 'MỚI' : status === 'CONTACTED' \? 'ĐÃ LH' : 'THÀNH CÔNG'\}/g,
  "{status === 'NEW' ? 'MỚI' : status === 'CONTACTED' ? 'ĐÃ TIẾP XÚC' : 'ĐÃ CHỐT HĐ'}"
);
text = text.replace(
  /<p className="text-sm font-bold text-blue-600">\{viewingCustomer\.status === 'NEW' \? 'MỚI' : viewingCustomer\.status\}<\/p>/g,
  '<p className="text-sm font-bold text-blue-600">{viewingCustomer.status === "NEW" ? "MỚI THU THẬP" : viewingCustomer.status === "CONTACTED" ? "ĐÃ TIẾP XÚC" : "ĐÃ CHỐT HĐ"}</p>'
);
fs.writeFileSync('src/components/potential/PotentialCustomers.tsx', text);
