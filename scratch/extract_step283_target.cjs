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
            
            // Safely evaluate the string as a JS expression to bypass JSON.parse strict control-char limits
            const chunks = new Function("return " + chunksString)();
            console.log("Number of chunks parsed via JS evaluation:", chunks.length);
            
            chunks.forEach((chunk, idx) => {
                console.log(`Chunk ${idx} TargetContent length:`, chunk.TargetContent ? chunk.TargetContent.length : 'undefined');
                if (chunk.TargetContent) {
                    fs.writeFileSync(`C:\\Users\\Admin\\Downloads\\Desktop\\step283_chunk_${idx}_target.txt`, chunk.TargetContent);
                    console.log(`Wrote chunk ${idx} TargetContent to step283_chunk_${idx}_target.txt`);
                }
            });
        }
    } catch (e) {
        console.error("Error parsing/evaluating chunks at step 283:", e);
    }
}
console.log("Done!");
