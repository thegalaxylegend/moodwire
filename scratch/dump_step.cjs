const fs = require('fs');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 138 || obj.step_index === 283) {
            console.log(`--- STEP ${obj.step_index} ---`);
            console.log(JSON.stringify(obj, null, 2));
        }
    } catch (e) {
        // ignore
    }
}
