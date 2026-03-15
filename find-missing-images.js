
import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blogs';
const publicDir = 'public';

const files = fs.readdirSync(blogDir);
const missingImages = [];

files.forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    if (match) {
      const imgPath = match[1];
      const fullPath = path.join(publicDir, imgPath);
      if (!fs.existsSync(fullPath)) {
        missingImages.push({
          blogFile: file,
          imgPath: imgPath,
          title: content.split('\n')[0].replace('# ', '').trim()
        });
      }
    } else {
        missingImages.push({
            blogFile: file,
            imgPath: null,
            title: content.split('\n')[0].replace('# ', '').trim()
        });
    }
  }
});

fs.writeFileSync('missing-images.json', JSON.stringify(missingImages, null, 2), 'utf8');
console.log('Found ' + missingImages.length + ' missing or unreferenced images.');
