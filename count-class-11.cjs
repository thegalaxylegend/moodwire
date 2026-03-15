const fs = require('fs');
const path = require('path');

const blogsDir = 'src/content/blogs';
const files = fs.readdirSync(blogsDir);

let class11Count = 0;
const class11Blogs = [];

files.forEach(file => {
    if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(blogsDir, file), 'utf8');
        if (content.match(/Class 11/i) || content.match(/Class XI/i)) {
            class11Count++;
            class11Blogs.push(file);
        }
    }
});

console.log(`Total Class 11 blogs: ${class11Count}`);
console.log('List of blogs:');
class11Blogs.forEach(blog => console.log(`- ${blog}`));
