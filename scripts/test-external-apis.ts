import { ExternalApiService } from '../src/services/externalApiService.js';
import 'dotenv/config';

async function testExternalApis() {
    console.log('🧪 Starting External API Integration Test...\n');

    // 1. Dictionary Test
    console.log('📖 Testing Dictionary API (Word: "Nucleus")...');
    const definition = await ExternalApiService.getDefinition('nucleus');
    if (definition) {
        console.log(`✅ Success: ${definition.meanings[0].definitions[0].definition.substring(0, 100)}...`);
    } else {
        console.log('❌ Failed: Dictionary API');
    }

    // 2. Wikipedia Test
    console.log('\n🌐 Testing Wikipedia API (Topic: "Quantum Mechanics")...');
    const wiki = await ExternalApiService.getWikiSummary('Quantum_mechanics');
    if (wiki) {
        console.log(`✅ Success: ${wiki.extract.substring(0, 100)}...`);
    } else {
        console.log('❌ Failed: Wikipedia API');
    }

    // 3. Quotes Test
    console.log('\n📜 Testing Quotable API...');
    const quote = await ExternalApiService.getDailyQuote();
    if (quote) {
        console.log(`✅ Success: "${quote.content}" - ${quote.author}`);
    } else {
        console.log('❌ Failed: Quotable API');
    }

    // 4. Exa Search Test
    console.log('\n🔍 Testing Exa AI Search (Query: "CBSE Class 10 Exam Dates 2026")...');
    const searchResults = await ExternalApiService.searchWeb('CBSE Class 10 Exam Dates 2026');
    if (searchResults && searchResults.length > 0) {
        console.log(`✅ Success: Found ${searchResults.length} results.`);
        console.log(`   Top Result: ${searchResults[0].title} (${searchResults[0].url})`);
    } else {
        console.log('❌ Failed: Exa AI Search (Check VITE_EXA_API_KEY in .env)');
    }

    // 5. Wolfram Alpha Test
    console.log('\n🔢 Testing Wolfram Alpha (Input: "derivative of x^2 + 5x")...');
    const wolfram = await ExternalApiService.getWolframResults('derivative of x^2 + 5x');
    if (wolfram && !wolfram.error) {
        console.log(`✅ Success: Wolfram found ${wolfram.pods?.length || 0} data pods.`);
        const resultPod = wolfram.pods?.find((p: any) => p.id === 'Result');
        if (resultPod) {
            console.log(`   Result: ${resultPod.subpods[0].plaintext}`);
        }
    } else {
        console.log('❌ Failed: Wolfram Alpha (Check VITE_WOLFRAM_APP_ID in .env)');
    }

    console.log('\n🏁 Test Suite Complete.');
}

testExternalApis().catch(err => {
    console.error('💥 Test Suite Crashed:', err);
});
