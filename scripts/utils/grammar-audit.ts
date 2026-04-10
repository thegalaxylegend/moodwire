/**
 * 🎓 Jules Academic Grammar & Tone Auditor (Feature 2.4)
 * 
 * Uses the free LanguageTool API to refine blog content.
 * Helps eliminate double spaces, typos, and improve academic flow.
 */

import fs from 'fs';
import path from 'path';

export async function auditGrammar(text: string): Promise<string> {
    try {
        console.log(`📡 Jules is auditing grammar via LanguageTool API...`);
        
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('language', 'en-US');

        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            body: params
        });

        if (!response.ok) {
            console.error(`❌ LanguageTool API Error: ${response.status} ${response.statusText}`);
            return text;
        }

        const data: any = await response.json();
        const matches = data.matches || [];

        if (matches.length === 0) {
            console.log(`✅ No grammatical issues found by LanguageTool.`);
            return text;
        }

        let correctedText = text;
        let autoFixedCount = 0; // Only count what we actually change

        // Apply automatic fixes for simple errors (e.g. MORPHOLOGY, TYPOS, WHITESPACE)
        // Sort matches by offset from end to start to avoid index shifting after replacement
        const sortableMatches = matches.sort((a: any, b: any) => b.offset - a.offset);

        for (const match of sortableMatches) {
            const ruleCategory = match.rule.category.id;
            const replacement = match.replacements?.[0]?.value;

            // Only auto-fix simple categories to avoid AI hallucinations
            if (replacement && (ruleCategory === 'TYPOS' || ruleCategory === 'PUNCTUATION' || ruleCategory === 'WHITESPACE' || ruleCategory === 'CASING')) {
                const start = match.offset;
                const length = match.length;
                
                correctedText = correctedText.substring(0, start) + replacement + correctedText.substring(start + length);
                autoFixedCount++;
            }
        }

        if (autoFixedCount > 0) {
            console.log(`✨ Auto-fixed ${autoFixedCount} issues (${matches.length} total detected, only TYPOS/PUNCTUATION/WHITESPACE/CASING auto-applied).`);
        } else {
            console.log(`✅ No auto-fixable issues. (${matches.length} detected issues require manual review.)`);
        }
        return correctedText;
    } catch (err: any) {
        console.error(`❌ Grammar Audit Error: ${err.message}`);
        return text;
    }
}

// CLI usage
if (process.argv[1].includes('grammar-audit')) {
    const filePath = process.argv[2];
    if (filePath && fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf-8');
        auditGrammar(text).then(corrected => {
            if (process.argv.includes('--write')) {
                fs.writeFileSync(filePath, corrected);
                console.log('✅ File updated with corrections.');
            } else {
                console.log('\n--- CORRECTED TEXT ---\n', corrected);
            }
        });
    } else {
        console.log('Usage: npx tsx scripts/utils/grammar-audit.ts <file_path> [--write]');
    }
}
