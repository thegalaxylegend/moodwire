import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    let numWorkers = Math.min(8, os.cpus().length || 4);
    if (process.env.CF_PAGES === '1' || process.env.CI || process.env.GITHUB_ACTIONS) {
        console.log(`⚠️ CI/Cloudflare/GitHub environment detected. Restricting parallel workers to 2 to prevent Out of Memory errors.`);
        numWorkers = 2;
    }
    console.log(`🚀 Spawning ${numWorkers} parallel workers for SSG prerendering...\n`);

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < numWorkers; i++) {
        const worker = spawn('node', [
            path.join(__dirname, 'prerender-all.js'),
            `--part=${i}`,
            `--total-parts=${numWorkers}`
        ], { stdio: 'inherit' });

        promises.push(new Promise((resolve, reject) => {
            worker.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ Worker ${i + 1}/${numWorkers} finished successfully.`);
                    resolve();
                } else {
                    console.error(`❌ Worker ${i + 1}/${numWorkers} failed with exit code ${code}.`);
                    reject(new Error(`Worker ${i} failed`));
                }
            });
        }));
    }

    try {
        await Promise.all(promises);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n🎉 All parallel prerendering workers completed successfully in ${duration}s!`);
        process.exit(0);
    } catch (err) {
        console.error('\n❌ One or more prerendering workers failed:', err);
        process.exit(1);
    }
}

main();
