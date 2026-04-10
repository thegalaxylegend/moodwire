
import { nodeRouter } from '../scripts/utils/nodeRouter.js';

async function verifyRotation() {
    console.log("🧪 Testing NodeRouter Key Rotation across 10 calls...");
    
    const messages = [{ role: "user", content: "Say 'Key Rotation Active'" }];
    
    for (let i = 0; i < 5; i++) {
        try {
            const result = await nodeRouter.route(messages, 'T1');
            console.log(`✅ Call ${i+1}: ${result.slice(0, 30)}...`);
        } catch (e: any) {
            console.error(`❌ Call ${i+1} Failed:`, e.message);
        }
    }
}

verifyRotation();
