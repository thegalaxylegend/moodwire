const fs = require('fs');
const path = require('path');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
    if (line.trim() && line.includes('write_to_file') && line.includes('FounderPage.tsx')) {
        const obj = JSON.parse(line);
        console.log("FOUND WRITE_TO_FILE FOR FounderPage.tsx at step_index:", obj.step_index);
        fs.writeFileSync('C:\\Users\\Admin\\Downloads\\Desktop\\recovered_write.json', JSON.stringify(obj, null, 2));
    }
}
console.log("Scan complete!");
