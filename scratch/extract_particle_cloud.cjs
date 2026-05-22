const fs = require('fs');
const logPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\98b6d1d6-def7-46c9-9107-1d86e0f8d6df\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    if (line.includes('ParticleCloud') && line.includes('"source":"MODEL"')) {
        try {
            const obj = JSON.parse(line);
            if (obj.tool_calls) {
                for (const tc of obj.tool_calls) {
                    const argStr = JSON.stringify(tc.args);
                    if (argStr.includes('ParticleCloud')) {
                        console.log(`FOUND ParticleCloud in step_index ${obj.step_index}, Tool: ${tc.name}`);
                        if (tc.name === 'multi_replace_file_content') {
                            const chunks = tc.args.ReplacementChunks;
                            if (chunks) {
                                chunks.forEach((chunk, cIdx) => {
                                    if (chunk.ReplacementContent && chunk.ReplacementContent.includes('ParticleCloud')) {
                                        console.log(`  Writing Replacement Chunk ${cIdx} for step ${obj.step_index}`);
                                        fs.writeFileSync(`C:\\Users\\Admin\\Downloads\\Desktop\\extracted_pc_chunk_${obj.step_index}_${cIdx}.txt`, chunk.ReplacementContent);
                                    }
                                });
                            }
                        } else if (tc.name === 'replace_file_content') {
                            if (tc.args.ReplacementContent && tc.args.ReplacementContent.includes('ParticleCloud')) {
                                console.log(`  Writing Replacement Content for step ${obj.step_index}`);
                                fs.writeFileSync(`C:\\Users\\Admin\\Downloads\\Desktop\\extracted_pc_rep_${obj.step_index}.txt`, tc.args.ReplacementContent);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
}
console.log("Done!");
