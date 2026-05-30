const fs = require('fs');

let buffer = fs.readFileSync('scratch/diagnostics_v6.json');
let text;

if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    text = buffer.toString('utf16le');
} else {
    text = buffer.toString('utf8');
}

if (text.charCodeAt(0) === 0xFEFF || text.charCodeAt(0) === 0xFFFE) {
    text = text.slice(1);
}

const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

console.log(`Total diagnostics: ${diagnostics.length}`);

// Group by plugin, category and rule
const byPlugin = {};
const byCategory = {};
const byRule = {};

diagnostics.forEach(d => {
    byPlugin[d.plugin] = (byPlugin[d.plugin] || 0) + 1;
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    byRule[d.rule] = (byRule[d.rule] || 0) + 1;
});

console.log("\nBy Plugin:", byPlugin);
console.log("\nBy Category:", byCategory);
console.log("\nBy Rule:");
Object.entries(byRule).sort((a,b) => b[1] - a[1]).forEach(([rule, count]) => {
    console.log(`  - ${rule}: ${count}`);
});

console.log("\n--- Remaining Diagnostics with Plugin name ---");
diagnostics.slice(0, 5).forEach((d, idx) => {
    console.log(`${idx + 1}. File: ${d.filePath}`);
    console.log(`   Plugin: ${d.plugin}`);
    console.log(`   Rule: ${d.rule}`);
    console.log(`   Category: ${d.category}`);
});
