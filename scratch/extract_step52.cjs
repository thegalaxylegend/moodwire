const fs = require('fs');
const path = require('path');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
    if (line.trim()) {
        const obj = JSON.parse(line);
        if (obj.step_index === 52 || obj.step_index === 56 || obj.step_index === 60 || obj.step_index === 62) {
            console.log("FOUND STEP:", obj.step_index);
            // Let's look inside tool_calls
            if (obj.tool_calls) {
                for (const tc of obj.tool_calls) {
                    if (tc.name === 'write_to_file' && tc.args.CodeContent) {
                        const content = tc.args.CodeContent;
                        fs.writeFileSync(`C:\\Users\\Admin\\Downloads\\Desktop\\recovered_step${obj.step_index}.tsx`, content);
                        console.log(`Wrote recovered_step${obj.step_index}.tsx`);
                    }
                }
            }
        }
    }
}
console.log("Done!");
