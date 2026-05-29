import * as fs from 'fs';
let text = fs.readFileSync('src/components/users/UserManagement.tsx', 'utf8');
text = text.replace(/<SelectItem "value="Giám đốc">Giám đốc HĐ<"\/SelectItem>/g, '<SelectItem value="manager">Giám đốc HĐ</SelectItem>');
fs.writeFileSync('src/components/users/UserManagement.tsx', text);
