const fs = require('fs');
const path = require('path');

let text = fs.readFileSync('scratch/diagnostics_v3.json', 'utf8');
if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
}
const data = JSON.parse(text);
const diagnostics = data.projects[0].diagnostics;

// Filter for core source files in src/
const srcDiags = diagnostics.filter(d => d.filePath.startsWith('src/'));

// Group by filePath
const filesMap = {};
srcDiags.forEach(d => {
    if (!filesMap[d.filePath]) {
        filesMap[d.filePath] = [];
    }
    filesMap[d.filePath].push(d);
});

console.log(`Total files with diagnostics: ${Object.keys(filesMap).length}`);

let sizeAxesFixed = 0;
let buttonFixed = 0;
let ellipsisFixed = 0;
const modifiedFiles = {};

Object.entries(filesMap).forEach(([filePath, fileDiags]) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split(/\r?\n/);
    let modified = false;

    // Sort diagnostics by line descending
    const sortedDiags = [...fileDiags].sort((a, b) => b.line - a.line);

    sortedDiags.forEach(d => {
        const lineIdx = d.line - 1;
        if (lineIdx < 0 || lineIdx >= lines.length) return;
        let line = lines[lineIdx];

        if (d.rule === 'design-no-redundant-size-axes') {
            const match = d.message.match(/([wh]-\S+)\s+([wh]-\S+)\s*→\s*use\s+the\s+shorthand\s+(size-\S+)/);
            if (match) {
                const part1 = match[1];
                const part2 = match[2];
                const replacement = match[3];
                
                const comb1 = `${part1} ${part2}`;
                const comb2 = `${part2} ${part1}`;
                
                if (line.includes(comb1)) {
                    line = line.replace(comb1, replacement);
                    sizeAxesFixed++;
                    modified = true;
                } else if (line.includes(comb2)) {
                    line = line.replace(comb2, replacement);
                    sizeAxesFixed++;
                    modified = true;
                }
            }
        } else if (d.rule === 'button-has-type') {
            if (line.includes('<button') && !line.includes('type=')) {
                line = line.replace('<button', '<button type="button"');
                buttonFixed++;
                modified = true;
            }
        } else if (d.rule === 'design-no-three-period-ellipsis') {
            // Replace ... with … safely
            if (line.includes('...')) {
                // Preceded by word or space, not a spread operator
                const newLine = line.replace(/(\w)\.\.\./g, '$1…');
                if (newLine !== line) {
                    line = newLine;
                    ellipsisFixed++;
                    modified = true;
                } else {
                    // Try replacing space... with space…
                    const spaceLine = line.replace(/\s\.\.\./g, ' …');
                    if (spaceLine !== line) {
                        line = spaceLine;
                        ellipsisFixed++;
                        modified = true;
                    }
                }
            }
        }

        lines[lineIdx] = line;
    });

    if (modified) {
        modifiedFiles[filePath] = lines.join('\n');
    }
});

console.log(`\nDry run complete.`);
console.log(`- design-no-redundant-size-axes fixable: ${sizeAxesFixed}`);
console.log(`- button-has-type fixable: ${buttonFixed}`);
console.log(`- design-no-three-period-ellipsis fixable: ${ellipsisFixed}`);
console.log(`- Total files modified in memory: ${Object.keys(modifiedFiles).length}`);
