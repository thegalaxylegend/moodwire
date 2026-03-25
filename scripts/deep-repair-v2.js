import fs from 'fs';
import path from 'path';

const blogsDir = './src/content/blogs';
const imagesDir = './public/blog-images';

async function repair() {
    console.log('🚀 Starting Deep Repair V2...');
    const blogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const diskImages = fs.readdirSync(imagesDir);

    // 1. Identify "Latest 6" based on modification time BEFORE we touch them
    const latestFiles = blogFiles
        .map(f => ({ name: f, mtime: fs.statSync(path.join(blogsDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 6)
        .map(f => f.name);

    console.log('📅 Latest 6 detected:', latestFiles);

    let fixedCount = 0;

    for (const file of blogFiles) {
        const filePath = path.join(blogsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const slug = file.replace('.md', '');

        // 2. Remove Merge Conflicts
        if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
            console.log(`🧹 Cleaning merge conflicts in ${file}`);
            content = content.replace(/<<<<<<<[\s\S]*?=======/g, '');
            content = content.replace(/>>>>>>>.*/g, '');
            // Clean up duplicate footers often caused by this
            const footerLine = '*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*';
            const footerCount = (content.match(new RegExp(footerLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (footerCount > 1) {
                content = content.replace(new RegExp(footerLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*', 'm'), footerLine);
            }
        }

        // Split frontmatter
        const parts = content.split('---');
        if (parts.length < 3) continue;
        let frontmatter = parts[1];
        const body = parts.slice(2).join('---');

        // 3. Fix Date
        const dateMatch = frontmatter.match(/^date:\s*["'](.*?)["']/m);
        if (latestFiles.includes(file)) {
            if (dateMatch) {
                frontmatter = frontmatter.replace(/^date:\s*["'](.*?)["']/m, 'date: "2026-03-25"');
            } else {
                frontmatter += '\ndate: "2026-03-25"';
            }
        } else if (!dateMatch) {
            frontmatter += '\ndate: "2026-03-22"';
        }

        // 4. Fix Image Path (Heavy Duty)
        const heroMatch = frontmatter.match(/^heroImage:\s*["'](.*?)["']/m) || frontmatter.match(/^hero_image:\s*["'](.*?)["']/m);
        let currentHero = heroMatch ? heroMatch[1] : '';
        let heroFilename = currentHero.split('/').pop();

        if (!diskImages.includes(heroFilename) || !currentHero || currentHero.includes('fallbacks')) {
            // Find best match in diskImages
            let bestMatch = '';
            // Try exact slug
            bestMatch = diskImages.find(img => img.startsWith(slug));
            
            // Try parts of slug
            if (!bestMatch) {
                const slugParts = slug.split('-');
                const shortSlug = slugParts.slice(0, 4).join('-');
                bestMatch = diskImages.find(img => img.includes(shortSlug));
            }

            // Try title words
            if (!bestMatch) {
                const titleMatch = frontmatter.match(/^title:\s*["'](.*?)["']/m);
                if (titleMatch) {
                    const titleWords = titleMatch[1].toLowerCase().split(' ').slice(0, 3);
                    bestMatch = diskImages.find(img => titleWords.every(word => img.toLowerCase().includes(word)));
                }
            }

            if (bestMatch) {
                const newHero = `/blog-images/${bestMatch}`;
                console.log(`🖼️  Fixed image for ${file}: ${newHero}`);
                if (heroMatch) {
                    frontmatter = frontmatter.replace(/^heroImage:\s*["'](.*?)["']/m, `heroImage: "${newHero}"`);
                    frontmatter = frontmatter.replace(/^hero_image:\s*["'](.*?)["']/m, `heroImage: "${newHero}"`);
                } else {
                    frontmatter += `\nheroImage: "${newHero}"`;
                }
                // Standardize to heroImage
                frontmatter = frontmatter.replace('hero_image:', 'heroImage:');
            }
        }

        // Final reconstruction
        const finalContent = `---\n${frontmatter.trim()}\n---\n${body.trim()}`;
        fs.writeFileSync(filePath, finalContent);
        fixedCount++;
    }

    console.log(`✅ Success: ${fixedCount} blogs deep-repaired.`);
}

repair();
