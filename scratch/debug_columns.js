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

function extractValuesTupleAndCols(statement) {
  let inString = false;
  for (let i = 0; i < statement.length; i++) {
    if (statement[i] === "'") {
      if (inString) {
        if (i + 1 < statement.length && statement[i + 1] === "'") {
          i++;
        } else {
          inString = false;
        }
      } else {
        inString = true;
      }
    } else if (!inString) {
      if (statement.slice(i, i + 10).toLowerCase() === ') values (') {
        const colsStr = statement.slice(0, i + 1);
        const valStr = statement.slice(i + 10);
        let valInString = false;
        let lastParenIdx = -1;
        for (let j = 0; j < valStr.length; j++) {
          if (valStr[j] === "'") {
            if (valInString) {
              if (j + 1 < valStr.length && valStr[j + 1] === "'") {
                j++;
              } else {
                valInString = false;
              }
            } else {
              valInString = true;
            }
          } else if (!valInString) {
            if (valStr.slice(j, j + 2) === ');') {
              lastParenIdx = j;
            }
          }
        }
        if (lastParenIdx !== -1) {
          return { colsStr, tupleStr: valStr.slice(0, lastParenIdx) };
        }
      }
    }
  }
  return null;
}

function parseSqlValues(tupleStr) {
  const values = [];
  let i = 0;
  const len = tupleStr.length;

  while (i < len) {
    while (i < len && (tupleStr[i] === ',' || tupleStr[i] === ' ' || tupleStr[i] === '\t' || tupleStr[i] === '\n' || tupleStr[i] === '\r')) i++;
    if (i >= len) break;

    if (tupleStr[i] === "'") {
      let val = '';
      i++;
      while (i < len) {
        if (tupleStr[i] === "'") {
          if (i + 1 < len && tupleStr[i + 1] === "'") {
            val += "'";
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          val += tupleStr[i];
          i++;
        }
      }
      values.push(val);
    } else if (tupleStr.slice(i, i + 4).toUpperCase() === 'NULL') {
      values.push(null);
      i += 4;
    } else {
      let numStr = '';
      while (i < len && tupleStr[i] !== ',' && tupleStr[i] !== ')') {
        numStr += tupleStr[i];
        i++;
      }
      const trimmed = numStr.trim();
      if (trimmed === '') {
        // skip
      } else if (!isNaN(Number(trimmed))) {
        values.push(Number(trimmed));
      } else {
        values.push(trimmed);
      }
    }
  }

  return values;
}

async function run() {
  for await (const stmt of getStatements(SEED_PATH)) {
    const res = extractValuesTupleAndCols(stmt);
    if (res) {
      const values = parseSqlValues(res.tupleStr);
      if (values.length === 31) {
        console.log('Found a 31-column statement!');
        console.log('Columns Statement Prefix:', res.colsStr.slice(0, 300));
        
        // Extract column names inside parens: INSERT OR IGNORE INTO questions (col1, col2...)
        const colsMatch = res.colsStr.match(/\(([^]+)\)$/m);
        if (colsMatch) {
          const colList = colsMatch[1].split(',').map(s => s.trim());
          console.log('Parsed Columns list:', colList);
          console.log('Count:', colList.length);
        }
        break;
      }
    }
  }
}

run().catch(console.error);
