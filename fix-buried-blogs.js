import fs from 'fs';
import path from 'path';

const dir = 'src/content/blogs';
const targetFiles = [
    'indian-geography-physical-class-11-notes.md',
    'indian-geography-climate-class-11-notes.md',
    'constitutional-framework-class-11-notes.md',
    'fundamental-rights-class-11-notes.md',
    'dpsp-duties-class-11-notes.md',
    'federalism-class-11-notes.md'
];

for (const file of targetFiles) {
    const fp = path.join(dir, file);
    if (fs.existsSync(fp)) {
        let content = fs.readFileSync(fp, 'utf8');
        content = content.replace(/date: ".*?"/, 'date: "March 21, 2026"');
        content = content.replace(/\*Last Updated: .*?\*/, '*Last Updated: March 21, 2026*');
        
        if (file.includes('geography')) {
            content = content.replace(/category: "General"/, 'category: "Geography"');
        } else {
            content = content.replace(/category: "General"/, 'category: "Social Science"');
        }
        
        fs.writeFileSync(fp, content);
        console.log(`✅ Fixed buried blog: ${file}`);
    } else {
        console.warn(`⚠️ File not found: ${file}`);
    }
}
