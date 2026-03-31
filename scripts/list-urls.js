import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blogs');
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

const fileData = files.map(file => {
  const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
  const match = content.match(/date:\s*['"]?([^'"]+)['"]?/);
  const date = match ? match[1] : '1970-01-01';
  return { name: file.replace('.md', ''), date };
});

fileData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
const top30 = fileData.slice(0, 30);

const output = top30.map((f, i) => `${i+1}. http://localhost:5173/blog/${f.name}`).join('\\n');
fs.writeFileSync(path.join(process.cwd(), 'scripts/urls2.txt'), output, 'utf-8');
