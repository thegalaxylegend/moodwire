const fs = require('fs');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 283) {
            console.log("Found step 283");
            const tc = obj.tool_calls[0];
            const chunksString = tc.args.ReplacementChunks;
            console.log("chunksString length:", chunksString.length);
            console.log("Start:", chunksString.substring(0, 200));
            console.log("End:", chunksString.substring(chunksString.length - 200));
        }
    } catch (e) {
        // ignore
    }
}
