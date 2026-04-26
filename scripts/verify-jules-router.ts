
import { nodeRouter } from './utils/nodeRouter';
import { MODELS } from '../src/lib/routingConfig';
import 'dotenv/config';

async function verifyJules() {
    console.log('🚀 INITIALIZING JULES ROUTER VERIFICATION...\n');

    const tiers = ['T1', 'T2'] as const;
    
    for (const tier of tiers) {
        console.log(`\n--- 🛡️ TESTING TIER: ${tier} ---`);
        try {
            console.log(`📡 Sending test request to ${tier} chain...`);
            const start = Date.now();
            
            const responseContent = await nodeRouter.route(
                [{ role: 'user', content: 'Say "Jules is Online" in exactly 3 words.' }],
                tier,
                { max_tokens: 20, temperature: 0 }
            );

            const duration = Date.now() - start;
            console.log(`✅ SUCCESS [${duration}ms]`);
            console.log(`💬 Response: "${responseContent.trim()}"`);
            
            if (responseContent.toLowerCase().includes('jules is online')) {
                console.log('✨ VERIFIED: Quality output received.');
            } else {
                console.log('⚠️ WARNING: Output content mismatch, but API responded.');
            }

        } catch (err: any) {
            console.error(`❌ FAILURE in Tier ${tier}: ${err.message}`);
            if (err.stack) console.error(err.stack.split('\n').slice(0, 3).join('\n'));
        }
    }

    console.log('\n--- 🔑 PROVIDER HEALTH SUMMARY ---');
    // @ts-ignore - accessing private state for debug
    const state = nodeRouter['state'];
    console.log('Provider Indices:');
    console.log(`  - Gemini: ${state.gemini.keyIndex} / ${state.gemini.keys.length} keys`);
    console.log(`  - Groq:   ${state.groq.keyIndex} / ${state.groq.keys.length} keys`);
    
    console.log('\n🏁 VERIFICATION COMPLETE.');
}

verifyJules().catch(err => {
    console.error('💥 CRITICAL ERROR DURING VERIFICATION:');
    console.error(err);
    process.exit(1);
});
