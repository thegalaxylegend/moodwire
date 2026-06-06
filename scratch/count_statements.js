import { createReadStream } from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_PATH = path.join(__dirname, '..', 'scripts', 'seed.sql');

async function* getStatements(filePath) {
  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity
  });

  let statementBuffer = [];
  let inString = false;

  for await (const line of rl) {
    if (statementBuffer.length === 0) {
      const trimmed = line.trim();
      if (trimmed.startsWith('--') || trimmed === '') {
        continue;
      }
    }

    statementBuffer.push(line);

    for (let i = 0; i < line.length; i++) {
      if (line[i] === "'") {
        if (inString) {
          if (i + 1 < line.length && line[i + 1] === "'") {
            i++;
          } else {
            inString = false;
          }
        } else {
          inString = true;
        }
      }
    }

    if (!inString) {
      const trimmedLine = line.trim();
      if (trimmedLine.endsWith(');')) {
        const fullStatement = statementBuffer.join('\n');
        statementBuffer = [];
        yield fullStatement;
      }
    }
  }
}

async function run() {
  let count = 0;
  for await (const stmt of getStatements(SEED_PATH)) {
    count++;
  }
  console.log(`Total statements returned: ${count}`);
}

run().catch(console.error);
