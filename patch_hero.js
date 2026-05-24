const fs = require('fs');
const file = 'src/components/Hero.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/ease: 'easeOut' as const/g, 'ease: [0.16, 1, 0.3, 1]');

fs.writeFileSync(file, content);
console.log("Patched Hero.tsx");
