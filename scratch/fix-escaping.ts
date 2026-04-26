import fs from 'fs';

const files = [
    'c:/Users/Admin/Downloads/Desktop/src/content/blogs/binomial-theorem-class-11-revision-notes-jee.md',
    'c:/Users/Admin/Downloads/Desktop/src/content/blogs/electromagnetic-waves-class-12-notes.md'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('\\n')) {
        console.log(`Found \\n in ${file}. Fixing...`);
        content = content.replace(/\\n/g, '\n');
    }
    // Also fix double backslashes for common LaTeX commands if found outside code blocks
    content = content.replace(/\\\\(cos|sin|tan|alpha|beta|gamma|Delta|theta|phi|frac|sqrt|sum|int|nabla|partial|times)/g, '\\$1');
    
    fs.writeFileSync(file, content);
});
console.log("✅ Fixed literal \\n and double backslash issues.");
