const fs = require('fs');

// Patch XPProgress
const xpFile = 'src/components/gamification/XPProgress.tsx';
let xpContent = fs.readFileSync(xpFile, 'utf8');
xpContent = xpContent.replace(/transition=\{\{ duration: 1\.5, ease: "easeOut" \}\}/g, 'transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}');
fs.writeFileSync(xpFile, xpContent);
console.log("Patched XPProgress.tsx");

// Patch LevelUpModal
const lvlFile = 'src/components/gamification/LevelUpModal.tsx';
let lvlContent = fs.readFileSync(lvlFile, 'utf8');
lvlContent = lvlContent.replace(/transition=\{\{ type: 'spring', damping: 15 \}\}/g, 'transition={{ type: "spring", damping: 12, stiffness: 100, mass: 0.8 }}');
fs.writeFileSync(lvlFile, lvlContent);
console.log("Patched LevelUpModal.tsx");
