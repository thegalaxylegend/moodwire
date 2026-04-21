const fs = require('fs');
const dir = 'src/content/blogs';
const slugs = [
    'comparing-quantities-class-8-notes',
    'cubes-and-cube-roots-class-8-notes',
    'databases-dbms-class-12-notes',
    'rational-numbers-class-8-notes',
];
for (const s of slugs) {
    const c = fs.readFileSync(dir + '/' + s + '.md', 'utf8');
    // Find what the regex matches
    const regex = /\{[\s\S]*?"heading":[\s\S]*?"body":/;
    const match = c.match(regex);
    if (match) {
        const start = match.index;
        const snippet = c.substring(Math.max(0, start - 20), Math.min(c.length, start + 120));
        console.log(`\n${s}:`);
        console.log(`  Match at position ${start}:`);
        console.log(`  Context: ...${snippet.replace(/\n/g, '\\n')}...`);
    } else {
        console.log(`\n${s}: NO MATCH`);
    }
}
