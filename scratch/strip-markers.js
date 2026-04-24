import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/Admin/Downloads/Desktop/src/data/blogs.ts';
const content = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', content.length);

// Regex to match the markers
// <<<<<<< Updated upstream
// content A
// =======
// content B
// >>>>>>> Stashed changes

// Simple approach: Just remove the lines that ARE the markers
const lines = content.split('\n');
const cleanLines = lines.filter(line => {
    const l = line.trim();
    if (l.startsWith('<<<<<<<')) return false;
    if (l.startsWith('=======') && !l.includes('"')) return false; // Avoid matching actual data that might start with =======
    if (l.startsWith('>>>>>>>')) return false;
    if (l === 'Updated upstream') return false;
    if (l === 'Stashed changes') return false;
    return true;
});

let cleanContent = cleanLines.join('\n');

// Now we need to fix potential double commas or missing commas caused by removing markers
// Example: 
// },
// <<<<<<<
// {
// becomes
// },
// {
// which is fine.

// But sometimes it might be:
// }
// =======
// }
// becomes
// }
// }

fs.writeFileSync(filePath + '.fixed', cleanContent);
console.log('Fixed file written to:', filePath + '.fixed');
