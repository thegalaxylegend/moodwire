import fs from 'fs';
import path from 'path';
import { reconstructBullets, standardizeMarkdown } from './scripts/utils/jules-quality.ts';
import { generateExtras, callLlmWithFallback } from './scripts/blog-generator.ts';

async function repair(slug: string) {
    const filePath = path.join(process.cwd(), `src/content/blogs/${slug}.md`);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Identify Topic
    const titleMatch = content.match(/title:\s*"(.*?)"/);
    const topic = titleMatch ? titleMatch[1].split(' Class ')[0] : slug.replace(/-/g, ' ');
    
    console.log(`🔧 Repairing ${slug} (Topic: ${topic})...`);

    // 2. Generate Fresh Conceptual Summary
    // We mock the item structure for generateExtras
    const item = { topic, class: content.includes('Class 12') ? '12' : '11', subject: 'Mathematics' }; 
    if (slug.includes('operating-systems')) item.subject = 'Computer Science';
    if (slug.includes('circles')) item.class = '10';

    const { recall } = await generateExtras(item, "");

    // 3. Fix Layout & Remove Quick Recall
    // Strip existing quick-summary
    content = content.replace(/<div class="quick-summary">[\s\S]*?<\/div>/gi, '');

    // 4. Force Bullet Reconstruction on Sections
    // We look for headers like ## Ayush's Note and the content until the next ##
    const sections = content.split(/\n## /);
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].includes("Note") || sections[i].includes("Mistakes") || sections[i].includes("Box")) {
            // Only fix if it looks messy (has .,- or ,- )
            if (sections[i].includes('.,-') || sections[i].includes(',-')) {
                 console.log(`   ✨ Fixing messy bullets in section: ${sections[i].split('\n')[0]}`);
                 sections[i] = reconstructBullets(sections[i]);
            }
        }
    }
    content = sections.join('\n## ');

    // 5. Correct Practice Link
    const numericClass = slug.includes('class-12') ? 12 : slug.includes('class-10') ? 10 : 11;
    const subjectPath = slug.includes('operating-systems') ? 'computer-science' : 'mathematics';
    const topicSlug = topic.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
    const correctedPracticeLink = `/class-${numericClass}/${subjectPath}/${topicSlug}`;

    // 6. Restandardize
    const metaMatch = {
        title: titleMatch ? titleMatch[1] : "",
        heroImage: content.match(/heroImage:\s*"(.*?)"/)?.[1] || "",
        lastUpdated: new Date().toISOString().split('T')[0],
        practiceLink: correctedPracticeLink,
        recall: recall
    };
    
    const finalContent = standardizeMarkdown(content, metaMatch);
    fs.writeFileSync(filePath, finalContent);
    console.log(`   ✅ Repaired ${slug}`);
}

const blogs = [
    'circles-class-10-notes',
    'areas-related-to-circles-class-10-notes',
    'operating-systems-class-12-notes',
    'trigonometric-functions-class-11-revision-notes-jee-neet'
];

(async () => {
    for (const b of blogs) {
        await repair(b);
    }
})();
