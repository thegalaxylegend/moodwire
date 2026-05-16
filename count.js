const fs = require('fs');
const code = fs.readFileSync('c:/Users/Admin/Downloads/Desktop/src/components/Chat/ChatWindow.tsx', 'utf8');
const opens = (code.match(/<div/g) || []).length;
const closes = (code.match(/<\/div>/g) || []).length;
console.log({opens, closes});
