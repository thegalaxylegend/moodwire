const fs = require('fs');
const path = require('path');

let text = fs.readFileSync('scratch/diagnostics_v3.json', 'utf8');
// Strip BOM if present
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

console.log(`Total files to process: ${Object.keys(filesMap).length}`);

let sizeAxesFixed = 0;
let buttonFixed = 0;
let ellipsisFixed = 0;
let targetBlankFixed = 0;
let iframeFixed = 0;
let totalFilesModified = 0;

Object.entries(filesMap).forEach(([filePath, fileDiags]) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split(/\r?\n/);
    let modified = false;

    // Sort diagnostics by line descending so that modifying a line doesn't mess up line numbers above it
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
            if (line.includes('...')) {
                // Preceded by word or space, not a spread operator
                const newLine = line.replace(/(\w)\.\.\./g, '$1…');
                if (newLine !== line) {
                    line = newLine;
                    ellipsisFixed++;
                    modified = true;
                } else {
                    const spaceLine = line.replace(/\s\.\.\./g, ' …');
                    if (spaceLine !== line) {
                        line = spaceLine;
                        ellipsisFixed++;
                        modified = true;
                    }
                }
            }
        } else if (d.rule === 'jsx-no-target-blank') {
            // Specific fix for BlogPostPage.tsx:293
            if (line.includes('target={isExternal ? "_blank" : undefined}') && line.includes('rel={isExternal ? "noopener external" : undefined}')) {
                line = line.replace('rel={isExternal ? "noopener external" : undefined}', 'rel={isExternal ? "noopener noreferrer external" : undefined}');
                targetBlankFixed++;
                modified = true;
            }
        } else if (d.rule === 'iframe-missing-sandbox') {
            // Specific fix for VideoLecturePage.tsx:695 and ChapterStudyHub.tsx:120
            if (line.includes('<iframe') && !line.includes('sandbox=')) {
                line = line.replace('<iframe', '<iframe sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"');
                iframeFixed++;
                modified = true;
            }
        }

        lines[lineIdx] = line;
    });

    if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        totalFilesModified++;
    }
});

console.log(`\nFixing execution complete!`);
console.log(`- design-no-redundant-size-axes resolved: ${sizeAxesFixed}`);
console.log(`- button-has-type resolved: ${buttonFixed}`);
console.log(`- design-no-three-period-ellipsis resolved: ${ellipsisFixed}`);
console.log(`- jsx-no-target-blank resolved: ${targetBlankFixed}`);
console.log(`- iframe-missing-sandbox resolved: ${iframeFixed}`);
console.log(`- Total files written to disk: ${totalFilesModified}`);
