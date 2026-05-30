const fs = require('fs');

let buffer = fs.readFileSync('scratch/diagnostics_v5.json');
let text;

// Detect UTF-16LE or UTF-16BE or UTF-8 BOM
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    text = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    // UTF-16BE (swap bytes or buffer toString won't handle natively, but usually PowerShell is LE on Windows)
    text = buffer.toString('utf16le'); // fallback
} else {
    text = buffer.toString('utf8');
}

// Strip BOM if present
if (text.charCodeAt(0) === 0xFEFF || text.charCodeAt(0) === 0xFFFE) {
    text = text.slice(1);
}

const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

console.log(`Total diagnostics: ${diagnostics.length}`);

// Group by category
const byCategory = {};
const byRule = {};

diagnostics.forEach(d => {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    byRule[d.rule] = (byRule[d.rule] || 0) + 1;
});

console.log("\nBy Category:", byCategory);
console.log("\nBy Rule:");
Object.entries(byRule).sort((a,b) => b[1] - a[1]).forEach(([rule, count]) => {
    console.log(`  - ${rule}: ${count}`);
});

console.log("\n--- Security Diagnostics ---");
diagnostics.filter(d => d.category === 'Security' || d.severity === 'error').forEach((d, idx) => {
    console.log(`${idx + 1}. File: ${d.filePath}:${d.line}:${d.column}`);
    console.log(`   Rule: ${d.rule}`);
    console.log(`   Category: ${d.category}`);
    console.log(`   Message: ${d.message}`);
});

console.log("\n--- Sample Dead Code / other remaining Diagnostics ---");
const deadCodeDiags = diagnostics.filter(d => d.category === 'Dead Code' || d.category === 'DeadCode' || d.category === 'Dead code');
console.log(`Total Dead Code Diagnostics: ${deadCodeDiags.length}`);
deadCodeDiags.slice(0, 10).forEach((d, idx) => {
    console.log(`${idx + 1}. File: ${d.filePath}:${d.line}:${d.column}`);
    console.log(`   Rule: ${d.rule}`);
    console.log(`   Message: ${d.message}`);
});
