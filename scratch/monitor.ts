import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_FILE = path.join(__dirname, '..', 'scripts', 'seed.sql');

function getCount(): number {
  if (!fs.existsSync(SEED_FILE)) return 0;
  const content = fs.readFileSync(SEED_FILE, 'utf-8');
  const matches = content.match(/INSERT OR IGNORE INTO questions \(/g);
  return matches ? matches.length : 0;
}

const initialCount = getCount();
const startTime = Date.now();
const lastCount = initialCount;
const lastTime = startTime;

const history: { time: number; count: number }[] = [];

console.clear();
console.log('====================================================');
console.log('📊 EXAMCOMPASS LIVE GENERATION MONITOR');
console.log(`   Monitoring: ${path.basename(SEED_FILE)}`);
console.log('====================================================\n');

setInterval(() => {
  const currentCount = getCount();
  const currentTime = Date.now();
  
  history.push({ time: currentTime, count: currentCount });
  // Keep only the last 10 seconds of history
  while (history.length > 0 && currentTime - history[0].time > 10000) {
    history.shift();
  }
  
  const elapsedTotalSec = (currentTime - startTime) / 1000;
  const totalNew = currentCount - initialCount;
  
  // Rolling speed over the last 10 seconds
  let questionsPerSec = 0;
  if (history.length > 1) {
    const first = history[0];
    const elapsedRollingSec = (currentTime - first.time) / 1000;
    const rollingNew = currentCount - first.count;
    questionsPerSec = elapsedRollingSec > 0 ? (rollingNew / elapsedRollingSec) : 0;
  }
  
  // Average speed (questions per minute)
  const questionsPerMin = elapsedTotalSec > 0 ? (totalNew / elapsedTotalSec) * 60 : 0;
  
  // Format elapsed time (MM:SS)
  const min = Math.floor(elapsedTotalSec / 60).toString().padStart(2, '0');
  const sec = Math.floor(elapsedTotalSec % 60).toString().padStart(2, '0');

  // Print gorgeous dashboard in-place
  process.stdout.write(
    `\r` +
    `⏱️  Elapsed: ${min}:${sec} | ` +
    `📦 Total: \x1b[32m${currentCount.toLocaleString()}\x1b[0m (+${totalNew}) | ` +
    `⚡ Speed: \x1b[36m${questionsPerSec.toFixed(2)} q/sec\x1b[0m (${questionsPerMin.toFixed(0)} q/min)      `
  );
}, 1000);
