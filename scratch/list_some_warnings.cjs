const fs = require('fs');

let text = fs.readFileSync('scratch/diagnostics_v4.json', 'utf8');
if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
}
const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

const srcDiags = diagnostics.filter(d => d.filePath.startsWith('src/'));

console.log("=== Control Has Associated Label ===");
const controlDiags = srcDiags.filter(d => d.rule === 'control-has-associated-label');
console.log(`Total: ${controlDiags.length}`);
controlDiags.slice(0, 15).forEach(d => {
    console.log(`- ${d.filePath}:${d.line}:${d.column} (${d.message})`);
});
