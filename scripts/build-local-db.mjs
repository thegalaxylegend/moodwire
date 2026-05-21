/**
 * build-local-db.mjs
 * Parses seed SQL files → clean public/local-db.json
 * Run: node scripts/build-local-db.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const SQL_FILES = [
    join(ROOT, 'scripts', 'seed.sql'),
    join(ROOT, 'scripts', 'seed_chunk1.sql'),
    join(ROOT, 'scripts', 'seed_chunk2.sql'),
];

const GARBAGE_PATTERNS = [
    /^practice question$/i,
    /^practice-question/i,
    /^sample question$/i,
    /^test question$/i,
];

const GARBAGE_OPTIONS = [
    'theoretical foundations',
    'practical applications',
    'experimental data',
    'historical context',
];

function isGarbage(q) {
    if (!q.question_text || q.question_text.trim().length < 20) return true;
    for (const p of GARBAGE_PATTERNS) {
        if (p.test(q.question_text.trim())) return true;
    }
    if (!Array.isArray(q.options) || q.options.length < 2) return true;
    // Check if options are all generic placeholders
    const lowerOpts = q.options.map(o => o.toLowerCase().trim());
    const garbageCount = lowerOpts.filter(o => GARBAGE_OPTIONS.includes(o)).length;
    if (garbageCount >= 2) return true;
    return false;
}

function parseOptions(raw) {
    try {
        // Handle SQL escaped unicode like \u00b5 or subscript chars
        const cleaned = raw
            .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/[\u2080-\u2089]/g, d => String.fromCharCode(48 + (d.codePointAt(0) - 0x2080)));
        return JSON.parse(cleaned);
    } catch {
        // Try manual extraction of quoted strings
        const matches = raw.match(/"([^"\\]|\\.)*"/g);
        return matches ? matches.map(m => m.slice(1, -1).replace(/\\"/g, '"')) : [];
    }
}

function resolveCorrectIndex(options, correctAnswerRaw) {
    if (!correctAnswerRaw) return -1;
    const ca = correctAnswerRaw.trim();
    
    // Single letter A/B/C/D
    if (/^[A-D]$/.test(ca)) return ca.charCodeAt(0) - 65;
    
    // Index number
    if (/^\d$/.test(ca)) return parseInt(ca);
    
    // Match option text (strip subscript/superscript noise)
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm = normalize(ca);
    const idx = options.findIndex(o => normalize(o) === norm);
    if (idx !== -1) return idx;
    
    // Partial match fallback
    for (let i = 0; i < options.length; i++) {
        if (normalize(options[i]).includes(norm.slice(0, 8))) return i;
    }
    return 0; // default to first option if can't resolve
}

function extractQuestionsFromSQL(sql) {
    const questions = [];
    
    // Match each VALUES block
    const valueBlockRegex = /VALUES\s*\(\s*([\s\S]*?)\s*\)\s*;/g;
    let match;
    
    while ((match = valueBlockRegex.exec(sql)) !== null) {
        const block = match[1];
        
        try {
            // Extract fields by position using careful parsing
            // Fields: id, exam, class, subject, primary_topic_id, primary_topic, primary_subtopic,
            //         secondary_topic_ids, concept_tags, cross_chapter, cross_subject, also_for,
            //         type, has_image, difficulty_score, difficulty_band, step_count, negative_marking,
            //         question_text, options, correct_answer,
            //         explanation, solution_steps, key_formula, error_trap_type,
            //         source_exam, year, quality_tier, confidence, created_at, verified
            
            const fields = parseValueBlock(block);
            if (!fields || fields.length < 21) continue;
            
            const [
                id, exam, cls, subject,
                topicId, topic, subtopic,
                _secTopics, conceptTagsRaw, _crossCh, _crossSub, _alsoFor,
                type, _hasImg,
                diffScore, _diffBand, _steps, _neg,
                questionText, optionsRaw, correctAnswerRaw,
                explanation
            ] = fields;
            
            const options = parseOptions(optionsRaw || '[]');
            if (!options || options.length < 2) continue;
            
            const correctIndex = resolveCorrectIndex(options, correctAnswerRaw);
            
            const q = {
                id: id?.replace(/'/g, ''),
                exam: exam?.replace(/'/g, ''),
                subject: subject?.replace(/'/g, ''),
                topic: topic?.replace(/'/g, ''),
                subtopic: subtopic?.replace(/'/g, ''),
                type: type?.replace(/'/g, '') || 'MCQ',
                difficulty_score: parseInt(diffScore) || 1000,
                question: questionText?.replace(/^'|'$/g, '').replace(/''/g, "'"),
                options,
                correct_answer: correctAnswerRaw?.replace(/^'|'$/g, ''),
                correctAnswerIndex: correctIndex,
                explanation: explanation?.replace(/^'|'$/g, '').replace(/''/g, "'") || '',
                concept_tags: (() => { try { return JSON.parse(conceptTagsRaw || '[]'); } catch { return []; } })(),
            };
            
            if (!isGarbage({ question_text: q.question, options: q.options })) {
                questions.push(q);
            }
        } catch (e) {
            // Skip malformed rows
        }
    }
    
    return questions;
}

/**
 * Parse a SQL VALUES(...) block into an array of field strings.
 * Handles single-quoted strings (with '' escaping), numbers, NULL.
 */
