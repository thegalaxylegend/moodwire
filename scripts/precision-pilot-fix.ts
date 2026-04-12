import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function precisionRepair(slug: string) {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    console.log(`🔧 Precision Repairing ${slug}...`);

    // 1. Fix malformed summaries with [class]
    content = content.replace(/<div\s+\[class\].*?="(.*?)">/gi, '<div class="$1">');

    // 2. Fix JSON squashing (Greedy and robust)
    content = content.replace(/\{(?:\r?\n)?\s*"heading"\s*:\s*"(.*?)"\s*,\s*"body"\s*:\s*"(.*?)(?:"\s*,|"\s*\}|$)/gs, (match, heading, bodyText) => {
        const cleanHeading = heading.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const cleanBody = bodyText.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return `\n## ${cleanHeading}\n\n${cleanBody}\n`;
    });

    // 3. Fix LaTeX Braces and Raw Commands
    // Fix { sin^2... } patterns
    content = content.replace(/\\\{\s*(.*?)\s*\\\}/g, '$$$1$$');
    
    // Fix raw LaTeX outside of $
    const cmds = ['frac', 'sqrt', 'sum', 'int', 'sin', 'cos', 'tan', 'theta', 'phi', 'alpha', 'beta', 'Delta'];
    for (const cmd of cmds) {
        const regex = new RegExp(`(?<![$\\\])\\\\${cmd}(?:\\{[^{}]*\\}|_[\\w\\d]+|\\^[^\\s]+|\\s|\\{|\\()`, 'g');
        content = content.replace(regex, (m) => `$${m}$`);
    }

    // 4. Final Polish: remove leftover placeholders
    content = content.replace(/\[object Object\]/g, '');
    content = content.replace(/-\s+\*/g, '- '); // Clean up bullet artifacts

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${slug}`);
}

const targets = [
    'trigonometric-functions-class-11-revision-notes-jee-neet',
    '3d-geometry-intro-class-11-revision-notes-jee-neet',
    'computer-networks-class-12-notes'
];

for (const t of targets) {
    precisionRepair(t);
}
console.log('\n🚀 Precision Pilot Cleaned! Running Final Gate Check...');
