import { AcademicSearchService } from '../src/services/academicSearchService.js';

async function runTests() {
    console.log('🧪 Starting Academic API Suite Tests...\n');

    // 1. Wikipedia Test
    console.log('🔹 Testing Wikipedia API...');
    const atomWiki = await AcademicSearchService.getWikiSummary('Atom');
    if (atomWiki) {
        console.log('✅ Wikipedia Success:', atomWiki.title);
        console.log('   Excerpt:', atomWiki.extract.substring(0, 100) + '...');
    } else {
        console.error('❌ Wikipedia Failed');
    }

    // 2. arXiv Test
    console.log('\n🔹 Testing arXiv API...');
    const physicsPapers = await AcademicSearchService.searchArXiv('Quantum Mechanics', 1);
    if (physicsPapers.length > 0) {
        console.log('✅ arXiv Success:', physicsPapers[0].title);
        console.log('   Summary:', physicsPapers[0].summary.substring(0, 100) + '...');
    } else {
        console.error('❌ arXiv Failed');
    }

    // 3. Newton Math Test
    console.log('\n🔹 Testing Newton Math API...');
    const derivation = await AcademicSearchService.mathOperation('derive', 'x^2');
    if (derivation === '2 x') {
        console.log('✅ Newton Success: d/dx[x^2] =', derivation);
    } else {
        console.warn('⚠️ Newton Returned unexpected value (but API worked):', derivation);
        if (derivation) console.log('✅ Newton Connection OK');
    }

    // 4. Open Library Test
    console.log('\n🔹 Testing Open Library API...');
    const scienceBooks = await AcademicSearchService.searchBooks('Modern Physics', 1);
    if (scienceBooks.length > 0) {
        console.log('✅ Open Library Success:', scienceBooks[0].title, 'by', scienceBooks[0].author);
    } else {
        console.error('❌ Open Library Failed');
    }

    console.log('\n🏁 Academic API Diagnostics Complete.');
}

runTests().catch(console.error);
