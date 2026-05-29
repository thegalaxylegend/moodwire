const fs = require('fs');

const filePath = 'c:/Users/Admin/Downloads/Desktop/src/lib/videoLibraryDB.ts';
const content = fs.readFileSync(filePath, 'utf8');

const videoRegex = /\{([\s\S]*?)\}/g;
let match;
const videos = [];

const fakePatterns = [
    'QhQO2Rk5Q',
    'QhQO2Rk5c',
    'eQO2Rk5',
    '1w9wE',
    'fI2lQ', // lGkYj_fI2lQ is fake, real current pyq is lGkYj_fI2l0
    'fI2l0' // wait, lGkYj_fI2l0 is real, it's electrostatics pyq, but current electricity has lGkYj_fI2lQ which is fake
];

while ((match = videoRegex.exec(content)) !== null) {
    const block = match[1];
    if (block.includes('chapterId:') && block.includes('id:')) {
        const idMatch = block.match(/id:\s*["']([^"']+)["']/);
        const titleMatch = block.match(/title:\s*["']([^"']+)["']/);
        const videoUrlMatch = block.match(/videoUrl:\s*["']([^"']+)["']/);
        const chapterIdMatch = block.match(/chapterId:\s*["']([^"']+)["']/);
        
        if (idMatch) {
            videos.push({
                id: idMatch[1],
                title: titleMatch ? titleMatch[1] : '',
                videoUrl: videoUrlMatch ? videoUrlMatch[1] : '',
                chapterId: chapterIdMatch ? chapterIdMatch[1] : ''
            });
        }
    }
}

console.log(`Parsed ${videos.length} videos.`);
let realCount = 0;
videos.forEach((v) => {
    const isFake = fakePatterns.some(p => v.videoUrl.includes(p));
    if (!isFake) {
        realCount++;
        console.log(`REAL => ID: ${v.id} | Title: ${v.title} | URL: ${v.videoUrl}`);
    }
});
console.log(`Total real videos by URL: ${realCount}`);
