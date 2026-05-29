import fs from "fs";
let content = fs.readFileSync("src/components/users/UserManagement.tsx", "utf8");
content = content.replace(/<CardContent([^>]+)>\s*<Table/g, "<CardContent$1>\n<div className=\"overflow-x-auto overflow-y-auto max-h-[70vh] flex-1 min-h-0 custom-scrollbar\">\n<Table");
content = content.replace(/<\/Table>\s*<\/CardContent>/g, "</Table>\n</div>\n</CardContent>");
fs.writeFileSync("src/components/users/UserManagement.tsx", content);
