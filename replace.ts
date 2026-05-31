import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('className="pl-9 ')) {
                content = content.replace(/className="pl-9 /g, 'className="pl-10 ');
                fs.writeFileSync(fullPath, content);
                console.log('Replaced in ' + fullPath);
            }
        }
    }
}

replaceInDir('./src/components/');
