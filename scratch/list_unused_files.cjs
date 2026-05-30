const fs = require('fs');

let text = fs.readFileSync('scratch/diagnostics_v3.json', 'utf8');
if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
}
const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

const srcDiags = diagnostics.filter(d => d.filePath.startsWith('src/'));

console.log("=== Unused Files Examples ===");
const unusedDiags = srcDiags.filter(d => d.rule === 'unused-file');
console.log(`Total: ${unusedDiags.length}`);
unusedDiags.slice(0, 30).forEach(d => {
    console.log(`- ${d.filePath}`);
});
