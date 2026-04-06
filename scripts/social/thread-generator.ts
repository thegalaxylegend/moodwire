import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
config({ path: path.resolve(__dirname, '../../.env') });

const BLOG_DIR = path.resolve(__dirname, '../../src/content/blogs');
const OUTPUT_DIR = path.resolve(__dirname, '../../social-output/threads');
const BASE_URL = 'https://examcompass.pages.dev';

/**
 * 🤖 Generate Thread with Groq AI
 */
async function generateThreadWithAI(slug: string, content: string): Promise<string | null> {
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY_2;
    if (!apiKey) {
        console.error("❌ GROQ_API_KEY is missing in .env");
        return null;
    }

    const groq = new Groq({ apiKey });

    // Extract basic title and high-yield points for better AI context
    const titleMatch = content.match(/title:\s*["']?([^"'\n]+)/);
    const title = titleMatch ? titleMatch[1] : slug;

    const prompt = `
    You are an expert educational ghostwriter for 'ExamCompass'. 
    Your goal is to create a viral, high-value Twitter/X thread about: "${title}".
    
    BLOG CONTENT:
    ${content.slice(0, 4000)}

    THREAD STRUCTURE RULES:
    1. Tweet 1 (THE HOOK): Must be a "stop-your-scroll" opener about why this topic matters for JEE/NEET.
    2. Tweets 2-5 (THE VALUE): Break down 3-4 critical points or "trap" mistakes students make. Use bullet points.
    3. Final Tweet (THE CTA): Direct them to the full guide: ${BASE_URL}/blog/${slug} 
    4. Use "---" (tripple dash) to separate each tweet in your response.
    5. Keep each tweet under 280 characters.
    6. Include relevant emojis but keep it professional (Academic/Expert tone).
    `;

    try {
        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1500
        });
        return result.choices[0]?.message?.content?.trim() || null;
    } catch (e: any) {
        console.error(`❌ AI Generation failed for ${slug}:`, e.message);
        return null;
    }
}


/**
 * 🚀 Post to X (Twitter)
 */
async function postToSocials(thread: string, slug: string) {
    const tweets = thread
        .split('---')
        .map(t => t.trim())
        .filter(t => t.length > 5);

    if (tweets.length === 0) {
        console.log(`⚠️ No valid tweets found in AI output for ${slug}`);
        return;
    }

    // 𝕏 (Twitter) Posting logic
    const xConfig = {
        appKey: process.env.X_API_KEY as string,
        appSecret: process.env.X_API_SECRET as string,
        accessToken: process.env.X_ACCESS_TOKEN as string,
        accessSecret: process.env.X_ACCESS_SECRET as string,
    };

    if (xConfig.appKey && xConfig.accessToken) {
        console.log(`📤 Publishing thread to 𝕏 (@Ayush_thelegend)...`);
        try {
            const client = new TwitterApi(xConfig);
            const userClient = client.readWrite;
            
            await userClient.v2.tweetThread(tweets);
            console.log(`✅ Successfully posted thread for ${slug} to 𝕏!`);
        } catch (e: any) {
            console.error(`❌ 𝕏 Posting failed for ${slug}:`, e.data || e.message);
        }
    } else {
        console.log(`ℹ️ Skipping 𝕏 post for ${slug}: Credentials not fully set in .env`);
    }

    // 🧵 Threads Posting (Placeholder for future API expansion)
    if (process.env.THREADS_ACCESS_TOKEN) {
        console.log(`ℹ️ Threads posting for ${slug} is queued (Pending API implementation)`);
    }
}

async function main() {
    console.log('\n🧵 ExamCompass Social Automation Engine\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const args = process.argv.slice(2);
    let slugsToProcess: string[] = [];
    
    if (args.includes('--recent')) {
        const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
        const withDates = files.map(f => {
            const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
            const dateMatch = content.match(/date:\s*["']?([\d-]+)/);
            return { file: f, date: dateMatch ? dateMatch[1] : '0000-00-00' };
        }).sort((a, b) => b.date.localeCompare(a.date));
        
        // Take top 3 for automation
        slugsToProcess = withDates.slice(0, 3).map(f => f.file.replace('.md', ''));
        console.log(`📋 Auto-processing the 3 most recent blogs...\n`);
    } else if (args.length > 0 && !args[0].startsWith('--')) {
        slugsToProcess = [args[0]];
    } else {
        console.log("Usage: npx tsx scripts/social/thread-generator.ts [slug] OR --recent");
        process.exit(1);
    }
    
    for (const slug of slugsToProcess) {
        try {
            const filePath = path.join(BLOG_DIR, `${slug}.md`);
            if (!fs.existsSync(filePath)) {
                console.log(`❌ Blog file not found: ${slug}`);
                continue;
            }
            
            console.log(`🤖 Generating AI Thread for: ${slug}...`);
            const content = fs.readFileSync(filePath, 'utf-8');
            const threadText = await generateThreadWithAI(slug, content);
            
            if (threadText) {
                // Save draft
                const outputPath = path.join(OUTPUT_DIR, `${slug}.txt`);
                fs.writeFileSync(outputPath, threadText, 'utf-8');
                
                // Post to socials
                await postToSocials(threadText, slug);
            }
        } catch (error: any) {
            console.error(`⚠️ Error processing ${slug}:`, error.message);
            // Skip to next instead of crashing
        }
        
        // Anti-rate-limit sleep
        await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('\n✨ Automation script complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});
