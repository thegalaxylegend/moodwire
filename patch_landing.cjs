const fs = require('fs');
const file = 'src/pages/LandingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update feature cards transition
content = content.replace(/ease: \[0\.22, 1, 0\.36, 1\]/g, 'ease: [0.16, 1, 0.3, 1]');

// Update the "Start for Free" CTA hover
content = content.replace(/whileHover=\{\{ scale: 1\.05, y: -3 \}\}/g, 'whileHover={{ scale: 1.05, y: -4, boxShadow: "0px 10px 30px rgba(139, 92, 246, 0.4)" }}');

fs.writeFileSync(file, content);
console.log("Patched LandingPage.tsx");
