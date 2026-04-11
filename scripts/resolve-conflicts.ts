import fs from 'fs';
import path from 'path';

const blogsPath = path.join(process.cwd(), 'src/data/blogs.ts');

function resolveConflicts() {
    console.log('Reading blogs.ts...');
    const content = fs.readFileSync(blogsPath, 'utf-8');
    
    // 1. Strip all lines containing conflict markers entirely
    const lines = content.split('\n');
    const cleanLines = lines.filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('<<<<<<<') && 
               !trimmed.startsWith('=======') && 
               !trimmed.startsWith('>>>>>>>');
    });
    
    const cleanContent = cleanLines.join('\n');
    
    // 2. Extract blog objects using bracket counting for robustness
    const blogMap = new Map();
    let bracketCount = 0;
    let currentObject = "";
    let insideObject = false;

    for (let i = 0; i < cleanContent.length; i++) {
        const char = cleanContent[i];
        
        if (char === '{' && !insideObject) {
            // Check if this { is likely the start of a blog entry (after a comma or [ or newline)
            insideObject = true;
            bracketCount = 1;
            currentObject = "{";
        } else if (insideObject) {
            currentObject += char;
            if (char === '{') bracketCount++;
            if (char === '}') bracketCount--;
            
            if (bracketCount === 0) {
                // Potential blog object found
                const idMatch = currentObject.match(/"id":\s*"([^"]+)"/);
                if (idMatch) {
                    const id = idMatch[1];
                    // Basic syntax check: must have title and category
                    if (currentObject.includes('"title":') && currentObject.includes('"category":')) {
                        blogMap.set(id, currentObject.trim());
                    }
                }
                insideObject = false;
                currentObject = "";
            }
        }
    }

    console.log(`Successfully extracted and deduplicated to ${blogMap.size} unique blog entries.`);

    // 3. Reconstruct the file
    const header = `
export interface Blog {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
}

export const blogs: Blog[] = [`;

    const footer = `
];

export const CATEGORIES = Array.from(new Set(blogs.map(b => b.category))).sort();
`;

    const sortedBlogs = Array.from(blogMap.values()).join(',\n    ');
    const finalContent = `${header}\n    ${sortedBlogs}\n${footer}`;

    fs.writeFileSync(blogsPath, finalContent);
    console.log('Successfully resolved conflicts and deduplicated blogs.ts');
}

resolveConflicts();
