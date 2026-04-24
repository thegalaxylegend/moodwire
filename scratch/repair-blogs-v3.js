import fs from 'fs';
import path from 'path';

const filePath = 'c:/Users/Admin/Downloads/Desktop/src/data/blogs.ts';
const content = fs.readFileSync(filePath, 'utf8');

const blogObjects = [];
const blogRegex = /\{[\s\S]*?"id":\s*"([^"]+)"[\s\S]*?\}/g;

let match;
while ((match = blogRegex.exec(content)) !== null) {
    let rawObject = match[0];
    
    rawObject = rawObject.split('\n')
        .filter(line => !line.includes('<<<<<<<') && !line.includes('=======') && !line.includes('>>>>>>>') && !line.includes('Updated upstream') && !line.includes('Stashed changes'))
        .join('\n');
    
    try {
        const obj = eval('(' + rawObject + ')');
        if (obj.id && obj.title) {
            blogObjects.push(obj);
        }
    } catch (e) {
        const id = rawObject.match(/"id":\s*"([^"]+)"/)?.[1];
        const title = rawObject.match(/"title":\s*"([^"]+)"/)?.[1];
        const description = rawObject.match(/"description":\s*"([^"]+)"/)?.[1];
        const category = rawObject.match(/"category":\s*"([^"]+)"/)?.[1];
        const date = rawObject.match(/"date":\s*"([^"]+)"/)?.[1];
        const readTime = rawObject.match(/"readTime":\s*"([^"]+)"/)?.[1];
        const image = rawObject.match(/"image":\s*"([^"]+)"/)?.[1];
        
        if (id && title) {
            blogObjects.push({ id, title, description, category, date, readTime, image });
        }
    }
}

const uniqueBlogs = [];
const seenIds = new Set();
const categories = new Set();

for (const blog of blogObjects) {
    if (!seenIds.has(blog.id)) {
        uniqueBlogs.push(blog);
        seenIds.add(blog.id);
        if (blog.category) categories.add(blog.category);
    }
}

const sortedCategories = Array.from(categories).sort();

const output = `
export interface Blog {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
}

export const CATEGORIES = ${JSON.stringify(sortedCategories, null, 4)};

export const blogs: Blog[] = ${JSON.stringify(uniqueBlogs, null, 4)};
`;

fs.writeFileSync(filePath, output);
console.log('Successfully repaired and rewritten src/data/blogs.ts with CATEGORIES export');
