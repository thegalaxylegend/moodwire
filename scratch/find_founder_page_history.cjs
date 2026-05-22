const fs = require('fs');
const path = require('path');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
                if ((tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') && 
                    JSON.stringify(tc.args).includes('FounderPage.tsx')) {
                    console.log(`Step ${obj.step_index}: Tool: ${tc.name}`);
                    if (tc.name === 'write_to_file') {
                        console.log(`  Length of CodeContent: ${tc.args.CodeContent ? tc.args.CodeContent.length : 0}`);
                    }
                }
            }
        }
    } catch (e) {
        // ignore
    }
}
