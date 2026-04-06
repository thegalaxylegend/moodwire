/**
 * 📊 Syllabus Completion Statistics (Feature 4.2)
 * 
 * Calculates the percentage of coverage for each Subject and Class
 * based on the SYLLABUS_DB in constants.ts.
 * 
 * Run: npx tsx scripts/syllabus-stats.ts
 */

import fs from 'fs';
import path from 'path';
import { SYLLABUS_DB } from '../src/lib/constants.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOGS_DIR = path.join(__dirname, '../src/content/blogs');
const REPORT_FILE = path.join(__dirname, '../jules-reports/syllabus-completion.json');

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
    console.log('\n📈 Calculating Syllabus Completion Stats...');

    const existingBlogs = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
    const stats: any = {
        overall: { total: 0, completed: 0, percentage: 0 },
        bySubject: {},
        byClass: {}
    };

    // 1. Process Subjects
    for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
        if (!stats.bySubject[subject]) {
            stats.bySubject[subject] = { total: 0, completed: 0, percentage: 0 };
        }

        topics.forEach(t => {
            const slugPart = slugify(t.topic);
            const isCompleted = existingBlogs.some(b => b.includes(slugPart));

            stats.overall.total++;
            stats.bySubject[subject].total++;
            
            if (!stats.byClass[t.class]) {
                stats.byClass[t.class] = { total: 0, completed: 0, percentage: 0 };
            }
            stats.byClass[t.class].total++;

            if (isCompleted) {
                stats.overall.completed++;
                stats.bySubject[subject].completed++;
                stats.byClass[t.class].completed++;
            }
        });
    }

    // 2. Finalize Percentages
    stats.overall.percentage = Math.round((stats.overall.completed / stats.overall.total) * 100);
    
    for (const s of Object.keys(stats.bySubject)) {
        stats.bySubject[s].percentage = Math.round((stats.bySubject[s].completed / stats.bySubject[s].total) * 100);
    }
    
    for (const c of Object.keys(stats.byClass)) {
        stats.byClass[c].percentage = Math.round((stats.byClass[c].completed / stats.byClass[c].total) * 100);
    }

    // 3. Save
    const PUBLIC_REPORT_FILE = path.join(__dirname, '../public/jules-reports/syllabus-completion.json');
    if (!fs.existsSync(path.dirname(REPORT_FILE))) fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
    if (!fs.existsSync(path.dirname(PUBLIC_REPORT_FILE))) fs.mkdirSync(path.dirname(PUBLIC_REPORT_FILE), { recursive: true });

    fs.writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
    fs.writeFileSync(PUBLIC_REPORT_FILE, JSON.stringify(stats, null, 2));

    console.log('\n═'.repeat(40));
    console.log(`🌍 OVERALL PROGRESS: ${stats.overall.percentage}% (${stats.overall.completed}/${stats.overall.total})`);
    console.log('═'.repeat(40));
    
    console.log('\n📚 By Subject:');
    Object.entries(stats.bySubject).sort((a:any, b:any) => b[1].percentage - a[1].percentage).forEach(([s, data]: [string, any]) => {
        const bar = '█'.repeat(Math.floor(data.percentage / 5)).padEnd(20, '░');
        console.log(`${s.padEnd(15)} | ${bar} | ${data.percentage}%`);
    });

    console.log('\n🎓 By Class:');
    Object.entries(stats.byClass).sort((a:any, b:any) => b[0].localeCompare(a[0])).forEach(([c, data]: [string, any]) => {
        const bar = '█'.repeat(Math.floor(data.percentage / 5)).padEnd(20, '░');
        console.log(`${c.padEnd(15)} | ${bar} | ${data.percentage}%`);
    });

    console.log(`\n📄 Stats saved: jules-reports/syllabus-completion.json`);
    console.log(`📄 Public sync: public/jules-reports/syllabus-completion.json\n`);
    console.log('\n✨ Syllabus completion check complete!');
}

main().catch(err => {
    console.error('❌ Syllabus Stats Failed (Non-Critical):', err.message);
    process.exit(0); // Never crash the pipeline for stats
});
