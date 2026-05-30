const fs = require('fs');
const path = require('path');

let text = fs.readFileSync('scratch/diagnostics_v4.json', 'utf8');
// Strip BOM if present
if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
}
const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

// Filter for core source files in src/
const srcDiags = diagnostics.filter(d => d.filePath.startsWith('src/'));

console.log(`Total diagnostics in src/: ${srcDiags.length}`);

// Group by severity
const bySeverity = {};
// Group by rule
const byRule = {};

srcDiags.forEach(d => {
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
    byRule[d.rule] = (byRule[d.rule] || 0) + 1;
});

console.log("\nBy Severity in src/:", bySeverity);
console.log("\nBy Rule in src/:");
const sortedRules = Object.entries(byRule).sort((a,b) => b[1] - a[1]);
sortedRules.forEach(([rule, count]) => {
    console.log(`  - ${rule}: ${count}`);
});

console.log("\n--- ERROR level diagnostics in src/ ---");
const errors = srcDiags.filter(d => d.severity === 'error');
errors.forEach((d, idx) => {
    console.log(`${idx + 1}. File: ${d.filePath}:${d.line}:${d.column}`);
    console.log(`   Rule: ${d.rule}`);
    console.log(`   Message: ${d.message}`);
});
