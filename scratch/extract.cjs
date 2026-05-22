const fs = require('fs');
const path = require('path');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
    if (line.trim() && line.includes('"step_index":72')) {
        const obj = JSON.parse(line);
        console.log("FOUND STEP 72");
        fs.writeFileSync('C:\\Users\\Admin\\Downloads\\Desktop\\recovered_step72.json', JSON.stringify(obj, null, 2));
    }
    if (line.trim() && line.includes('"step_index":62')) {
        const obj = JSON.parse(line);
        console.log("FOUND STEP 62");
        fs.writeFileSync('C:\\Users\\Admin\\Downloads\\Desktop\\recovered_step62.json', JSON.stringify(obj, null, 2));
    }
}
console.log("Extraction complete!");