function parseValueBlock(block) {
    const fields = [];
    let i = 0;
    const s = block.trim();
    
    while (i < s.length) {
        // Skip whitespace and commas between fields
        while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r' || s[i] === ',')) i++;
        if (i >= s.length) break;
        
        if (s[i] === "'") {
            // Single-quoted string
            let val = "'";
            i++;
            while (i < s.length) {
                if (s[i] === "'" && s[i + 1] === "'") {
                    val += "''";
                    i += 2;
                } else if (s[i] === "'") {
                    val += "'";
                    i++;
                    break;
                } else {
                    val += s[i++];
                }
            }
            fields.push(val);
        } else if (s[i] === '[' || s[i] === '{') {
            // JSON array/object (might be unquoted in SQL)
            let depth = 0;
            let val = '';
            while (i < s.length) {
                if (s[i] === '[' || s[i] === '{') depth++;
                else if (s[i] === ']' || s[i] === '}') depth--;
                val += s[i++];
                if (depth === 0) break;
            }
            fields.push(val);
        } else {
            // Number or NULL or keyword
            let val = '';
            while (i < s.length && s[i] !== ',' && s[i] !== '\n') {
                val += s[i++];
            }
            fields.push(val.trim());
        }
    }
    
    return fields;
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log('🔨 Building local-db.json from seed SQL files...\n');

const allQuestions = [];
const seenIds = new Set();

for (const file of SQL_FILES) {
    try {
        const sql = readFileSync(file, 'utf8');
        const qs = extractQuestionsFromSQL(sql);
        let added = 0;
        for (const q of qs) {
            if (!seenIds.has(q.id) && q.question && q.question.length > 20) {
                seenIds.add(q.id);
                allQuestions.push(q);
                added++;
            }
        }
        console.log(`✅ ${file.split('\\').pop()}: ${added} real questions extracted`);
    } catch (e) {
        console.warn(`⚠️  Could not read ${file}: ${e.message}`);
    }
}

console.log(`\n📦 Total unique real questions: ${allQuestions.length}`);

// Group by subject for quick stats
const bySubject = {};
for (const q of allQuestions) {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
}
console.log('📊 By subject:', bySubject);

// Write output
const output = {
    generated_at: new Date().toISOString(),
    total: allQuestions.length,
    questions: allQuestions,
};

const outPath = join(ROOT, 'public', 'local-db.json');
writeFileSync(outPath, JSON.stringify(output, null, 0));
const size = (readFileSync(outPath).length / 1024).toFixed(1);
console.log(`\n✅ Written to public/local-db.json (${size} KB)`);
console.log('🚀 Done! The app will now use real questions on localhost.');
